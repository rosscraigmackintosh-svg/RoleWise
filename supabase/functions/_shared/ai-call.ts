// =============================================================================
// _shared/ai-call.ts — Provider abstraction for Rolewise AI calls
//
// Supports Anthropic (Claude) and OpenAI (GPT) with a common interface.
// Both providers receive the same system prompt + user message and return
// normalized { text, usage } so callers need no provider-specific logic.
//
// Usage:
//   import { callAI } from '../_shared/ai-call.ts'
//   const { text, usage } = await callAI({ provider, systemPrompt, userMessage, model, apiKey })
// =============================================================================

export type AIProvider = 'anthropic' | 'openai'

export interface AIUsage {
  model: string
  input_tokens: number | null
  output_tokens: number | null
  provider: AIProvider
  schema_failures?: string[]
  // Provenance stamps written by the edge function (not by the AI call itself):
  narrative_version?:       string  // e.g. "v32"
  analyse_jd_version?:      string  // e.g. "v20"
  role_reasoning_version?:  string  // e.g. "v1"
}

export interface AIResult {
  text: string
  usage: AIUsage
}

export interface AICallParams {
  provider: AIProvider
  systemPrompt: string
  userMessage: string
  model: string
  apiKey: string
  maxTokens?: number
}

export async function callAI(params: AICallParams): Promise<AIResult> {
  const { provider, systemPrompt, userMessage, model, apiKey, maxTokens = 2048 } = params

  if (provider === 'openai') {
    return callOpenAI({ systemPrompt, userMessage, model, apiKey, maxTokens })
  }
  return callAnthropic({ systemPrompt, userMessage, model, apiKey, maxTokens })
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(params: {
  systemPrompt: string
  userMessage: string
  model: string
  apiKey: string
  maxTokens: number
}): Promise<AIResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${errText}`)
  }

  const result = await response.json()
  return {
    text: result.content?.[0]?.text || '',
    usage: {
      model: params.model,
      input_tokens: result.usage?.input_tokens ?? null,
      output_tokens: result.usage?.output_tokens ?? null,
      provider: 'anthropic',
    },
  }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function callOpenAI(params: {
  systemPrompt: string
  userMessage: string
  model: string
  apiKey: string
  maxTokens: number
}): Promise<AIResult> {
  // GPT-5 and the o1/o3/o4 reasoning families reject `max_tokens` (400:
  // "Unsupported parameter"). They require `max_completion_tokens` instead.
  // Branch on model-name prefix so older Chat Completions models keep
  // working unchanged.
  const isReasoningModel = /^(gpt-5|o1|o3|o4)/i.test(params.model)
  const body: Record<string, unknown> = {
    model: params.model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
  }
  if (isReasoningModel) {
    body.max_completion_tokens = params.maxTokens
  } else {
    body.max_tokens = params.maxTokens
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('[OPENAI_ERROR_RAW]', { status: response.status, body: errText, model: params.model })
    throw new Error(`OpenAI API error ${response.status}: ${errText}`)
  }

  const result = await response.json()
  return {
    text: result.choices?.[0]?.message?.content || '',
    usage: {
      model: result.model || params.model,
      input_tokens: result.usage?.prompt_tokens ?? null,
      output_tokens: result.usage?.completion_tokens ?? null,
      provider: 'openai',
    },
  }
}
