import type {
  AgentEventStatus,
  ArtifactFormat,
  ArtifactType,
  TaskIntent,
  TaskStatus,
} from '@xuanzhi/shared/protocol';

const taskStatuses = new Set<TaskStatus>(['created', 'planning', 'running', 'waiting_approval', 'completed', 'failed']);
const taskIntents = new Set<TaskIntent>(['meeting', 'business', 'coding', 'qa', 'general']);
const artifactTypes = new Set<ArtifactType>(['plan', 'meeting_draft', 'code_diff', 'report', 'tool_result', 'final_answer']);
const artifactFormats = new Set<ArtifactFormat>(['markdown', 'json', 'diff', 'text']);
const eventStatuses = new Set<AgentEventStatus>(['pending', 'running', 'success', 'error', 'waiting']);

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && taskStatuses.has(value as TaskStatus);
}

export function normalizeTaskIntent(value: unknown): TaskIntent {
  return typeof value === 'string' && taskIntents.has(value as TaskIntent) ? (value as TaskIntent) : 'general';
}

export function isArtifactType(value: unknown): value is ArtifactType {
  return typeof value === 'string' && artifactTypes.has(value as ArtifactType);
}

export function isArtifactFormat(value: unknown): value is ArtifactFormat {
  return typeof value === 'string' && artifactFormats.has(value as ArtifactFormat);
}

export function normalizeAgentEventStatus(value: unknown): AgentEventStatus | undefined {
  return typeof value === 'string' && eventStatuses.has(value as AgentEventStatus)
    ? (value as AgentEventStatus)
    : undefined;
}
