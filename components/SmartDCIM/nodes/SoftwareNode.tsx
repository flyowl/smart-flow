
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ServerData, ItemType } from '../types';

// 软件节点尺寸 - 长方形圆角
const SOFTWARE_WIDTH_PX = 220;
const SOFTWARE_HEIGHT_PX = 70;

const SoftwareNode: React.FC<NodeProps<ServerData>> = ({ data, selected }) => {
  const isHighlighted = data.isMatchedType;
  const isSearchMatch = data.isSearchMatch;
  const isCurrentSearchMatch = data.isCurrentSearchMatch;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse';
      case 'maintenance': return 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      case 'malfunction': return 'bg-red-600 dark:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.9)] animate-pulse';
      case 'offline': return 'bg-slate-500 dark:bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.8)]';
      default: return 'bg-slate-500';
    }
  };

  const getTechStackIcon = () => {
    const tech = data.techStack?.toLowerCase() || '';
    if (tech.includes('java') || tech.includes('spring')) return 'fa-java';
    if (tech.includes('python') || tech.includes('django') || tech.includes('flask')) return 'fa-python';
    if (tech.includes('node') || tech.includes('javascript') || tech.includes('js')) return 'fa-node-js';
    if (tech.includes('react') || tech.includes('vue') || tech.includes('angular')) return 'fa-react';
    if (tech.includes('docker') || tech.includes('container')) return 'fa-docker';
    if (tech.includes('database') || tech.includes('sql') || tech.includes('mysql')) return 'fa-database';
    if (tech.includes('redis') || tech.includes('cache')) return 'fa-bolt';
    if (tech.includes('nginx') || tech.includes('apache')) return 'fa-server';
    return 'fa-code';
  };

  const getTechStackColor = () => {
    const tech = data.techStack?.toLowerCase() || '';
    if (tech.includes('java')) return 'text-orange-500 dark:text-orange-400';
    if (tech.includes('python')) return 'text-blue-500 dark:text-blue-400';
    if (tech.includes('node') || tech.includes('js')) return 'text-green-500 dark:text-green-400';
    if (tech.includes('react') || tech.includes('vue')) return 'text-cyan-500 dark:text-cyan-400';
    if (tech.includes('docker')) return 'text-blue-600 dark:text-blue-500';
    if (tech.includes('database') || tech.includes('sql')) return 'text-indigo-500 dark:text-indigo-400';
    return 'text-pink-500 dark:text-pink-400';
  };

  const tooltipText = `
软件名称: ${data.label}
版本: ${data.version || 'N/A'}
管理IP: ${data.ip || 'N/A'}
端口: ${data.port || 'N/A'}
技术栈: ${data.techStack || 'N/A'}
联系人: ${data.contact || 'N/A'}
状态: ${data.status}
  `.trim();

  // 连接点样式 - 扩大点击范围以提高选中便利性
  const handleStyle = "w-4 h-4 !bg-pink-300 dark:!bg-pink-400 !border-pink-400 dark:!border-pink-600 !border-2 hover:!bg-pink-500 hover:!border-pink-300 transition-all duration-200 hover:scale-[1.8] hover:shadow-[0_0_8px_rgba(236,72,153,0.8)] z-50";
  // 扩展的点击区域样式（透明但可点击）
  const handleHitAreaStyle = "absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-crosshair z-40";

  // 获取状态边框样式
  const getStatusBorderClass = () => {
    switch(data.status) {
      case 'malfunction':
        return 'ring-2 ring-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]';
      case 'maintenance':
        return 'ring-2 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      default:
        return '';
    }
  };

  return (
    <div
      title={tooltipText}
      className={`relative rounded-2xl flex items-center px-4 py-2 overflow-hidden gap-3
        bg-gradient-to-r from-pink-50 to-rose-50 
        dark:from-pink-950/80 dark:to-rose-950/80
        border-2 border-dashed border-pink-300 dark:border-pink-600/50
        hover:border-pink-400 dark:hover:border-pink-500
        ${selected ? 'ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
        ${isSearchMatch ? 'ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : ''}
        ${isCurrentSearchMatch ? 'ring-4 ring-pink-600 shadow-[0_0_25px_rgba(236,72,153,0.9)] scale-110' : ''}
        ${getStatusBorderClass()}
        transition-all duration-300 cursor-grab active:cursor-grabbing shadow-md group
      `}
      style={{
        width: `${SOFTWARE_WIDTH_PX}px`,
        height: `${SOFTWARE_HEIGHT_PX}px`,
      }}
    >
      {/* 装饰性背景图案 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-pink-400 rounded-full blur-2xl"></div>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-rose-400 rounded-full blur-2xl"></div>
      </div>

      {/* 左侧：技术栈图标 */}
      <div className="flex flex-col items-center gap-1 z-10 shrink-0">
        <div className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 rounded-xl shadow-sm border border-pink-200 dark:border-pink-700/50">
          <i className={`fa-brands ${getTechStackIcon()} ${getTechStackColor()} text-xl`}></i>
        </div>
      </div>

      {/* 中间：软件信息 */}
      <div className="flex flex-col gap-0.5 z-10 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-pink-100 leading-tight truncate" title={data.label}>
            {data.label}
          </span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        <div className="flex items-center gap-2">
          {data.version && (
            <span className="text-[10px] text-pink-600 dark:text-pink-300 font-mono bg-pink-100 dark:bg-pink-900/40 px-1.5 py-0.5 rounded-md">
              v{data.version}
            </span>
          )}
          {data.port && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              :{data.port}
            </span>
          )}
          {data.techStack && (
            <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate" title={data.techStack}>
              {data.techStack}
            </span>
          )}
        </div>
      </div>

      {/* 右侧：IP和联系人 */}
      <div className="flex flex-col items-end gap-1 z-10 shrink-0">
        {data.ip && (
          <div className="flex items-center gap-1 bg-blue-50/80 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-700/30">
            <i className="fa-solid fa-network-wired text-[8px] text-blue-500 dark:text-blue-400"></i>
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono">
              {data.ip}
            </span>
          </div>
        )}
        {data.contact && (
          <div className="flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-700/30">
            <i className="fa-solid fa-user text-[8px] text-emerald-500 dark:text-emerald-400"></i>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate max-w-[60px]" title={data.contact}>
              {data.contact}
            </span>
          </div>
        )}
      </div>

      {/* 上连接点 - 扩展点击区域 */}
      <div className={handleHitAreaStyle} style={{ top: '0px', left: '50%' }}>
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className={handleStyle}
          style={{ position: 'relative', top: '0px', left: '0px', transform: 'translate(-50%, -50%)' }}
        />
      </div>
      {/* 下连接点 - 扩展点击区域 */}
      <div className={handleHitAreaStyle} style={{ bottom: '0px', left: '50%', transform: 'translate(-50%, 50%)' }}>
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className={handleStyle}
          style={{ position: 'relative', top: '0px', left: '0px', transform: 'translate(-50%, -50%)' }}
        />
      </div>
      {/* 左连接点 - 扩展点击区域 */}
      <div className={handleHitAreaStyle} style={{ top: '50%', left: '0px' }}>
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className={handleStyle}
          style={{ position: 'relative', top: '0px', left: '0px', transform: 'translate(-50%, -50%)' }}
        />
      </div>
      {/* 右连接点 - 扩展点击区域 */}
      <div className={handleHitAreaStyle} style={{ top: '50%', right: '0px', left: 'auto', transform: 'translate(50%, -50%)' }}>
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className={handleStyle}
          style={{ position: 'relative', top: '0px', left: '0px', transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
};

export default memo(SoftwareNode);
