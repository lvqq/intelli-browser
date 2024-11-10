import Anthropic from '@anthropic-ai/sdk';
import { BetaTextBlockParam, BetaMessageParam, BetaToolUseBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages';

interface AnthropicClientProps {
  apiKey?: string;
}

interface PromptOption {
  width: number;
  height: number;
  message: BetaMessageParam["content"];
}

export type ToolContent = BetaToolUseBlock & {
  input: {
    success?: boolean;
    error?: string;
    coordinate?: [x: number, y: number];
    action?: string;
    text?: string;
  }
}

const systemPrompt = `
<SYSTEM_CAPABILITY>
* Don't ask any questions to clarificate the user task, just try to achieve the goal of the task.
* If cannot achieve the goal, don't give any suggestions or ask any questions. Only clarificate your result
* Use the finish_run tool in your response if you have achieved the goal of the task or cannot achieve it
* Only use the Page_down or Page_up keys to scroll
* The mouse cursor may not be present in the screenshot
</SYSTEM_CAPABILITY>

The user will ask you to perform a task and you should use their browser to do so. After each step, take a screenshot and carefully evaluate if you have achieved the right outcome. Explicitly show your thinking: "I have evaluated step X..." If not correct, try again up to 3 times. Only when you confirm a step was executed correctly should you move on to the next one
`

export class AnthropicClient {
  private apiKey: AnthropicClientProps["apiKey"];
  private client: Anthropic;
  private messages: BetaMessageParam[];

  constructor(props: AnthropicClientProps) {
    this.apiKey = props.apiKey || process.env['ANTHROPIC_API_KEY'];
    this.client = new Anthropic({ apiKey: this.apiKey })
    this.messages = [];
  }

  public clean() {
    this.messages = [];
  }

  public getMessages() {
    return this.messages;
  }

  public async prompt({ width, height, message }: PromptOption) {
    const prompt: BetaMessageParam = { role: 'user', content: message };
    const { content, role } = await this.client.beta.messages.create({
      max_tokens: 1024,
      system: systemPrompt,
      messages: this.messages.concat([prompt]),
      tools: [
        {
          type: 'computer_20241022',
          name: 'computer',
          display_width_px: width,
          display_height_px: height,
          display_number: 1,
        },
        {
          name: 'finish_run',
          description:
            'Call this function when you have achieved the goal of the task.',
          input_schema: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Whether the task was successful. If successful, the reason property is required. If not, the error property is required',
              },
              reason: {
                type: 'string',
                description: 'The reason why the task was successful',
              },
              error: {
                type: 'string',
                description: 'The error message if the task was not successful',
              },
            },
            required: ['success'],
          },
        },
      ],
      model: 'claude-3-5-sonnet-20241022',
      betas: ['computer-use-2024-10-22'],
    });
    const textContent = content.filter(item => item.type === 'text');
    const toolContent = content.filter(item => item.type === 'tool_use');

    this.messages.push(...[prompt, { content, role }])
    return {
      text: textContent?.[0],
      tool: toolContent?.[0] as (ToolContent | undefined),
    }
  }
}
