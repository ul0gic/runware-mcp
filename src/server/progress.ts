// Does:  Adapts a tool's ProgressReporter to MCP notifications/progress messages for one request.
// Holds: Every notification carries the client's progressToken unchanged, so a numeric token stays a number.

import type { ProgressReporter } from '../shared/types.js';
import type { ProgressToken } from '@modelcontextprotocol/sdk/types.js';

export type SendProgressNotification = (params: {
  readonly progressToken: ProgressToken;
  readonly progress: number;
  readonly total: number;
  readonly message?: string;
}) => void;

export function createProgressReporter(
  progressToken: ProgressToken,
  sendNotification: SendProgressNotification,
): ProgressReporter {
  return {
    report(info): void {
      sendNotification({
        progressToken,
        progress: info.progress,
        total: info.total,
        message: info.message,
      });
    },
  };
}
