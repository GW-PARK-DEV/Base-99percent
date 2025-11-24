import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

@Injectable()
export class FlockAIService {
  private readonly model: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    this.model = new ChatOpenAI({
      model: 'qwen3-235b-a22b-thinking-2507',
      temperature: 0.7,
      apiKey: this.configService.get<string>('FLOCK_API_KEY'),
      configuration: {
        baseURL: this.configService.get<string>('FLOCK_BASE_URL') || 'https://api.flock.io/v1',
        timeout: 120000,
      },
    });
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    const messages = [new SystemMessage(systemPrompt), new HumanMessage(userMessage)];
    const response = await this.model.invoke(messages);
    return (response as { content?: string })?.content || String(response);
  }

  async invoke(messages: BaseMessage[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return (response as { content?: string })?.content || String(response);
  }
}