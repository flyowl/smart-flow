import { Node } from 'reactflow';

export enum ItemType {
  RACK = 'rack',
  PLACEHOLDER = 'placeholder',
  SERVER = 'server',
  NETWORK = 'network',
  STORAGE = 'storage',
  FIREWALL = 'firewall',
  VIRTUAL_MACHINE = 'virtual_machine',
  ZONE = 'zone',
  SOFTWARE = 'software'
}

export interface ZoneData {
  label: string;
  width: number;
  height: number;
  description?: string;
  color?: string;
}

export interface RackData {
  label: string;
  totalU: number;
  type: ItemType.RACK | ItemType.PLACEHOLDER;
  description?: string;
  assetId?: string; 
  isMatchedType?: boolean; 
  isDropTarget?: boolean;
  // 拖拽预览U位位置
  previewUPosition?: number | null;  // 实时预览的U位位置（从底部开始，0 = 底部）
  previewUHeight?: number;           // 预览设备的U高度
}

export interface ServerData {
  label: string;
  uHeight: number;
  type: ItemType;
  status: 'active' | 'maintenance' | 'offline' | 'malfunction';
  model?: string;
  ip?: string;
  assetId?: string;
  contact?: string;
  description?: string;
  isMatchedType?: boolean;
  isSearchMatch?: boolean;
  isCurrentSearchMatch?: boolean;
  // 虚拟机配置
  cpu?: number;        // CPU 核数
  memory?: number;     // 内存大小 (GB)
  // 软件节点配置
  version?: string;    // 软件版本
  port?: number;       // 服务端口号
  techStack?: string;  // 技术栈
}

export interface PortConnectionData {
  sourcePort: string;
  targetPort: string;
  speed?: string; 
  color?: string;
}

export type RackNode = Node<RackData>;
export type ServerNode = Node<ServerData>;
export type ZoneNode = Node<ZoneData>;

export interface DragItem {
  type: ItemType;
  uHeight?: number;
  totalU?: number;
  label?: string;
  width?: number;
  height?: number;
  cpu?: number;       // 虚拟机 CPU 核数
  memory?: number;    // 虚拟机内存大小 (GB)
  // 软件节点配置
  techStack?: string; // 技术栈
  version?: string;   // 软件版本
  port?: number;      // 服务端口号
}