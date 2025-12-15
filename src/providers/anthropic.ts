import type { TokenizerInterface, TokenizerProvider, ProviderError, Message } from '../types/index.js';

interface AnthropicCountTokensRequest {
  model: string;
  messages: { role: string; content: string }[];
  system?: string;
  tools?: any[];
}

interface AnthropicCountTokensResponse {
  input_tokens: number;
}

export const SUPPORTED_MODELS = [
  // Claude 4.5 series (current)
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-opus-4-5',
  // Claude 4 series (legacy)
  'claude-opus-4-1',
  'claude-sonnet-4-0',
  'claude-opus-4-0',
  // Claude 3 series (legacy)
  'claude-3-7-sonnet-latest',
  'claude-3-5-haiku-latest',
] as const;

export class AnthropicProvider implements TokenizerProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async countTokens(model: string, text: string): Promise<number> {
    const requestBody = {
      model,
      messages: [{ role: 'user', content: text }],
    } as AnthropicCountTokensRequest;

    try {
      const response = await fetch(`${this.baseURL}/v1/messages/count_tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Get response body for better error diagnostics
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = '<unable to read response body>';
        }

        // Log detailed error information for 400 errors
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`Anthropic API error for model '${model}':`, {
          status: response.status,
          statusText: response.statusText,
          requestBody,
          responseBody,
          url: `${this.baseURL}/v1/messages/count_tokens`,
        });

        throw this.createError(
          response.status === 401 ? 'API_KEY_INVALID' :
            response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
          `${errorMessage}. Response: ${responseBody}`,
          response.status
        );
      }

      const data: AnthropicCountTokensResponse = await response.json();
      return data.input_tokens;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      console.error(`Anthropic API unexpected error for model '${model}':`, {
        error: error.message,
        requestBody,
      });
      throw this.createError('API_ERROR', error.message);
    }
  }

  async countTokensForMessages(model: string, messages: Message[], systemPrompt?: string): Promise<number> {
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content,
    }));

    const requestBody: AnthropicCountTokensRequest = {
      model,
      messages: anthropicMessages,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/messages/count_tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Get response body for better error diagnostics
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = '<unable to read response body>';
        }

        // Log detailed error information for 400 errors
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`Anthropic API error for model '${model}':`, {
          status: response.status,
          statusText: response.statusText,
          requestBody,
          responseBody,
          url: `${this.baseURL}/v1/messages/count_tokens`,
        });

        throw this.createError(
          response.status === 401 ? 'API_KEY_INVALID' :
            response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
          `${errorMessage}. Response: ${responseBody}`,
          response.status
        );
      }

      const data: AnthropicCountTokensResponse = await response.json();
      return data.input_tokens;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      console.error(`Anthropic API unexpected error for model '${model}':`, {
        error: error.message,
        requestBody,
      });
      throw this.createError('API_ERROR', error.message);
    }
  }

  getTokenizer(model: string): TokenizerInterface {
    return {
      count: (text: string) => this.countTokens(model, text),
    };
  }

  private createError(code: string, message: string, statusCode?: number): ProviderError {
    const error = new Error(message) as ProviderError;
    error.code = code;
    error.provider = 'anthropic';

    if (statusCode !== undefined) {
      error.statusCode = statusCode;
      error.retryable = statusCode === 429 || statusCode >= 500;
    } else {
      error.retryable = false;
    }

    return error;
  }
} 
