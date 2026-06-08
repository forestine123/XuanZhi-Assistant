import type { Message, MessagePlanStep, MessageToolCall } from '../types/protocol';
import { apiUrl } from '../services/apiClient';
import { getAuthToken } from '../stores/authStore';

export type AgentStepStatus = 'pending' | 'running' | 'success' | 'warning' | 'error';

export type AgentStep = {
  id: string;
  type?: string;
  title?: string;
  rawName?: string;
  command?: string;
  status: AgentStepStatus;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
  arguments?: unknown;
  result?: string;
  isError?: boolean;
};

export type AgentExecutionMode = 'simple' | 'standard' | 'debug';

export type AgentCodeBlock = {
  id: string;
  fileName?: string;
  language?: string;
  code: string;
};

export type GeneratedFile = {
  id: string;
  path: string;
  name: string;
  isImage: boolean;
  previewUrl?: string;
  downloadUrl: string;
};

export type AgentRunResult = {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
};

export type NormalizedAgentMessage = {
  id: string;
  role: Message['role'];
  finalAnswer: string;
  steps: AgentStep[];
  codeBlocks: AgentCodeBlock[];
  generatedFiles: GeneratedFile[];
  runResult?: AgentRunResult;
  copyContent: string;
};

const codeFencePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
const imageExtensions = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const downloadableExtensions = [
  'csv',
  'docx',
  'gif',
  'html',
  'jpeg',
  'jpg',
  'json',
  'md',
  'pdf',
  'png',
  'pptx',
  'py',
  'svg',
  'ts',
  'tsx',
  'txt',
  'webp',
  'xlsx',
  'zip',
];
const markdownAssetPattern = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;
const rawToolBlockPattern = /```(?:json|xml)?\s*[\r\n][\s\S]*?(?:"(?:tool_use|tool_result|tool_call|function_call|function_result|toolName|toolCallId|function_name)"|<\/?(?:tool_call|function_call|tool_calls|function_calls)\b)[\s\S]*?```/gi;
const rawToolXmlPattern = /<(tool_call|function_call|tool_calls|function_calls)\b[\s\S]*?<\/\1>/gi;
const bareFilePathPattern = /(?:^|[\s"'`(（])((?:\\\\wsl(?:\.localhost)?\\[^\s"'`<>]+|[a-zA-Z]:[\\/][^\s"'`<>]+|\/[^\s"'`<>]+|\.{1,2}\/[^\s"'`<>]+|[\w.-]+(?:[\\/][\w .-]+)+)\.(?:csv|docx|gif|html|jpe?g|json|md|pdf|png|pptx|py|svg|ts|tsx|txt|webp|xlsx|zip))(?:$|[\s"'`,)）])/gi;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripCompletionSuffix(value: string) {
  return value.replace(/(?:完成|已完成)\s*$/u, '').trim();
}

function normalizePlanStatus(status: MessagePlanStep['status']): AgentStepStatus {
  if (status === 'done') return 'success';
  if (status === 'error') return 'error';
  if (status === 'running') return 'running';
  return 'pending';
}

function extractCommandFromRawName(rawName: string): string | undefined {
  const normalized = stripCompletionSuffix(normalizeWhitespace(rawName));
  const commandRunMatch = normalized.match(/command\s+run\s+(.+?)(?:\s+\(agent\))?$/i);
  if (commandRunMatch?.[1]) {
    return commandRunMatch[1].trim();
  }

  const colonMatch = normalized.match(/^(?:exec|command|shell|terminal)\s*[:：]\s*(.+)$/i);
  if (colonMatch?.[1]) {
    return colonMatch[1].replace(/^\s*command\s+run\s+/i, '').replace(/\s+\(agent\)$/i, '').trim();
  }

  return undefined;
}

function inferStepType(rawName: string, command?: string): string | undefined {
  const raw = rawName.toLowerCase();
  if (raw.includes('write')) return 'write';
  if (raw.includes('read')) return 'read';
  if (raw.includes('exec') || raw.includes('command') || command) return 'exec';
  if (raw.includes('search') || raw.includes('rg') || raw.includes('grep')) return 'search';
  if (raw.includes('edit') || raw.includes('patch')) return 'edit';
  if (raw.includes('install') || raw.includes('pnpm') || raw.includes('npm')) return 'install';
  if (raw.includes('test') || raw.includes('vitest')) return 'test';
  if (raw.includes('think') || raw.includes('reasoning') || raw.includes('思考')) return 'think';
  return undefined;
}

function isInternalEventLine(line: string) {
  const value = normalizeWhitespace(line);
  if (!value) return false;
  if (/^Tool output\b/i.test(value)) return true;
  if (/^(rawName|stdout|stderr|exitCode)\b/i.test(value)) return true;
  if (/^exec\s*[:：]\s*command\s+run\b/i.test(value)) return true;
  if (/^(context\.compiled|trace\.metadata|session\.(?:started|updated|ended))\b/i.test(value)) return true;
  if (/^(tool_use|tool_result|function_call|function_result)\b/i.test(value)) return true;
  if (/^\{.*"(?:tool_use|tool_result|function_call|context\.compiled|trace\.metadata)"/i.test(value)) return true;
  if (/^\{.*"(?:tool_call|toolName|toolCallId|function_name|arguments|args|params)"/i.test(value)) return true;
  if (/^<\/?(?:tool_call|function_call|tool_calls|function_calls)\b/i.test(value)) return true;
  if (/^(?:Tool call|Tool result|Function call|Function result|Arguments|Parameters)\b/i.test(value)) return true;
  if (/^(write|read|exec|search|edit|install|test)\s*完成$/i.test(value)) return true;
  if (/^未知操作\s*完成$/u.test(value)) return true;
  return false;
}

function summarizeToolArguments(toolCall: MessageToolCall): string | undefined {
  const args = toolCall.arguments;
  if (!args || typeof args !== 'object') return undefined;
  const record = args as Record<string, unknown>;
  const path = typeof record.path === 'string' ? record.path.split(/[\\/]/).at(-1) : undefined;
  const command = typeof record.command === 'string' ? record.command : undefined;
  const query = typeof record.query === 'string' ? record.query : undefined;
  const pattern = typeof record.pattern === 'string' ? record.pattern : undefined;
  return command || path || query || pattern;
}

function stripRawToolPayloads(content: string) {
  return content
    .replace(rawToolBlockPattern, '')
    .replace(rawToolXmlPattern, '')
    .replace(/<\/?(?:tool_call|function_call|tool_calls|function_calls)[^>]*>/gi, '');
}

function extractLanguage(meta: string): string | undefined {
  const firstToken = meta.trim().split(/\s+/)[0];
  if (!firstToken || firstToken.includes('=')) return undefined;
  return firstToken;
}

function inferFileNameFromCommand(command?: string): string | undefined {
  if (!command) return undefined;
  const match = command.match(/\b(?:python3?|node|tsx?|bash|sh)\s+([^\s"'`]+)/i);
  return match?.[1];
}

function fileExtension(filePath: string) {
  const clean = filePath.split(/[?#]/)[0] ?? filePath;
  const index = clean.lastIndexOf('.');
  return index >= 0 ? clean.slice(index).toLowerCase() : '';
}

function fileNameFromPath(filePath: string) {
  const clean = filePath.split(/[?#]/)[0] ?? filePath;
  return clean.split(/[\\/]/).filter(Boolean).at(-1) ?? '生成文件';
}

function isRemoteOrEmbeddedUrl(value: string) {
  return /^(?:https?:|data:|blob:|mailto:|#|\/api\/)/i.test(value);
}

function isLocalGeneratedFilePath(value: string) {
  const clean = value.trim();
  if (!clean || isRemoteOrEmbeddedUrl(clean)) return false;
  const ext = fileExtension(clean).replace(/^\./, '');
  return downloadableExtensions.includes(ext);
}

function isImagePath(filePath: string) {
  return imageExtensions.has(fileExtension(filePath));
}

function splitMarkdownAssetTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const wrapped = trimmed.match(/^<(.+)>(\s+["'][^"']*["'])?$/);
  if (wrapped?.[1]) {
    return {
      path: wrapped[1],
      title: wrapped[2] ?? '',
    };
  }

  const titled = trimmed.match(/^(.+?)(\s+["'][^"']*["'])$/);
  if (titled?.[1]) {
    return {
      path: titled[1].trim(),
      title: titled[2],
    };
  }

  return {
    path: trimmed,
    title: '',
  };
}

function taskFileUrl(taskId: string, filePath: string, inline = false) {
  const params = new URLSearchParams({ path: filePath });
  const token = typeof window !== 'undefined' ? getAuthToken() : undefined;
  if (inline) {
    params.set('inline', '1');
  }
  if (token) {
    params.set('token', token);
  }
  return apiUrl(`/api/tasks/${encodeURIComponent(taskId)}/files?${params.toString()}`);
}

export function rewriteMarkdownAssetUrls(content: string, taskId: string) {
  return content.replace(markdownAssetPattern, (full, bang: string, label: string, rawTarget: string) => {
    const asset = splitMarkdownAssetTarget(rawTarget);
    if (!asset || !isLocalGeneratedFilePath(asset.path)) {
      return full;
    }
    const url = taskFileUrl(taskId, asset.path, Boolean(bang) || isImagePath(asset.path));
    return `${bang}[${label}](${url}${asset.title})`;
  });
}

export function extractGeneratedFiles(content: string, taskId: string): GeneratedFile[] {
  const paths = new Map<string, string>();

  for (const match of content.matchAll(markdownAssetPattern)) {
    const asset = splitMarkdownAssetTarget(match[3] ?? '');
    if (asset && isLocalGeneratedFilePath(asset.path)) {
      paths.set(asset.path, asset.path);
    }
  }

  for (const match of content.matchAll(bareFilePathPattern)) {
    const rawPath = match[1];
    if (rawPath && isLocalGeneratedFilePath(rawPath)) {
      paths.set(rawPath, rawPath);
    }
  }

  return [...paths.values()].map((filePath, index) => {
    const isImage = isImagePath(filePath);
    return {
      id: `file-${index}-${filePath}`,
      path: filePath,
      name: fileNameFromPath(filePath),
      isImage,
      previewUrl: isImage ? taskFileUrl(taskId, filePath, true) : undefined,
      downloadUrl: taskFileUrl(taskId, filePath),
    };
  });
}

function extractCommandFileNames(steps: AgentStep[]) {
  return steps.map((step) => inferFileNameFromCommand(step.command)).filter(Boolean) as string[];
}

export function extractCodeBlocks(content: string, steps: AgentStep[] = []): AgentCodeBlock[] {
  const commandFileNames = extractCommandFileNames(steps);
  const blocks: AgentCodeBlock[] = [];
  let index = 0;

  for (const match of content.matchAll(codeFencePattern)) {
    const language = extractLanguage(match[1] ?? '');
    const code = (match[2] ?? '').trimEnd();
    if (!code) continue;

    blocks.push({
      id: `code-${index}`,
      fileName: commandFileNames[index],
      language,
      code,
    });
    index += 1;
  }

  return blocks;
}

export function extractRunResult(content: string): AgentRunResult | undefined {
  const lines = content.split(/\r?\n/);
  const resultStart = lines.findIndex((line) => /^(运行结果|Run Result|Tool output|输出|stdout)\b/i.test(line.trim()));
  if (resultStart < 0) return undefined;

  const resultLines = lines.slice(resultStart);
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  let exitCode: number | undefined;
  let active: 'stdout' | 'stderr' = 'stdout';

  for (const line of resultLines) {
    const value = line.trim();
    const exitMatch = value.match(/^exitCode\s*[:：]?\s*(-?\d+)/i);
    if (exitMatch) {
      exitCode = Number(exitMatch[1]);
      continue;
    }

    if (/^stderr\b/i.test(value)) {
      active = 'stderr';
      const rest = value.replace(/^stderr\s*[:：]?\s*/i, '');
      if (rest) stderrLines.push(rest);
      continue;
    }

    if (/^stdout\b/i.test(value) || /^Tool output\b/i.test(value)) {
      active = 'stdout';
      const rest = value.replace(/^(stdout|Tool output)\s*[:：]?\s*/i, '');
      if (rest) stdoutLines.push(rest);
      continue;
    }

    if (/^运行结果[:：]?\s*$/u.test(value) || /^Run Result[:：]?\s*$/i.test(value)) {
      continue;
    }

    if (active === 'stderr') {
      stderrLines.push(line);
    } else {
      stdoutLines.push(line);
    }
  }

  const stdout = stdoutLines.join('\n').trim();
  const stderr = stderrLines.join('\n').trim();
  if (!stdout && !stderr && exitCode === undefined) return undefined;

  return {
    stdout: stdout || undefined,
    stderr: stderr || undefined,
    exitCode,
  };
}

function removeRunResultSection(content: string) {
  const lines = content.split(/\r?\n/);
  const resultStart = lines.findIndex((line) => /^(运行结果|Run Result|Tool output|输出|stdout)\b/i.test(line.trim()));
  if (resultStart < 0) return content;
  return lines.slice(0, resultStart).join('\n').trimEnd();
}

export function extractFinalAnswer(content: string, taskId?: string): string {
  const withoutRawPayloads = stripRawToolPayloads(content);
  const withoutCode = removeRunResultSection(withoutRawPayloads).replace(codeFencePattern, '').trim();
  const filtered = withoutCode
    .split(/\r?\n/)
    .filter((line) => !isInternalEventLine(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return taskId ? rewriteMarkdownAssetUrls(filtered, taskId) : filtered;
}

export function formatAgentStep(step: AgentStep): string {
  const raw = step.rawName || step.type || '';
  const haystack = `${raw} ${step.type ?? ''}`.toLowerCase();

  if (step.title) return step.title;
  if (haystack.includes('write')) return '已创建或更新文件';
  if (haystack.includes('read')) return '已读取文件';
  if (haystack.includes('exec') || haystack.includes('command')) {
    if (step.command) return `已执行命令：${step.command}`;
    return '已执行命令';
  }
  if (haystack.includes('search') || haystack.includes('rg') || haystack.includes('grep')) {
    return '已完成搜索';
  }
  if (haystack.includes('edit') || haystack.includes('patch')) return '已修改文件';
  if (haystack.includes('install') || haystack.includes('pnpm') || haystack.includes('npm')) return '已安装依赖';
  if (haystack.includes('test') || haystack.includes('vitest')) return '已运行测试';
  if (haystack.includes('think') || haystack.includes('reasoning') || haystack.includes('思考')) return '已完成分析';

  return '已完成一个系统步骤';
}

export function normalizeToolCallStep(toolCall: MessageToolCall): AgentStep {
  const argumentSummary = summarizeToolArguments(toolCall);
  const rawName = argumentSummary ? `${toolCall.name}: ${argumentSummary}` : toolCall.name;
  const command = toolCall.name === 'exec' ? argumentSummary : extractCommandFromRawName(rawName);
  const type = inferStepType(rawName, command);
  const normalized: AgentStep = {
    id: toolCall.id,
    type,
    rawName,
    command,
    status: toolCall.status === 'error' || toolCall.isError
      ? 'error'
      : toolCall.status === 'running'
        ? 'running'
        : 'success',
    arguments: toolCall.arguments,
    result: toolCall.result,
    isError: toolCall.isError,
  };

  return {
    ...normalized,
    title: formatAgentStep(normalized),
  };
}

export function normalizeAgentStep(step: MessagePlanStep): AgentStep {
  const rawName = normalizeWhitespace(step.text);
  const command = extractCommandFromRawName(rawName);
  const type = inferStepType(rawName, command);
  const normalized: AgentStep = {
    id: step.id,
    type,
    rawName,
    command,
    status: normalizePlanStatus(step.status),
  };

  return {
    ...normalized,
    title: formatAgentStep(normalized),
  };
}

export function normalizeAgentMessage(rawMessage: Message): NormalizedAgentMessage {
  const toolSteps = rawMessage.toolCalls?.map(normalizeToolCallStep) ?? [];
  const planSteps = rawMessage.planSteps?.map(normalizeAgentStep) ?? [];
  const steps = toolSteps.length > 0 ? toolSteps : planSteps;
  const sanitizedContent = stripRawToolPayloads(rawMessage.content);
  const codeBlocks = extractCodeBlocks(sanitizedContent, steps);
  const generatedFiles = extractGeneratedFiles(sanitizedContent, rawMessage.taskId);
  const runResult = steps.length > 0 ? undefined : extractRunResult(sanitizedContent);
  const finalAnswer = extractFinalAnswer(sanitizedContent, rawMessage.taskId);
  const copyContent = [finalAnswer, ...codeBlocks.map((block) => block.code), runResult?.stdout, runResult?.stderr]
    .filter(Boolean)
    .join('\n\n');

  return {
    id: rawMessage.id,
    role: rawMessage.role,
    finalAnswer,
    steps,
    codeBlocks,
    generatedFiles,
    runResult,
    copyContent: copyContent || rawMessage.content,
  };
}
