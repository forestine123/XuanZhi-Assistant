import type { FastifyRequest } from 'fastify';
import type { User } from '@xuanzhi/shared/protocol';

import type { AppConfig } from '../config/env.js';
import type { MemoryStore } from '../repositories/memoryStore.js';

export type AuthContext =
  | {
      kind: 'user';
      user: User;
      token: string;
    }
  | {
      kind: 'service';
    };

export type UserAuthContext = {
  user: User;
  token: string;
};

function bearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  return authorization.slice('Bearer '.length).trim();
}

function queryToken(request: FastifyRequest) {
  const query = request.query as { token?: string };
  return typeof query.token === 'string' ? query.token : undefined;
}

export function getAuth(request: FastifyRequest, store: MemoryStore, config: AppConfig): AuthContext | undefined {
  const token = bearerToken(request);
  if (!token) {
    return undefined;
  }
  if (token === config.serviceToken) {
    return { kind: 'service' };
  }
  const user = store.getUserByToken(token);
  if (!user) {
    return undefined;
  }
  return { kind: 'user', user, token };
}

export function getUserAuth(
  request: FastifyRequest,
  store: MemoryStore,
  config: AppConfig,
): UserAuthContext | undefined {
  // NOTE(sse): native EventSource cannot set Authorization headers, so the MVP
  // accepts a query token for streams while still checking resource ownership.
  const token = bearerToken(request) ?? queryToken(request);
  if (!token || token === config.serviceToken) {
    return undefined;
  }
  const user = store.getUserByToken(token);
  if (!user) {
    return undefined;
  }
  return { user, token };
}
