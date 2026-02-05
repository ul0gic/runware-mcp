/**
 * MCP progress reporting.
 *
 * Creates progress reporters that send MCP progress notifications
 * to the client for long-running operations like video/audio generation
 * and batch processing.
 */

import type { ProgressReporter } from '../shared/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Callback type for sending MCP notifications.
 *
 * This is a simplified interface that matches the Server.notification() method
 * signature for progress notifications specifically.
 */
export type SendProgressNotification = (params: {
  readonly progressToken: string;
  readonly progress: number;
  readonly total: number;
  readonly message?: string;
}) => void;

// ============================================================================
// Progress Reporter Factory
// ============================================================================

/**
 * Creates a ProgressReporter that sends MCP progress notifications.
 *
 * The reporter maps tool-level progress info to the MCP progress
 * notification format, using the request ID as the progress token.
 *
 * @param requestId - The MCP request ID (used as progress token)
 * @param sendNotification - Callback to send MCP notifications
 * @returns A ProgressReporter that emits MCP progress notifications
 */
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
