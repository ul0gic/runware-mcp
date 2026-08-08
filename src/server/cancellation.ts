const activeOperations = new Map<string, AbortController>();

/** The returned signal aborts when cancelOperation is called with the same request ID. */
export function createCancellableOperation(requestId: string): AbortSignal {
  const controller = new AbortController();
  activeOperations.set(requestId, controller);
  return controller.signal;
}

export function cancelOperation(requestId: string): boolean {
  const controller = activeOperations.get(requestId);
  if (controller !== undefined) {
    controller.abort();
    activeOperations.delete(requestId);
    return true;
  }
  return false;
}

/** Call from a finally block, or the controller leaks. */
export function completeOperation(requestId: string): void {
  activeOperations.delete(requestId);
}

export function getActiveOperationCount(): number {
  return activeOperations.size;
}
