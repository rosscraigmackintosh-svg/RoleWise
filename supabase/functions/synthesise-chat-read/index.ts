// =============================================================================
// synthesise-chat-read — Conversational synthesis layer for chat-ingest mode
//
// Reads the canonical _narrative (from reason-and-narrate or the Deep path)
// and produces an opinionated, paced conversational read.
//
// IMPORTANT:
// - This does NOT replace or alter the canonical narrative. Saved role pages
//   continue to render the 11-section structured output.
// - The synth output (chat_read) is presentation-only. It is NOT persisted
//   into jd_matches.output_json. Chat-ingest stores it on the client-side
//   session + localStorage shadow only.
// - If this function fails, the chat surface falls back to the existing
//   section-by-section renderer. It is a quality lift, not a hard dependency.
//
// Deploy: supabase functions deploy synthesise-chat-read
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callAI, type AIProvider } from '../_shared/ai-call.ts'
import { OPENAI_SYSTEM_PROMPT, CHAT_SYNTH_VERSION } from './prompts/openai.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

// Route-specific override. Default is gpt-4.1-mini — synthesis from an
// already-structured input is a transformation task; mini is plenty.
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL_CHAT_SYNTH')
                  || 'gpt-4.1-mini'

// Reuse the same candidate-context formatter shape as reason-and-narrate so
// the voice rules (you-for-friction, candidate-coding bans) carry through.
function formatCandidateContext(ctx: Record<string, unknown> | null): string {
  if (!ctx || typeof ctx !== 'object') return ''

  const lines: string[] = ['CANDIDATE CONTEXT']
  lines.push('(The reader IS this candidate. The synthesis addresses them as "you". Never use the name in output.)')
  lines.push('')

  const id = ctx.identity as Record<string, string> | undefined
  if (id) {
    lines.push('WHO: ' + [id.name, id.seniority, (id.years_experience ? id.years_experience + ' years experience' : null), id.location].filter(Boolean).join(' | '))
  }

  const strengths = ctx.core_strengths as string[] | undefined
  if (Array.isArray(strengths) && strengths.length) {
    lines.push('', 'CORE STRENGTHS:')
    strengths.forEach(s => lines.push('- ' + s))
  }

  const envs = ctx.preferred_environments as string[] | undefined
  if (Array.isArray(envs) && envs.length) {
    lines.push('', 'PREFERRED ENVIRONMENTS:')
    envs.forEach(s => lines.push('- ' + s))
  }

  const frictions = ctx.known_frictions as string[] | undefined
  if (Array.isArray(frictions) && frictions.length) {
    lines.push('', 'KNOWN FRICTIONS:')
    frictions.forEach(s => lines.push('- ' + s))
  }

  return lines.join('\n')
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta || typeof meta !== 'object') return ''
  const lines = ['ROLE META']
  const entries: Array<[string, string]> = [
    ['Title',        String(meta.role_title    || '')],
    ['Company',      String(meta.company_name  || '')],
    ['Location',     String(meta.location      || '')],
    ['Work model',   String(meta.work_model    || '')],
    ['Engagement',   String(meta.engagement_type || '')],
    ['Salary',       String(meta.salary || '')],
    ['IR35',         String(meta.ir35 || '')],
  ]
  for (const [k, v] of entries) {
    if (v && v !== 'undefined' && v !== 'null') lines.push(`- ${k}: ${v}`)
  }
  return lines.length > 1 ? lines.join('\n') : ''
}

