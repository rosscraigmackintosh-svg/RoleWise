/**
 * RoleWise — Recruiter Backfill Script
 * ======================================
 * Repairs historical roles that contain recruiter info in their JD text or job URL
 * but are missing the role_recruiters join row (and possibly the recruiter record itself).
 *
 * HOW TO RUN:
 *   1. Open the RoleWise app in your browser and sign in.
 *   2. Open DevTools → Console.
 *   3. Paste this entire script and press Enter.
 *   4. Results are logged to the console.
 *
 * SAFETY:
 *   - Idempotent: already-linked roles are skipped.
 *   - Conservative matching: email → linkedin_url → exact name+company.
 *     No fuzzy matching. Ambiguous matches are skipped, not merged.
 *   - Does not overwrite existing recruiter records.
 *   - Uses link_source='backfill' so backfilled links are distinguishable.
 *   - Unique-constraint violations on role_recruiters are caught and treated as
 *     "already exists" (idempotency safeguard).
 *
 * DETECTION SOURCES (in priority order):
 *   1. job_description_raw — explicit recruiter labels, named emails, LinkedIn URLs in text
 *   2. job_url — LinkedIn recruiter profile URLs (linkedin.com/in/{slug}),
 *                known recruitment agency domains (company hint only)
 *   URL signals are supporting only; JD text takes precedence for name and email.
 *
 * MATCHING RULES (in priority order):
 *   1. Email — exact case-insensitive match against recruiters.email
 *   2. LinkedIn URL — exact match against recruiters.linkedin_url
 *   3. Name + Company — exact case-insensitive match on both fields together
 *   If more than one recruiter matches any criterion, the role is skipped and
 *   flagged as AMBIGUOUS for manual review.
 *
 * REQUIRES: `db` (Supabase client) and `detectRecruiterFromJD` to be in scope.
 * `detectRecruiterFromURL` is self-contained in this script (no app dependency).
 */

// ── Self-contained URL detection (mirrors detectRecruiterFromURL in the app) ─
function _backfillDetectFromURL(jobUrl) {
  if (!jobUrl || typeof jobUrl !== 'string') return null;
  let linkedin = null, nameHint = null, companyHint = null;
  try {
    const liM = jobUrl.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
    if (liM) {
      linkedin = `https://www.linkedin.com/in/${liM[1]}`;
      const parts = liM[1].split('-');
      if (parts.length >= 2 && parts.length <= 3 && parts.every(p => /^[a-z]{2,}$/.test(p))) {
        nameHint = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }
    }
    const hostname = new URL(jobUrl).hostname.toLowerCase().replace(/^www\./, '');
    const AGENCY_DOMAINS = new Map([
      ['hays.com','Hays'],['hays.co.uk','Hays'],
      ['michaelpage.com','Michael Page'],['michaelpage.co.uk','Michael Page'],
      ['reed.co.uk','Reed'],
      ['robertwalters.com','Robert Walters'],['robertwalters.co.uk','Robert Walters'],
      ['manpower.com','ManpowerGroup'],
      ['adecco.com','Adecco'],['adecco.co.uk','Adecco'],
      ['randstad.com','Randstad'],['randstad.co.uk','Randstad'],
      ['zebrapeople.com','Zebra People'],
      ['functionalworks.com','Functional Works'],
      ['dover.com','Dover'],['dover.io','Dover'],
      ['search.co.uk','Search'],
      ['hudson.com','Hudson'],
      ['talentful.co','Talentful'],['talentful.com','Talentful'],
    ]);
    for (const [domain, company] of AGENCY_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) { companyHint = company; break; }
    }
  } catch (_) { return null; }
  if (!linkedin && !companyHint) return null;
  return { linkedin, nameHint, companyHint };
}

