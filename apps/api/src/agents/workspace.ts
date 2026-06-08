import { homedir } from 'node:os';
import { join } from 'node:path';

import { loadRuntimeEnv } from '../config/env.js';

const DEFAULT_OPENCLAW_WORKSPACE_ROOT = join(homedir(), '.openclaw');
type WorkspaceEnv = Record<string, string | undefined>;

function sanitizeWorkspaceSegment(value: string) {
  return value
    .trim()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getOpenClawWorkspaceRoot(env: WorkspaceEnv = loadRuntimeEnv()) {
  return env.OPENCLAW_WORKSPACE_ROOT?.trim() || DEFAULT_OPENCLAW_WORKSPACE_ROOT;
}

export function createXuanzhiWorkspacePath(username: string, env?: WorkspaceEnv) {
  const root = getOpenClawWorkspaceRoot(env).replace(/\/+$/, '');
  const safeUsername = sanitizeWorkspaceSegment(username) || 'user';
  if (safeUsername.toLowerCase() === 'main') {
    return `${root}/workspace`;
  }
  return `${root}/workspace-xuanzhi-${safeUsername}`;
}
