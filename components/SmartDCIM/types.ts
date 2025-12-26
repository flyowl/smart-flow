import { Node } from 'reactflow';

export enum ItemType {
  RACK = 'rack',
  PLACEHOLDER = 'placeholder',
  SERVER = 'server',
  NETWORK = 'network',
  STORAGE = 'storage',
  FIREWALL = 'firewall',
  ZONE = 'zone'
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
}