import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';

import { promptDrafts } from '../../data/assistantData';
import * as approvalApi from '../../services/approvalApi';
import * as messageApi from '../../services/messageApi';
import { subscribeTaskStream } from '../../services/streamClient';
import * as taskApi from '../../services/taskApi';
import {
  replaceTaskRecord,
  upsertById,
  upsertTaskRecordItem,
} from '../../stores/taskStore';
import type { AgentEvent, Approval, Artifact, Message, StreamEvent, Task, User } from '../../types/protocol';
import { AgentWorkspace } from '../agent/AgentWorkspace';
import { ChatComposer } from '../chat/ChatComposer';
import { ChatHome } from '../chat/ChatHome';
import { ChatPanel } from '../chat/ChatPanel';
import { Sidebar } from './Sidebar';
import { WorkspaceHeader } from './WorkspaceHeader';

type AssistantShellProps = {
  currentUser: User;
  token: string;
  onLogout: () => void;
};

export function AssistantShell({ currentUser, token, onLogout }: AssistantShellProps) {
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [inputValue, setInputValue] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messagesByTask, setMessagesByTask] = useState<Record<string, Message[]>>({});
  const [eventsByTask, setEventsByTask] = useState<Record<string, AgentEvent[]>>({});
  const [artifactsByTask, setArtifactsByTask] = useState<Record<string, Artifact[]>>({});
  const [approvalsByTask, setApprovalsByTask] = useState<Record<string, Approval[]>>({});
  const [approvingId, setApprovingId] = useState<string>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  // 同一时间只订阅当前任务的 SSE，切换任务或登出时立即关闭，避免旧任务事件写入新视图。
  const streamCleanupRef = useRef<(() => void) | undefined>(undefined);

  const closeStream = useCallback(() => {
    streamCleanupRef.current?.();
    streamCleanupRef.current = undefined;
  }, []);

  const applyStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'task.updated':
        setTasks((current) => upsertById(current, event.data));
        break;
      case 'message.created':
        setMessagesByTask((current) => upsertTaskRecordItem(current, event.data.taskId, event.data));
        break;
      case 'agent.event.created':
        setEventsByTask((current) => upsertTaskRecordItem(current, event.data.taskId, event.data));
        break;
      case 'artifact.created':
        setArtifactsByTask((current) => upsertTaskRecordItem(current, event.data.taskId, event.data));
        break;
      case 'approval.requested':
      case 'approval.updated':
        setApprovalsByTask((current) => upsertTaskRecordItem(current, event.data.taskId, event.data));
        break;
    }
  }, []);

  const loadTaskSnapshot = useCallback(async (taskId: string) => {
    const [task, messages, events, artifacts, approvals] = await Promise.all([
      taskApi.getTask(taskId),
      messageApi.getTaskMessages(taskId),
      taskApi.getTaskEvents(taskId),
      taskApi.getTaskArtifacts(taskId),
      taskApi.getTaskApprovals(taskId),
    ]);

    setTasks((current) => upsertById(current, task));
    setMessagesByTask((current) => replaceTaskRecord(current, taskId, messages));
    setEventsByTask((current) => replaceTaskRecord(current, taskId, events));
    setArtifactsByTask((current) => replaceTaskRecord(current, taskId, artifacts));
    setApprovalsByTask((current) => replaceTaskRecord(current, taskId, approvals));

    return task;
  }, []);

  const loadApprovalSummaries = useCallback(async (nextTasks: Task[]) => {
    if (nextTasks.length === 0) {
      return {};
    }

    const entries = await Promise.all(
      nextTasks.map(async (task) => [task.id, await taskApi.getTaskApprovals(task.id)] as const),
    );

    return Object.fromEntries(entries) as Record<string, Approval[]>;
  }, []);

  const openTask = useCallback(
    async (taskId: string) => {
      closeStream();
      setActiveTaskId(taskId);
      try {
        // 先加载任务快照再建立当前任务 SSE；创建新任务时会先进入这里，再发送首条消息触发 Mock Agent。
        await loadTaskSnapshot(taskId);
        // 只保存当前任务连接的关闭函数，切换任务时 closeStream 会停止旧连接继续写入状态。
        streamCleanupRef.current = subscribeTaskStream(
          taskId,
          token,
          applyStreamEvent,
          () => message.warning('任务实时连接已断开，请重新选择任务'),
        );
      } catch (error) {
        message.error(error instanceof Error ? error.message : '加载任务失败');
      }
    },
    [applyStreamEvent, closeStream, loadTaskSnapshot, token],
  );

  useEffect(() => {
    let cancelled = false;

    taskApi
      .listTasks()
      .then(async (nextTasks) => {
        if (!cancelled) {
          setTasks(nextTasks);
        }
        const approvalSummaries = await loadApprovalSummaries(nextTasks);
        if (!cancelled) {
          setApprovalsByTask((current) => ({
            ...current,
            ...approvalSummaries,
          }));
        }
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '加载任务列表失败');
      });

    return () => {
      cancelled = true;
      closeStream();
    };
  }, [closeStream, loadApprovalSummaries]);

  const submitMessage = useCallback(
    async (value: string) => {
      const question = value.trim();

      if (!question) {
        return;
      }

      setInputValue('');

      try {
        const task =
          activeTaskId && tasks.some((item) => item.id === activeTaskId)
            ? tasks.find((item) => item.id === activeTaskId)
            : await taskApi.createTask({
                title: question.slice(0, 28),
                userInput: question,
                intent: 'meeting',
              });

        if (!task) {
          return;
        }

        setTasks((current) => upsertById(current, task));

        if (task.id !== activeTaskId) {
          // 新任务需要先打开详情并建立 SSE，再发送首条消息；Mock Agent 会在消息写入后立刻推送事件。
          await openTask(task.id);
        }

        const createdMessage = await messageApi.sendTaskMessage(task.id, question);
        setMessagesByTask((current) => upsertTaskRecordItem(current, task.id, createdMessage));
        // Mock Agent 目前会同步生成事件、产物和审批；这里主动刷新一次快照，
        // 避免 SSE 连接尚未完全建立时漏掉首轮进度和审批。
        await loadTaskSnapshot(task.id);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '发送失败');
        setInputValue(question);
      }
    },
    [activeTaskId, loadTaskSnapshot, openTask, tasks],
  );

  const createConversation = useCallback(() => {
    closeStream();
    setActiveTaskId(undefined);
    setInputValue('');
  }, [closeStream]);

  const selectPrompt = useCallback((key: string) => {
    setInputValue(promptDrafts[key] ?? '');
  }, []);

  const copyMessage = useCallback((content: string) => {
    void navigator.clipboard?.writeText(content);
  }, []);

  const editMessage = useCallback((content: string) => {
    setInputValue(content);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const toggleWorkspace = useCallback(() => {
    setWorkspaceCollapsed((collapsed) => !collapsed);
  }, []);

  const approve = useCallback(async (approvalId: string) => {
    setApprovingId(approvalId);
    try {
      const approval = await approvalApi.approveApproval(approvalId);
      setApprovalsByTask((current) => upsertTaskRecordItem(current, approval.taskId, approval));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '确认失败');
    } finally {
      setApprovingId(undefined);
    }
  }, []);

  const reject = useCallback(async (approvalId: string) => {
    setApprovingId(approvalId);
    try {
      const approval = await approvalApi.rejectApproval(approvalId);
      setApprovalsByTask((current) => upsertTaskRecordItem(current, approval.taskId, approval));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拒绝失败');
    } finally {
      setApprovingId(undefined);
    }
  }, []);

  const handleLogout = useCallback(() => {
    // 登出是用户隔离边界：关闭 SSE 并清掉所有任务态缓存，防止下一个用户看到上一位的残留数据。
    closeStream();
    setTasks([]);
    setMessagesByTask({});
    setEventsByTask({});
    setArtifactsByTask({});
    setApprovalsByTask({});
    onLogout();
  }, [closeStream, onLogout]);

  const activeTask = tasks.find((task) => task.id === activeTaskId);
  const activeMessages = activeTaskId ? messagesByTask[activeTaskId] ?? [] : [];
  const activeEvents = activeTaskId ? eventsByTask[activeTaskId] ?? [] : [];
  const activeArtifacts = activeTaskId ? artifactsByTask[activeTaskId] ?? [] : [];
  const activeApprovals = activeTaskId ? approvalsByTask[activeTaskId] ?? [] : [];
  const pendingApprovalSummaries = useMemo(
    () =>
      tasks
        .map((task) => ({
          task,
          approvals: (approvalsByTask[task.id] ?? []).filter((approval) => approval.status === 'pending'),
        }))
        .filter((item) => item.approvals.length > 0),
    [approvalsByTask, tasks],
  );
  const pendingApprovalCount = pendingApprovalSummaries.reduce((count, item) => count + item.approvals.length, 0);
  const approvalRecords = useMemo(
    () =>
      tasks.flatMap((task) =>
        (approvalsByTask[task.id] ?? []).map((approval) => ({
          approval,
          task,
        })),
      ),
    [approvalsByTask, tasks],
  );
  const isChatting = Boolean(activeTask);

  return (
    <main className={`assistant-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activeKey={activeTaskId}
        collapsed={sidebarCollapsed}
        currentUser={currentUser}
        approvalRecords={approvalRecords}
        tasks={tasks}
        onActiveChange={(taskId) => void openTask(taskId)}
        onCreateConversation={createConversation}
        onLogout={handleLogout}
      />

      <section
        className={`assistant-main ${isChatting ? 'is-chatting' : 'is-home'} ${
          workspaceCollapsed ? 'is-workspace-collapsed' : ''
        }`}
      >
        <WorkspaceHeader
          sidebarCollapsed={sidebarCollapsed}
          workspaceCollapsed={workspaceCollapsed}
          pendingApprovalCount={pendingApprovalCount}
          pendingApprovalSummaries={pendingApprovalSummaries}
          task={activeTask}
          onCreateConversation={createConversation}
          onOpenTask={(taskId) => void openTask(taskId)}
          onToggleSidebar={toggleSidebar}
          onToggleWorkspace={toggleWorkspace}
        />

        <div className={`workspace-body ${isChatting ? 'is-task' : ''}`}>
          {isChatting && activeTask ? (
            <div className={`task-workspace ${workspaceCollapsed ? 'is-workspace-collapsed' : ''}`}>
              <section className="task-chat-column">
                <ChatPanel
                  messages={activeMessages}
                  onCopyMessage={copyMessage}
                  onEditMessage={editMessage}
                />
              </section>
              <AgentWorkspace
                approvals={activeApprovals}
                approvingId={approvingId}
                events={activeEvents}
                artifacts={activeArtifacts}
                onApprove={approve}
                onReject={reject}
              />
            </div>
          ) : (
            <ChatHome
              inputValue={inputValue}
              onInputChange={setInputValue}
              onPromptSelect={selectPrompt}
              onSubmitMessage={submitMessage}
            />
          )}
        </div>

        {isChatting ? (
          <footer className="composer-area">
            <ChatComposer value={inputValue} variant="chat" onChange={setInputValue} onSubmit={submitMessage} />
          </footer>
        ) : null}
      </section>
    </main>
  );
}
