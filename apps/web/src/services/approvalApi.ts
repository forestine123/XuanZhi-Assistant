import { authFetch } from './apiClient';

import type { Approval } from '../types/protocol';

export function approveApproval(approvalId: string) {
  return authFetch<Approval>(`/api/approvals/${approvalId}/approve`, {
    method: 'POST',
  });
}

export function rejectApproval(approvalId: string) {
  return authFetch<Approval>(`/api/approvals/${approvalId}/reject`, {
    method: 'POST',
  });
}
