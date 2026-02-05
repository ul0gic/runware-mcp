/**
 * Cancellation tracking for long-running MCP operations.
 *
 * Manages AbortControllers keyed by request ID so that in-flight
 * tool executions (especially video/audio generation with polling)
 * can be cancelled by the client.
 */

// ============================================================================
// State
// ============================================================================

/**
 * Map of active operations by request ID to their AbortController.
 */
const activeOperations = new Map<string, AbortController>();

// ============================================================================
// Operations
// ============================================================================

/**
 * Creates a cancellable operation for the given request ID.
 *
 * Returns an AbortSignal that tool handlers can pass to API calls
 * and polling loops. The signal will be aborted if cancelOperation
 * is called with the same request ID.
 *
 * @param requestId - The MCP request ID to track
 * @returns AbortSignal for the operation
 */
export function createCancellableOperation(requestId: string): AbortSignal {
  const controller = new AbortController();
  activeOperations.set(requestId, controller);
  return controller.signal;
}

/**
 * Cancels an active operation by request ID.
 *
 * Aborts the associated AbortController and removes it from tracking.
 *
 * @param requestId - The MCP request ID to cancel
 * @returns true if the operation was found and cancelled, false otherwise
 */
export function cancelOperation(requestId: string): boolean {
  const controller = activeOperations.get(requestId);
  if (controller !== undefined) {
    controller.abort();
    activeOperations.delete(requestId);
    return true;
  }
  return false;
}

/**
 * Marks an operation as complete and removes it from tracking.
 *
 * Should be called in a finally block after tool execution completes
 * (whether successfully or with an error).
 *
 * @param requestId - The MCP request ID to complete
 */
export function completeOperation(requestId: string): void {
  activeOperations.delete(requestId);
}

/**
 * Gets the count of currently active (tracked) operations.
 *
 * Useful for diagnostics and shutdown coordination.
 *
 * @returns Number of active operations
 */
export function getActiveOperationCount(): number {
  return activeOperations.size;
}
