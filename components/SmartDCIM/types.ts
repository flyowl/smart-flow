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
  SOFTWARE = 'software',
  UDF = 'udf'
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
  cpu?: number;
  memory?: number;
  version?: string;
  port?: number;
  techStack?: string;
}

export interface UdfData {
  label: string;
  fiberPorts: number;
  networkPorts: number;
  status: 'active' | 'maintenance' | 'offline' | 'malfunction';
  model?: string;
  assetId?: string;
  description?: string;
  isMatchedType?: boolean;
  isSearchMatch?: boolean;
  isCurrentSearchMatch?: boolean;
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
export type UdfNode = Node<UdfData>;

export interface DragItem {
  type: ItemType;
  uHeight?: number;
  totalU?: number;
  label?: string;
  width?: number;
  height?: number;
  cpu?: number;
  memory?: number;
  techStack?: string;
  version?: string;
  port?: number;
  fiberPorts?: number;
  networkPorts?: number;
}