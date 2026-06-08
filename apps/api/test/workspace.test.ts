import { homedir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createXuanzhiWorkspacePath,
  getOpenClawWorkspaceRoot,
} from '../src/agents/workspace.js';

const originalWorkspaceRoot = process.env.OPENCLAW_WORKSPACE_ROOT;

afterEach(() => {
  if (originalWorkspaceRoot === undefined) {
    delete process.env.OPENCLAW_WORKSPACE_ROOT;
  } else {
    process.env.OPENCLAW_WORKSPACE_ROOT = originalWorkspaceRoot;
  }
});

describe('OpenClaw workspace path', () => {
  it('defaults to the current user OpenClaw directory instead of a machine-specific home path', () => {
    delete process.env.OPENCLAW_WORKSPACE_ROOT;
    const env = {};

    expect(getOpenClawWorkspaceRoot(env)).toBe(join(homedir(), '.openclaw'));
    expect(createXuanzhiWorkspacePath('alice', env)).toBe(
      `${join(homedir(), '.openclaw')}/workspace-xuanzhi-alice`,
    );
  });

  it('allows overriding the OpenClaw workspace root from environment', () => {
    process.env.OPENCLAW_WORKSPACE_ROOT = '/tmp/openclaw-test-root';

    expect(createXuanzhiWorkspacePath('main', process.env)).toBe('/tmp/openclaw-test-root/workspace');
    expect(createXuanzhiWorkspacePath('alice', process.env)).toBe(
      '/tmp/openclaw-test-root/workspace-xuanzhi-alice',
    );
  });
});