async function backfillRecruiterLinks() {
  // Guard: check required globals are present
  if (typeof db === 'undefined' || typeof detectRecruiterFromJD === 'undefined') {
    console.error('[Backfill] ERROR: `db` or `detectRecruiterFromJD` not in scope. Run this from the RoleWise app console.');
    return null;
  }

  const log   = [];
  const stats = {
    total:               0,
    withRecruiterData:   0,
    alreadyLinked:       0,
    linkedToExisting:    0,
    newRecruiterCreated: 0,
    skippedInsufficient: 0,
    ambiguous:           0,
    errors:              0,
    urlOnlyDetections:   0, // roles where URL contributed signal not found in JD text
  };

  function record(roleLabel, result) {
    log.push({ role: roleLabel, result });
    console.log(`  [${result}] ${roleLabel}`);
  }

  // ── Step 1: Fetch all roles ───────────────────────────────────────────────
  const { data: roles, error: rolesErr } = await db
    .from('roles')
    .select('id, role_title, company_name, job_description_raw, job_url, role_recruiters(id, recruiter_id)')
    .order('created_at', { ascending: false });

  if (rolesErr) {
    console.error('[Backfill] Failed to fetch roles:', rolesErr.message);
    return null;
  }

  stats.total = roles.length;
  console.log(`[Backfill] Scanning ${stats.total} roles…`);
  console.log('');

  // ── Step 2: Process each role ─────────────────────────────────────────────
  for (const role of roles) {
    const roleLabel = `${role.role_title || 'Untitled'} — ${role.company_name || 'Unknown'}`;

    // Already linked — skip
    if (role.role_recruiters && role.role_recruiters.length > 0) {
      stats.alreadyLinked++;
      record(roleLabel, 'SKIPPED: already linked');
      continue;
    }

    // ── Detect from JD text (primary) and URL (supporting) ────────────────
    const jdDetected  = detectRecruiterFromJD(role.job_description_raw);
    const urlDetected = _backfillDetectFromURL(role.job_url);

    // Merge: JD is authoritative for name/email; URL supplements linkedin + company
    const detected = {
      name:        jdDetected?.name     || urlDetected?.nameHint    || null,
      email:       jdDetected?.email    || null,
      linkedin:    jdDetected?.linkedin || urlDetected?.linkedin    || null,
      companyHint: urlDetected?.companyHint                          || null,
    };

    const hasSignal = detected.name || detected.email || detected.linkedin;

    if (!hasSignal) {
      // Check if URL contributed nothing but JD also had nothing
      if (!jdDetected && !urlDetected) {
        record(roleLabel, 'SKIPPED: no recruiter signals in JD text or URL');
      } else {
        stats.skippedInsufficient++;
        record(roleLabel, 'SKIPPED: insufficient data after merge (no name, email, or LinkedIn)');
      }
      continue;
    }

    // Track URL-only contributions for the summary
    if (!jdDetected && urlDetected) stats.urlOnlyDetections++;

    stats.withRecruiterData++;

    // ── Conservative match against existing recruiters ───────────────────
    let recruiterId = null;
    let matchMethod = null;

    // Priority 1: email
    if (detected.email) {
      const { data: byEmail } = await db
        .from('recruiters')
        .select('id, name')
        .ilike('email', detected.email)
        .limit(2);
      if (byEmail && byEmail.length === 1) {
        recruiterId = byEmail[0].id;
        matchMethod = `email match (${detected.email})`;
      } else if (byEmail && byEmail.length > 1) {
        stats.ambiguous++;
        record(roleLabel, `AMBIGUOUS: multiple recruiters share email ${detected.email} — needs manual review`);
        continue;
      }
    }

    // Priority 2: LinkedIn URL
    if (!recruiterId && detected.linkedin) {
      const { data: byLi } = await db
        .from('recruiters')
        .select('id, name')
        .eq('linkedin_url', detected.linkedin)
        .limit(2);
      if (byLi && byLi.length === 1) {
        recruiterId = byLi[0].id;
        matchMethod = `linkedin_url match (${detected.linkedin})`;
      } else if (byLi && byLi.length > 1) {
        stats.ambiguous++;
        record(roleLabel, 'AMBIGUOUS: multiple recruiters share that linkedin_url — needs manual review');
        continue;
      }
    }

    // Priority 3: exact name + company (both must match)
    if (!recruiterId && detected.name && role.company_name) {
      const { data: byNameCo } = await db
        .from('recruiters')
        .select('id, name, company')
        .ilike('name', detected.name)
        .ilike('company', role.company_name)
        .limit(2);
      if (byNameCo && byNameCo.length === 1) {
        recruiterId = byNameCo[0].id;
        matchMethod = `name+company match (${detected.name} @ ${role.company_name})`;
      } else if (byNameCo && byNameCo.length > 1) {
        stats.ambiguous++;
        record(roleLabel, `AMBIGUOUS: multiple recruiters named ${detected.name} at ${role.company_name} — needs manual review`);
        continue;
      }
    }

    // ── Create new recruiter if no safe match ────────────────────────────
    if (!recruiterId) {
      if (!detected.name) {
        stats.skippedInsufficient++;
        record(roleLabel, `SKIPPED: no name to create recruiter (linkedin: ${detected.linkedin || 'none'}, email: ${detected.email || 'none'})`);
        continue;
      }

      const { data: newRec, error: recErr } = await db
        .from('recruiters')
        .insert({
          name:         detected.name,
          // companyHint is the recruiter's employer (agency), not the hiring company
          company:      detected.companyHint || null,
          email:        detected.email       || null,
          linkedin_url: detected.linkedin    || null,
        })
        .select('id')
        .single();

      if (recErr || !newRec) {
        stats.errors++;
        record(roleLabel, `ERROR: could not create recruiter "${detected.name}": ${recErr?.message || 'unknown'}`);
        continue;
      }

      recruiterId = newRec.id;
      stats.newRecruiterCreated++;
      const source = !jdDetected && urlDetected ? ' [URL-detected]' : '';
      record(roleLabel, `CREATED new recruiter "${detected.name}"${source} (company: ${detected.companyHint || 'none'}, email: ${detected.email || 'none'})`);
    } else {
      stats.linkedToExisting++;
      record(roleLabel, `LINKED to existing recruiter via ${matchMethod}`);
    }

    // ── Insert the role_recruiters join row ──────────────────────────────
    const { error: linkErr } = await db
      .from('role_recruiters')
      .insert({
        role_id:      role.id,
        recruiter_id: recruiterId,
        link_source:  'backfill',
      });

    if (linkErr) {
      if (linkErr.code === '23505') {
        record(roleLabel, 'NOTE: join row already existed (constraint hit — treated as success)');
      } else {
        stats.errors++;
        record(roleLabel, `ERROR: could not insert role_recruiters row: ${linkErr.message}`);
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   RoleWise Recruiter Backfill — Summary           ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`  Total roles scanned:             ${stats.total}`);
  console.log(`  Roles with detectable recruiter:  ${stats.withRecruiterData}`);
  console.log(`    …of which URL-only detections:  ${stats.urlOnlyDetections}`);
  console.log(`  Already linked (skipped):         ${stats.alreadyLinked}`);
  console.log(`  Linked to existing recruiter:     ${stats.linkedToExisting}`);
  console.log(`  New recruiter record created:     ${stats.newRecruiterCreated}`);
  console.log(`  Skipped — insufficient data:      ${stats.skippedInsufficient}`);
  console.log(`  Ambiguous — needs manual review:  ${stats.ambiguous}`);
  console.log(`  Errors:                           ${stats.errors}`);
  console.log('');

  if (stats.ambiguous > 0)
    console.warn('[Backfill] Some roles had ambiguous matches. Search above for AMBIGUOUS.');
  if (stats.errors > 0)
    console.warn('[Backfill] Some rows had errors. Search above for ERROR.');
  if (stats.linkedToExisting + stats.newRecruiterCreated > 0)
    console.log('[Backfill] Done. Refresh the RoleWise app to see updated links in the Recruiters panel.');
  else
    console.log('[Backfill] No new links created.');

  return stats;
}

backfillRecruiterLinks();
