/**
 * Auth Event Emitter
 *
 * Lightweight pub/sub mechanism so that the axios interceptor in khub.ts
 * can notify AuthContext when the refresh-token flow fails and the user
 * must be redirected to the login screen.
 */

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: AuthEventListener[] = [];

  /**
   * Subscribe to auth-failure events.
   * Returns an unsubscribe function.
   */
  onAuthFailure(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit an auth-failure event (called when token refresh fails).
   */
  emitAuthFailure(): void {
    this.listeners.forEach((l) => l());
  }
}

export const authEvents = new AuthEventEmitter();
