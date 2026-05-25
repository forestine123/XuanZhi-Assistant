import { authFetch } from './apiClient';

import type { AgentEvent, Approval, Artifact, Task, TaskIntent } from '../types/protocol';

export function createTask(input: { title?: string; userInput: string; intent?: TaskIntent }) {
  return authFetch<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listTasks() {
  return authFetch<Task[]>('/api/tasks');
}

export function getTask(taskId: string) {
  return authFetch<Task>(`/api/tasks/${taskId}`);
}

export function getTaskEvents(taskId: string) {
  return authFetch<AgentEvent[]>(`/api/tasks/${taskId}/events`);
}

export function getTaskArtifacts(taskId: string) {
  return authFetch<Artifact[]>(`/api/tasks/${taskId}/artifacts`);
}

export function getTaskApprovals(taskId: string) {
  return authFetch<Approval[]>(`/api/tasks/${taskId}/approvals`);
}
