import { Button, Space, Tooltip } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

import type { Task } from '../../types/protocol';

type WorkspaceHeaderProps = {
  sidebarCollapsed: boolean;
  workspaceCollapsed: boolean;
  task?: Task;
  onCreateConversation: () => void;
  onToggleSidebar: () => void;
  onToggleWorkspace: () => void;
};

export function WorkspaceHeader({
  sidebarCollapsed,
  workspaceCollapsed,
  task,
  onCreateConversation,
  onToggleSidebar,
  onToggleWorkspace,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-start">
        <Tooltip title={sidebarCollapsed ? '显示侧边栏' : '隐藏侧边栏'}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? '显示侧边栏' : '隐藏侧边栏'}
            aria-expanded={!sidebarCollapsed}
            onClick={onToggleSidebar}
          />
        </Tooltip>
        <div className="collapsed-new-chat-wrap" aria-hidden={!sidebarCollapsed}>
          <Tooltip title="新对话">
            <Button
              type="text"
              shape="circle"
              icon={<PlusOutlined />}
              className="collapsed-new-chat-button"
              aria-label="新对话"
              tabIndex={sidebarCollapsed ? 0 : -1}
              onClick={onCreateConversation}
            />
          </Tooltip>
        </div>
        {task ? (
          <div className="workspace-title">
            <span>{task.title}</span>
            <small>{task.status}</small>
          </div>
        ) : null}
      </div>
      <Space size={8}>
        <Tooltip title="搜索">
          <Button type="text" shape="circle" icon={<SearchOutlined />} />
        </Tooltip>
        {task ? (
          <Tooltip title={workspaceCollapsed ? '显示工作台' : '隐藏工作台'}>
            <Button
              type="text"
              shape="circle"
              icon={workspaceCollapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              className="workspace-toggle"
              aria-label={workspaceCollapsed ? '显示工作台' : '隐藏工作台'}
              aria-expanded={!workspaceCollapsed}
              onClick={onToggleWorkspace}
            />
          </Tooltip>
        ) : null}
        <Tooltip title="更多">
          <Button type="text" shape="circle" icon={<MoreOutlined />} />
        </Tooltip>
      </Space>
    </header>
  );
}
