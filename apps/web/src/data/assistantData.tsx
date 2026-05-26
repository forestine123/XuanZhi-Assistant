import type { ComponentProps } from 'react';
import { Prompts } from '@ant-design/x';

import { Icon } from '../components/ui/icons';

type PromptItem = NonNullable<ComponentProps<typeof Prompts>['items']>[number];

export const conversationItems = [
  {
    key: 'today-1',
    label: '助手系统 Web 界面',
    group: '今天',
    icon: <Icon name="message" />,
  },
  {
    key: 'today-2',
    label: '知识库问答流程',
    group: '今天',
    icon: <Icon name="book" />,
  },
  {
    key: 'today-3',
    label: 'Agent 工具调用设计',
    group: '今天',
    icon: <Icon name="tool" />,
  },
  {
    key: 'yesterday-1',
    label: '检索增强方案',
    group: '昨天',
    icon: <Icon name="file-search" />,
  },
  {
    key: 'yesterday-2',
    label: '多模型路由策略',
    group: '昨天',
    icon: <Icon name="cloud" />,
  },
];

export const promptItems: PromptItem[] = [
  {
    key: 'prd',
    icon: <Icon name="bulb" />,
    label: '预约复盘会议',
    description: '下周三上午约张三',
  },
  {
    key: 'kb',
    icon: <Icon name="database" />,
    label: '知识库问答',
    description: '基于资料回答并标注依据',
  },
  {
    key: 'agent',
    icon: <Icon name="experiment" />,
    label: 'Agent 编排',
    description: '拆解步骤并安排工具',
  },
  {
    key: 'review',
    icon: <Icon name="check-circle" />,
    label: '体验检查',
    description: '检查交互、布局和可用性',
  },
];

export const promptDrafts: Record<string, string> = {
  prd: '下周三上午帮我预约张三开项目复盘会',
  kb: '基于上传的知识库资料，回答用户问题时如何展示来源和置信度？',
  agent: '帮我设计一个 Agent 编排流程，包含意图识别、工具选择、执行和结果归纳。',
  review: '检查这个助手界面的信息架构、交互状态和视觉层级，并提出优化建议。',
};

export const toolTags = [
  { label: '深度思考', icon: <Icon name="experiment" /> },
  { label: '联网搜索', icon: <Icon name="search" /> },
  { label: '知识库', icon: <Icon name="book" /> },
  { label: '工具调用', icon: <Icon name="tool" /> },
];
