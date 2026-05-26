import type { LoginResponse } from '@xuanzhi/shared/protocol';

import type { MemoryStore } from '../repositories/memoryStore.js';

export function createAuthService(store: MemoryStore) {
  return {
    login(email: string | undefined, password: string | undefined): LoginResponse | undefined {
      const user = email ? store.findUserByEmail(email) : undefined;
      if (!user || password !== 'dev-password') {
        return undefined;
      }
      const session = store.createSession(user.id);
      return { token: session.token, user };
    },

    logout(token: string) {
      store.deleteSession(token);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
