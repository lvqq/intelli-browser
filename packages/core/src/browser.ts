import { AnthropicClient, formatToolResult } from "@intelli-browser/anthropic"
import { PlayWrightAgent } from '@intelli-browser/playwright'

interface IntelliBrowserProps {
  apiKey?: string;
  verbose?: boolean;  // display LLM text output, default is true
}

interface ExecuteOptions {
  page: any
  message: any
}


export class IntelliBrowser {
  private anthropicClient: AnthropicClient
  private playwrightAgent?: PlayWrightAgent
  private verbose: boolean

  constructor({
    verbose = true,
    apiKey,
  }: IntelliBrowserProps) {
    this.verbose = verbose;
    const anthropocApiKey = apiKey || process.env["ANTHROPIC_API_KEY"]
    this.anthropicClient = new AnthropicClient({
      apiKey: anthropocApiKey,
    })
  }
  
  public async run({
    page,
    message,
  }: ExecuteOptions) {
    this.playwrightAgent = new PlayWrightAgent({ page })
    let isFinish = false;
    let nextPrompt = message;
    if (this.verbose) {
      console.log(`User: ${message}\n`)
    }
    while(!isFinish) {
      const { scaledWidth, scaledHeight } = this.playwrightAgent!.getScaledScreenDimensions();
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
        nextPrompt = await this.playwrightAgent!.runAction(tool, formatToolResult)
      } else {
        isFinish = true;
      }
    }
  }
}