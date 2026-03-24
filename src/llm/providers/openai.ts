import OpenAI from 'openai'
import { BaseLLMProvider } from './base.js'
import { LLMConfig, LLMProvider, LLMResponse, LLMUsage } from '../types.js'
import { calculateCost } from '../pricing.js'

export class OpenAIProvider extends BaseLLMProvider implements LLMProvider {
  private client: OpenAI
  private config: LLMConfig

  constructor(config: LLMConfig) {
    super()
    this.config = config
    this.client = new OpenAI({ apiKey: config.apiKey })
  }

  async generate(prompt: string, system?: string): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: prompt })

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: false,
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const result = this.parseJsonResponse(raw)

    if (response.usage) {
      const { inputCost, outputCost, totalCost } = calculateCost(
        this.config.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      )
      result.usage = {
        model: this.config.model,
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        inputCost,
        outputCost,
        totalCost,
      }
    }

    return result
  }

  async stream(
    prompt: string,
    system?: string,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: prompt })

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    })

    let fullText = ''
    let rawUsage: OpenAI.CompletionUsage | undefined

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        fullText += delta
        onChunk?.(delta)
      }
      if (chunk.usage) {
        rawUsage = chunk.usage
      }
    }

    const result = this.parseJsonResponse(fullText)

    if (rawUsage) {
      const { inputCost, outputCost, totalCost } = calculateCost(
        this.config.model,
        rawUsage.prompt_tokens,
        rawUsage.completion_tokens
      )
      result.usage = {
        model: this.config.model,
        inputTokens: rawUsage.prompt_tokens,
        outputTokens: rawUsage.completion_tokens,
        totalTokens: rawUsage.total_tokens,
        inputCost,
        outputCost,
        totalCost,
      }
    }

    return result
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }
}
