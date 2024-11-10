import { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";

export const formatToolResult = (data: string | null, toolId: string): BetaMessageParam["content"] => {
  if (!data) {
    return [
      {
        type: 'tool_result',
        tool_use_id: toolId,
      },
    ]
  }
  return [
    {
      type: 'tool_result',
      tool_use_id: toolId,
      content: [
        {
          type: 'text',
          text: 'Here is a screenshot after the action was executed',
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data,
          },
        },
      ],
    },
  ]
}