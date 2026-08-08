import type { ProgressReporter } from '../shared/types.js';

/** Narrowed to the shape Server.notification() accepts for progress notifications. */
export type SendProgressNotification = (params: {
  readonly progressToken: string;
  readonly progress: number;
  readonly total: number;
  readonly message?: string;
}) => void;

/** The MCP request ID doubles as the progress token. */
export function createProgressReporter(
  requestId: string,
  sendNotification: SendProgressNotification,
): ProgressReporter {
  return {
    report(info): void {
      sendNotification({
        progressToken: requestId,
        progress: info.progress,
        total: info.total,
        message: info.message,
      });
    },
  };
}
