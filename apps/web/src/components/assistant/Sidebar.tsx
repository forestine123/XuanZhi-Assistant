import { useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar, Button, Modal, Popover, Tag, Typography } from 'antd';
import { Conversations } from '@ant-design/x';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LogoutOutlined,
  MoreOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { BrandLockup } from '../brand/BrandLockup';
import type { Task, User } from '../../types/protocol';

const { Text } = Typography;

type SidebarProps = {
  activeKey?: string;
  collapsed: boolean;
  currentUser: User;
  tasks: Task[];
  onActiveChange: (taskId: string) => void;
  onCreateConversation: () => void;
  onLogout: () => void;
};

const taskStatusMeta = {
  created: { label: '已创建', icon: <ClockCircleOutlined />, color: 'default' },
  planning: { label: '规划中', icon: <LoadingOutlined />, color: 'processing' },
  running: { label: '执行中', icon: <LoadingOutlined />, color: 'processing' },
  waiting_approval: { label: '等待确认', icon: <ClockCircleOutlined />, color: 'warning' },
  completed: { label: '已完成', icon: <CheckCircleOutlined />, color: 'success' },
  failed: { label: '失败', icon: <CloseCircleOutlined />, color: 'error' },
} satisfies Record<Task['status'], { label: string; icon: ReactNode; color: string }>;

export function Sidebar({
  activeKey,
  collapsed,
  currentUser,
  tasks,
  onActiveChange,
  onCreateConversation,
  onLogout,
}: SidebarProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = () => {
    setAccountMenuOpen(false);
    setSettingsOpen(true);
  };

  const logout = () => {
    setAccountMenuOpen(false);
    onLogout();
  };

  const accountMenu = (
    <div className="sidebar-user-menu">
      <Button type="text" icon={<SettingOutlined />} className="sidebar-user-menu-item" onClick={openSettings}>
        设置
      </Button>
      <Button
        type="text"
        danger
        icon={<LogoutOutlined />}
        className="sidebar-user-menu-item"
        onClick={logout}
      >
        退出登录
      </Button>
    </div>
  );

  const conversationItems = tasks.map((task) => ({
    key: task.id,
    label: task.title,
    group: taskStatusMeta[task.status].label,
    icon: taskStatusMeta[task.status].icon,
  }));

  return (
    <aside className="assistant-sidebar" aria-hidden={collapsed}>
      <div className="assistant-sidebar-panel">
        <BrandLockup />

        <Button icon={<PlusOutlined />} className="new-chat-button" onClick={onCreateConversation}>
          新对话
        </Button>

        <Conversations
          className="conversation-list"
          activeKey={activeKey}
          items={conversationItems}
          groupable={{
            collapsible: true,
            defaultExpandedKeys: ['今天', '昨天'],
          }}
          onActiveChange={onActiveChange}
        />

        <div className="sidebar-footer">
          <Avatar size={28} icon={<UserOutlined />} />
          <div className="sidebar-footer-copy">
            <Text strong>{currentUser.name}</Text>
            <Tag color="blue">{currentUser.email}</Tag>
          </div>
          <Popover
            trigger="click"
            placement="topRight"
            open={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
            content={accountMenu}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label="账户菜单" />
          </Popover>
        </div>
      </div>

      <Modal
        title="设置"
        open={settingsOpen}
        footer={null}
        width={360}
        centered
        onCancel={() => setSettingsOpen(false)}
      >
        <div className="sidebar-settings-panel">
          <div>
            <Text type="secondary">当前账号</Text>
            <Text strong>{currentUser.name}</Text>
          </div>
          <div>
            <Text type="secondary">邮箱</Text>
            <Text strong>{currentUser.email}</Text>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
