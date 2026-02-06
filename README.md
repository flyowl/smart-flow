# Smart Flow

一个基于 React 和 ReactFlow 的数据中心基础设施管理（DCIM）可视化系统，支持拖拽式节点管理、AI 智能辅助和实时状态监控。

## ✨ 特性

- 🎨 **可视化节点管理** - 支持区域（Zone）、机柜（Rack）、服务器、网络设备、存储设备、防火墙、虚拟机等多种节点类型
- 🖱️ **拖拽式操作** - 直观的拖拽界面，轻松创建和管理设备节点
- 🔗 **智能连接** - 支持节点间的端口连接，可视化展示设备间的网络拓扑关系
- 🤖 **AI 智能助手** - 集成 Google Gemini AI，提供智能建议和辅助决策
- 🔍 **快速检索** - 支持按设备名称、IP 地址进行搜索，高亮显示匹配结果
- 🚨 **状态监控** - 实时显示设备状态（正常、故障、维护等），故障设备红色闪烁提醒
- 🌓 **深色/浅色主题** - 支持主题切换，适应不同使用场景
- 📐 **精确布局** - 机柜 U 数从 0 开始，支持精确的设备放置和空间管理
- 🎯 **虚拟机标识** - 虚拟机节点采用虚线边框，一目了然

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

### 构建生产版本

```bash
pnpm run build
```

### 预览构建结果

```bash
pnpm run preview
```

## 📦 项目结构

```
smart-flow/
├── components/
│   ├── SmartDCIM/          # DCIM 核心组件
│   │   ├── edges/          # 自定义边组件
│   │   ├── nodes/          # 自定义节点组件
│   │   └── services/       # 服务层
│   ├── edges/              # 边组件
│   ├── nodes/              # 节点组件
│   ├── ContextMenu.tsx     # 右键菜单
│   ├── EdgeDetailsPanel.tsx # 边详情面板
│   ├── GeminiAdvisor.tsx   # AI 助手
│   ├── NodeDetailsPanel.tsx # 节点详情面板
│   ├── Sidebar.tsx         # 侧边栏
│   └── VisibilityControls.tsx # 可见性控制
├── services/
│   └── geminiService.ts    # Gemini AI 服务
├── App.tsx                 # 主应用组件
├── types.ts                # 类型定义
├── constants.ts            # 常量定义
└── vite.config.ts          # Vite 配置
```

## 🛠️ 技术栈

- **框架**: React 19.2.0
- **语言**: TypeScript 5.8.2
- **构建工具**: Vite 6.2.0
- **流程图库**: ReactFlow 11.11.4
- **样式**: TailwindCSS 4.1.18
- **AI 集成**: Google GenAI 1.30.0
- **图标**: FontAwesome Free 7.1.0

## 🎯 核心功能

### 节点类型

| 类型 | 说明 | 特殊标识 |
|------|------|----------|
| Zone | 区域 | - |
| Rack | 机柜 | U 数从 0 开始 |
| Server | 服务器 | - |
| Network | 网络设备 | - |
| Storage | 存储设备 | - |
| Firewall | 防火墙 | - |
| Virtual Machine | 虚拟机 | 虚线边框 |

### 设备状态

- **正常** - 默认状态
- **故障** - 红色边框闪烁
- **维护** - 特殊边框样式

### 操作说明

1. **创建节点** - 从左侧侧边栏拖拽节点类型到画布
2. **连接节点** - 拖拽节点的连接点（上下左右四个方向）到其他节点
3. **编辑节点** - 右键点击节点，选择编辑选项
4. **搜索设备** - 使用搜索框输入设备名称或 IP 地址
5. **切换主题** - 点击主题切换按钮切换深色/浅色模式
6. **AI 助手** - 点击 AI 助手图标获取智能建议

## 🔧 配置

### 环境变量

项目支持多环境配置：

- `.env` - 默认环境
- `.env.test` - 测试环境
- `.env.production` - 生产环境

### Gemini API 配置

在环境变量文件中配置 Gemini API Key：

```
VITE_GEMINI_API_KEY=your_api_key_here
```

## 📝 开发指南

### 添加新的节点类型

1. 在 `components/nodes/` 目录下创建新的节点组件
2. 在 `App.tsx` 中注册新的节点类型
3. 在 `types.ts` 中添加对应的类型定义

### 自定义边样式

1. 在 `components/edges/` 目录下创建或修改边组件
2. 在 `App.tsx` 中注册新的边类型

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 📮 联系方式

如有问题或建议，请通过 Issue 联系我们。
