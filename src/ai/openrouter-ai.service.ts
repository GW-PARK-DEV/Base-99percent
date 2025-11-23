import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class OpenRouterAIService {
  constructor(private readonly configService: ConfigService) {}

  async generate(systemPrompt: string, userMessage: string, options?: OpenRouterOptions): Promise<string> {
    const messages = [new SystemMessage(systemPrompt), new HumanMessage(userMessage)];
    return this.invoke(messages, options);
  }

  async invoke(messages: BaseMessage[], options?: OpenRouterOptions): Promise<string> {
    const model = this.createModel(options);
    const response = await model.invoke(messages);
    return (response as { content?: string; text?: string })?.content || String(response);
  }

  async generateJSON<T = any>(systemPrompt: string, userMessage: string, options?: OpenRouterOptions): Promise<T | null> {
    const response = await this.generate(systemPrompt, userMessage, { ...options, temperature: 0.1 });
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    try {
      return JSON.parse(jsonMatch ? jsonMatch[1] : response) as T;
    } catch {
      return null;
    }
  }

  async stream(messages: BaseMessage[], onChunk?: (chunk: string) => void, options?: OpenRouterOptions): Promise<string> {
    const model = this.createModel({ ...options, streaming: true });
    let fullResponse = '';
    for await (const chunk of await model.stream(messages)) {
      const text = (chunk as { content?: string; text?: string })?.content || String(chunk);
      fullResponse += text;
      onChunk?.(text);
    }
    return fullResponse;
  }

  private createModel(options?: OpenRouterOptions & { streaming?: boolean }): ChatOpenAI {
    return new ChatOpenAI({
      model: options?.model || 'google/gemini-2.5-flash',
      temperature: options?.temperature ?? 0.7,
      streaming: options?.streaming ?? false,
      maxTokens: options?.maxTokens,
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      configuration: {
        baseURL: this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1',
        timeout: 120000,
      },
    });
  }
}

