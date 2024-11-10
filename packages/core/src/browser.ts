import { AnthropicClient, formatToolResult } from "@intelli-browser/anthropic"
import { PlayWrightAgent } from '@intelli-browser/playwright'

interface IntelliBrowserProps {
  apiKey?: string;
  /**
   * Display LLM text output, default is true
   */
  verbose?: boolean;
  /**
   * Whether auto clean context after each run
   */
  autoClean?: boolean;
  /**
   * Max steps for LLM actions, default is 50
   */
  maxSteps?: number;
}

interface ExecuteOptions {
  page: any
  message: any
}


export class IntelliBrowser {
  private anthropicClient: AnthropicClient
  private verbose: boolean
  private autoClean: boolean
  private maxSteps: number

  constructor({
    apiKey,
    verbose = true,
    autoClean = true,
    maxSteps = 50,
  }: IntelliBrowserProps) {
    const anthropocApiKey = apiKey || process.env["ANTHROPIC_API_KEY"]
    this.anthropicClient = new AnthropicClient({
      apiKey: anthropocApiKey,
    })
    this.verbose = verbose
    this.autoClean = autoClean
    this.maxSteps = maxSteps
  }
  
  public async run({
    page,
    message,
  }: ExecuteOptions) {
    const playwrightAgent = new PlayWrightAgent({ page })
    let isFinish = false;
    let nextPrompt = message;
    let loopTime = 0;  // for caculate delay time between each action
    if (this.verbose) {
      console.log(`User: ${message}\n`)
    }
  
    while(!isFinish || this.anthropicClient.getMessages().length <= this.maxSteps) {
      const { scaledWidth, scaledHeight } = playwrightAgent.getScaledScreenDimensions();
      const { tool, text } = await this.anthropicClient.prompt({ message: nextPrompt, width: scaledWidth, height: scaledHeight })
      if (this.verbose && text) {
        console.log(`Assistant: ${text?.text || ''}\n`)
      }
      if (tool?.name === 'finish_run') {
        if (tool?.input?.success) {
          isFinish = true;
          break;
        } else {
          throw new Error(tool?.input?.error || 'Run failed')
        }
      }
      if (tool) {
        const delay = loopTime ? Date.now() - loopTime : 0
        nextPrompt = await playwrightAgent.runAction({
          tool,
          formatFn: formatToolResult,
          delay: delay < 50 ? 0 : delay,
          showAction: this.verbose,
        })
        // if screenshot, skip update time
        if (tool?.input?.action !== 'screenshot') {
          loopTime = Date.now();
        }
      } else {
        isFinish = true;
      }
    }
    if (this.autoClean) {
      this.clean();
    }

    return playwrightAgent.getActions();
  }

  public clean() {
    this.anthropicClient.clean();
  }
}