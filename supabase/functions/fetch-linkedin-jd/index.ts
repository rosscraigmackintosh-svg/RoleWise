// =============================================================================
// fetch-linkedin-jd — LinkedIn job fetch edge function
// Reads the user's li_at session cookie from profiles table,
// fetches the LinkedIn job via the Voyager API, and returns structured job data.
//
// Strategy: LinkedIn's authenticated pages are now a React SPA that doesn't
// server-side render job data. We use the internal Voyager JSON API instead:
//   1. GET linkedin.com/ with li_at → collect JSESSIONID cookie (= CSRF token)
//   2. GET voyager/api/jobs/jobPostings/{id} with li_at + JSESSIONID + Csrf-Token header
//   3. Parse the JSON response for title, description, location, company, etc.
//
// Deploy: supabase functions deploy fetch-linkedin-jd
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const LI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS })
  }

  let body: { url?: string; userId?: string } = {}
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }) }

  const { url, userId } = body
  if (!url) return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: CORS_HEADERS })

  // ── Extract job ID from any LinkedIn jobs URL format ──────────────────────
  const jobId = extractLinkedInJobId(url)
  if (!jobId) return new Response(JSON.stringify({ error: 'Could not extract job ID from URL. Use a linkedin.com/jobs URL.' }), { status: 400, headers: CORS_HEADERS })

  // ── Get li_at cookie from profiles table ──────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let liAt: string | null = null
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('linkedin_session_cookie')
      .eq('id', userId)
      .single()
    liAt = profile?.linkedin_session_cookie || null
  }

  if (!liAt) {
    return new Response(JSON.stringify({
      error: 'no_session',
      message: 'LinkedIn session not set. Add your li_at cookie in Settings → LinkedIn Session.',
    }), { status: 401, headers: CORS_HEADERS })
  }

  // ── Step 1: Fetch linkedin.com homepage to collect JSESSIONID cookie ──────
  // LinkedIn's Voyager API requires a CSRF token = JSESSIONID cookie value.
  let jsessionId: string | null = null
  try {
    const initRes = await fetch('https://www.linkedin.com/', {
      headers: {
        'Cookie': `li_at=${liAt}`,
        'User-Agent': LI_UA,
        'Accept': 'text/html',
      },
      redirect: 'follow',
    })

    // Extract JSESSIONID from Set-Cookie headers
    const setCookieHeader = initRes.headers.get('set-cookie') || ''
    const jsMatch = setCookieHeader.match(/JSESSIONID=([^;,\s]+)/)
    if (jsMatch) jsessionId = decodeURIComponent(jsMatch[1])
  } catch (_err) {
    // Non-fatal: try without JSESSIONID (may work for some job IDs)
    console.error('[fetch-linkedin-jd] JSESSIONID fetch failed:', _err)
  }

  if (!jsessionId) {
    return new Response(JSON.stringify({
      error: 'csrf_failed',
      message: 'Could not establish LinkedIn session. Your li_at cookie may have expired — update it in Settings.',
    }), { status: 401, headers: CORS_HEADERS })
  }

  const cookieHeader = `li_at=${liAt}; JSESSIONID=${jsessionId}`

  // ── Step 2: Call the Voyager jobs API ─────────────────────────────────────
  const voyagerUrl = `https://www.linkedin.com/voyager/api/jobs/jobPostings/${jobId}?decorationId=com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-65`
  let voyagerData: Record<string, unknown> = {}
  let voyagerIncluded: Array<Record<string, unknown>> = []

  try {
    const apiRes = await fetch(voyagerUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': LI_UA,
        'Accept': 'application/vnd.linkedin.normalized+json+2.1',
        'X-Li-Lang': 'en_US',
        'X-RestLi-Protocol-Version': '2.0.0',
        'Csrf-Token': jsessionId,
      },
    })

    if (apiRes.status === 401 || apiRes.status === 403) {
      return new Response(JSON.stringify({
        error: 'session_expired',
        message: 'LinkedIn session has expired. Please update your li_at cookie in Settings.',
      }), { status: 401, headers: CORS_HEADERS })
    }
    if (!apiRes.ok) {
      return new Response(JSON.stringify({ error: 'fetch_failed', status: apiRes.status }), { status: 502, headers: CORS_HEADERS })
    }

    const json = await apiRes.json()
    voyagerData    = (json.data    || {}) as Record<string, unknown>
    voyagerIncluded = (json.included || []) as Array<Record<string, unknown>>
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: CORS_HEADERS })
  }

  // ── Step 3: Parse the Voyager response ───────────────────────────────────
  const job = parseVoyagerJob(voyagerData, voyagerIncluded, jobId)

  return new Response(JSON.stringify({ success: true, job }), { headers: CORS_HEADERS })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractLinkedInJobId(url: string): string | null {
  const patterns = [
    /linkedin\.com\/jobs\/view\/(\d+)/,
    /currentJobId=(\d+)/,
    /\/jobs\/[^?]*?(\d{10,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

function parseVoyagerJob(
  data: Record<string, unknown>,
  included: Array<Record<string, unknown>>,
  jobId: string,
): Record<string, unknown> {
  // Description is a pemberly text object: { text: string, attributes: [...] }
  const descObj = data.description as Record<string, unknown> | string | undefined
  let description: string | null = null
  if (typeof descObj === 'string') {
    description = descObj || null
  } else if (descObj && typeof descObj === 'object') {
    description = (descObj.text as string) || null
  }

  // Title (may have location appended, e.g. "Senior PM - London")
  const rawTitle = (data.title as string) || null

  // Location
  const location = (data.formattedLocation as string) || null

  // Employment type (URN format → human label)
  const empStatus = (data.employmentStatus as string) || ''
  const employmentType = empStatus.includes('FULL_TIME')   ? 'Full-time'
    : empStatus.includes('PART_TIME')  ? 'Part-time'
    : empStatus.includes('CONTRACT')   ? 'Contract'
    : empStatus.includes('TEMPORARY')  ? 'Temporary'
    : empStatus.includes('INTERNSHIP') ? 'Internship'
    : empStatus.includes('VOLUNTEER')  ? 'Volunteer'
    : null

  // Work remote
  const remote = data.workRemoteAllowed === true ? 'Remote' : null

  // Posted date (epoch ms → ISO string)
  const listedMs = data.originalListedAt as number | undefined
  const postedDate = listedMs ? new Date(listedMs).toISOString().split('T')[0] : null

  // Apply URL
  const applyUrl = (data.jobPostingUrl as string) || `https://www.linkedin.com/jobs/view/${jobId}/`

  // Company: from included items where $type contains "Company" and item has name
  let company: string | null = null
  for (const item of included) {
    const t = (item['$type'] as string) || ''
    if ((t.includes('Company') || t.includes('company')) && typeof item.name === 'string') {
      company = item.name
      break
    }
  }

  // Salary: baseSalary from data (rare, but present on some postings)
  const salaryObj = data.salary as Record<string, unknown> | undefined
  let salaryText: string | null = null
  if (salaryObj?.value) {
    const sv = salaryObj.value as Record<string, unknown>
    const min  = sv?.minValue ?? sv?.value
    const max  = sv?.maxValue
    const curr = (salaryObj?.currency as string) || ''
    salaryText = max ? `${min}–${max} ${curr}`.trim() : min ? `${min} ${curr}`.trim() : null
  }

  return {
    job_id:          jobId,
    linkedin_url:    applyUrl,
    title:           rawTitle   || null,
    company:         company    || null,
    location:        location   || null,
    description:     description || null,
    salary_text:     salaryText || null,
    employment_type: employmentType || null,
    work_remote:     remote     || null,
    posted_date:     postedDate || null,
  }
}