// ─── Output validation ──────────────────────────────────────────────────────
// Reject obviously-malformed or empty synth output. A failed validation is
// surfaced as a 422 so the client falls back to section rendering.
function validateChatRead(parsed: unknown): { ok: true; turns: Array<Record<string, unknown>> } | { ok: false; reason: string } {
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'not-an-object' }
  const turns = (parsed as Record<string, unknown>).turns
  if (!Array.isArray(turns)) return { ok: false, reason: 'turns-not-array' }
  if (turns.length === 0)    return { ok: false, reason: 'turns-empty' }
  if (turns.length > 8)      return { ok: false, reason: 'turns-too-many' }

  let bulletsCount = 0
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i] as Record<string, unknown>
    if (!t || typeof t !== 'object') return { ok: false, reason: `turn-${i}-not-object` }
    const type = t.type
    if (type === 'p') {
      const text = typeof t.text === 'string' ? t.text.trim() : ''
      if (!text) return { ok: false, reason: `turn-${i}-empty-text` }
    } else if (type === 'bullets') {
      bulletsCount++
      const lead = typeof t.lead === 'string' ? t.lead.trim() : ''
      const items = t.items
      if (!lead) return { ok: false, reason: `turn-${i}-empty-lead` }
      if (!Array.isArray(items) || items.length < 2 || items.length > 6) {
        return { ok: false, reason: `turn-${i}-bad-items` }
      }
      if (items.some(it => typeof it !== 'string' || !it.trim())) {
        return { ok: false, reason: `turn-${i}-empty-item` }
      }
    } else {
      return { ok: false, reason: `turn-${i}-unknown-type` }
    }
  }
  if (bulletsCount > 1) return { ok: false, reason: 'too-many-bullet-turns' }
  return { ok: true, turns: turns as Array<Record<string, unknown>> }
}

// ─── Request handler ───────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const {
      narrative,
      extraction,
      meta,
      candidate_context,
      verbosity_mode: requestedVerbosity,
      provider: requestedProvider,
    } = await req.json()

    if (!narrative || typeof narrative !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid narrative' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const verbosityMode: 'compact' | 'standard' | 'deep' =
      requestedVerbosity === 'compact' ? 'compact' :
      requestedVerbosity === 'deep'    ? 'deep'    : 'standard'

    const provider: AIProvider = requestedProvider === 'openai' ? 'openai' : 'openai'
    const apiKey = OPENAI_API_KEY
    const model  = OPENAI_MODEL
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No OpenAI API key configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Build user message — cache-friendly order: stable candidate context
    // first, then meta, then the structured analysis, then verbosity.
    let userMessage = ''
    const candidateBlock = formatCandidateContext(candidate_context || null)
    if (candidateBlock) userMessage += candidateBlock + '\n\n---\n\n'

    const metaBlock = formatMeta(meta || null)
    if (metaBlock) userMessage += metaBlock + '\n\n---\n\n'

    if (extraction && typeof extraction === 'object') {
      userMessage += `EXTRACTION (Pass 1 practical details):\n\n${JSON.stringify(extraction, null, 2)}\n\n---\n\n`
    }

    userMessage += `NARRATIVE JSON (canonical structured analysis — interpret, do not restate):\n\n${JSON.stringify(narrative, null, 2)}\n\n---\n\nVERBOSITY: ${verbosityMode}`

    const t0 = performance.now()
    const { text: rawText, usage } = await callAI({
      provider,
      systemPrompt: OPENAI_SYSTEM_PROMPT,
      userMessage,
      model,
      apiKey,
      maxTokens: 900, // ~340-word deep cap + JSON overhead
    })
    const latencyMs = Math.round(performance.now() - t0)

    let parsed: unknown
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('[synthesise-chat-read] JSON parse failed:', parseErr, 'raw:', rawText.slice(0, 200))
      return new Response(
        JSON.stringify({ error: 'Failed to parse synth JSON', raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const validation = validateChatRead(parsed)
    if (!validation.ok) {
      console.warn('[synthesise-chat-read] validation failed:', validation.reason)
      return new Response(
        JSON.stringify({ error: 'Synth output failed validation', reason: validation.reason, raw: rawText.slice(0, 500) }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Provenance stamps the client persists onto _provenance (presentation-
    // only; chat_read itself is not stored in output_json).
    usage.chat_synth_version = CHAT_SYNTH_VERSION
    usage.analysis_mode      = 'fast'

    console.log(`[synthesise-chat-read] OK provider=${provider} model=${model} version=${CHAT_SYNTH_VERSION} verbosity=${verbosityMode} turns=${validation.turns.length} latency_ms=${latencyMs}`)

    return new Response(
      JSON.stringify({
        chat_read: { turns: validation.turns },
        usage,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    console.error('[synthesise-chat-read] Uncaught error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
