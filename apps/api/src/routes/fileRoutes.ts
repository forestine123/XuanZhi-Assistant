import { createReadStream, existsSync, statSync } from 'node:fs';
import { basename, extname, isAbsolute, resolve, sep } from 'node:path';
import { posix } from 'node:path';
import type { FastifyInstance } from 'fastify';

import type { AppDependencies } from '../app/dependencies.js';
import { createXuanzhiWorkspacePath } from '../agents/workspace.js';
import { requireOwnedTask } from '../http/taskGuards.js';

type ResolvedWorkspaceFile = {
  filePath: string;
  logicalPath: string;
};

const mimeTypes: Record<string, string> = {
  '.csv': 'text/csv; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function isWindowsPath(value: string) {
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');
}

function isInside(parent: string, target: string) {
  return target === parent || target.startsWith(`${parent}${sep}`);
}

function normalizePosixPath(value: string) {
  return value.replace(/\\/g, '/');
}

function isInsidePosix(parent: string, target: string) {
  return target === parent || target.startsWith(`${parent}/`);
}

function detectWslDistroName() {
  const cwdMatch = process.cwd().match(/^\\\\wsl(?:\.localhost)?\\([^\\]+)/i);
  return process.env.WSL_DISTRO_NAME || cwdMatch?.[1] || 'ubuntu';
}

function wslUncPath(posixPath: string) {
  return `\\\\wsl.localhost\\${detectWslDistroName()}${posixPath.replace(/\//g, '\\')}`;
}

function toLogicalPath(requestedPath: string) {
  const trimmed = requestedPath.trim();
  const uncMatch = trimmed.match(/^\\\\wsl(?:\.localhost)?\\[^\\]+\\(.+)$/i);
  if (uncMatch?.[1]) {
    return `/${uncMatch[1].replace(/\\/g, '/')}`;
  }
  return normalizePosixPath(trimmed);
}

function findExistingFile(candidates: string[]) {
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const stat = statSync(candidate);
    if (stat.isFile()) {
      return candidate;
    }
  }
  return undefined;
}

function resolveWorkspaceFile(workspace: string, requestedPath: string): ResolvedWorkspaceFile | undefined {
  if (isWindowsPath(workspace)) {
    const workspaceRoot = resolve(workspace);
    const targetPath = isAbsolute(requestedPath)
      ? resolve(requestedPath)
      : resolve(workspaceRoot, requestedPath);

    if (!isInside(workspaceRoot, targetPath)) {
      return undefined;
    }

    const filePath = findExistingFile([targetPath]);
    return filePath ? { filePath, logicalPath: targetPath } : undefined;
  }

  const workspaceRoot = posix.normalize(normalizePosixPath(workspace));
  const logicalRequest = toLogicalPath(requestedPath);
  const logicalTarget = posix.isAbsolute(logicalRequest)
    ? posix.normalize(logicalRequest)
    : posix.normalize(posix.join(workspaceRoot, logicalRequest));

  if (!isInsidePosix(workspaceRoot, logicalTarget)) {
    return undefined;
  }

  const candidates = process.platform === 'win32'
    ? [logicalTarget, wslUncPath(logicalTarget)]
    : [logicalTarget];
  const filePath = findExistingFile(candidates);
  return filePath ? { filePath, logicalPath: logicalTarget } : undefined;
}

function contentTypeFor(filePath: string) {
  return mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function canRenderInline(contentType: string) {
  return contentType.startsWith('image/');
}

function contentDisposition(disposition: 'attachment' | 'inline', filename: string) {
  const fallback = filename.replace(/[^\w.-]+/g, '_') || 'download';
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function getTaskWorkspace(task: { agentId?: string; userId: string }, dependencies: AppDependencies) {
  const agent = task.agentId
    ? dependencies.store.getAgent(task.agentId)
    : dependencies.store.getAgentByUserId(task.userId);
  if (agent?.workspace) {
    return agent.workspace;
  }

  const user = dependencies.store.getUserById(task.userId);
  return user ? createXuanzhiWorkspacePath(user.username) : undefined;
}

export function registerFileRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get('/api/tasks/:taskId/files', async (request, reply) => {
    const task = requireOwnedTask(request, reply, dependencies);
    if (!task) {
      return;
    }

    const query = request.query as { inline?: string; path?: string };
    const requestedPath = query.path?.trim();
    if (!requestedPath) {
      return reply.status(400).send({ message: '文件路径不能为空' });
    }

    const workspace = getTaskWorkspace(task, dependencies);
    if (!workspace) {
      return reply.status(404).send({ message: 'workspace 不存在' });
    }

    const resolvedFile = resolveWorkspaceFile(workspace, requestedPath);
    if (!resolvedFile) {
      return reply.status(400).send({ message: '文件不存在或路径无效' });
    }

    const filename = basename(resolvedFile.logicalPath);
    const contentType = contentTypeFor(resolvedFile.filePath);
    const disposition = query.inline === '1' && canRenderInline(contentType) ? 'inline' : 'attachment';
    reply.header('content-type', contentType);
    reply.header('content-disposition', contentDisposition(disposition, filename));
    reply.header('x-content-type-options', 'nosniff');
    return reply.send(createReadStream(resolvedFile.filePath));
  });
}
