
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ServerData, ItemType } from '../../types';
import { PX_PER_U, SERVER_WIDTH_PX } from '../../constants';

const ServerNode: React.FC<NodeProps<ServerData>> = ({ data, selected }) => {
  const height = data.uHeight * PX_PER_U;
  const isHighlighted = data.isMatchedType;
  const isSearchMatch = data.isSearchMatch;
  const isCurrentSearchMatch = data.isCurrentSearchMatch;
  const isVirtualMachine = data.type === ItemType.VIRTUAL_MACHINE;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.6)] animate-pulse';
      case 'maintenance': return 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]';
      case 'malfunction': return 'bg-red-600 dark:bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse';
      case 'offline': return 'bg-slate-500 dark:bg-slate-500 shadow-[0_0_5px_rgba(100,116,139,0.6)]';
      default: return 'bg-slate-500';
    }
  };

  const getDeviceIcon = () => {
    switch(data.type) {
      case ItemType.NETWORK: return 'fa-network-wired text-indigo-500 dark:text-indigo-400';
      case ItemType.STORAGE: return 'fa-database text-cyan-600 dark:text-cyan-400';
      case ItemType.FIREWALL: return 'fa-shield-halved text-orange-500 dark:text-orange-400';
      case ItemType.VIRTUAL_MACHINE: return 'fa-cloud text-purple-500 dark:text-purple-400';
      default: return 'fa-server text-emerald-600 dark:text-emerald-400';
    }
  };

  const getStyleClasses = () => {
    const baseBorderClass = isVirtualMachine
      ? 'border-dashed border-2'
      : 'border';

    switch(data.type) {
      case ItemType.NETWORK:
        return `${baseBorderClass} bg-gradient-to-r from-indigo-950/90 to-slate-800 border-indigo-500/50 hover:border-indigo-400`;
      case ItemType.STORAGE:
        return `${baseBorderClass} bg-gradient-to-r from-cyan-950/90 to-slate-800 border-cyan-500/50 hover:border-cyan-400`;
      case ItemType.FIREWALL:
        return `${baseBorderClass} bg-gradient-to-r from-orange-950/90 to-slate-800 border-orange-500/50 hover:border-orange-400`;
      case ItemType.VIRTUAL_MACHINE:
        return `${baseBorderClass} bg-gradient-to-r from-purple-950/90 to-slate-800 border-purple-500/50 hover:border-purple-400`;
      default:
        return `${baseBorderClass} bg-gradient-to-r from-slate-800 to-slate-800 border-slate-600 hover:border-slate-500`;
    }
  };

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

  const tooltipText = `
Name: ${data.label}
Asset ID: ${data.assetId || 'N/A'}
Type: ${data.type}
IP: ${data.ip || 'N/A'}
Contact: ${data.contact || 'N/A'}
Status: ${data.status}
Model: ${data.model || 'N/A'}
  `.trim();

  // 连接点样式 - 扩大点击范围以提高选中便利性
  const handleStyle = "w-4 h-4 !bg-slate-300 dark:!bg-slate-400 !border-slate-400 dark:!border-slate-600 !border-2 hover:!bg-blue-500 hover:!border-blue-300 transition-all duration-200 hover:scale-[1.8] hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] z-50";
  // 扩展的点击区域样式（透明但可点击）
  const handleHitAreaStyle = "absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-crosshair z-40";

  return (
    <div
      title={tooltipText}
      className={`relative rounded flex items-center justify-between px-4 overflow-hidden
        ${selected ? 'ring-2 ring-blue-400 z-50' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-50 brightness-110' : ''}
        ${isSearchMatch ? 'ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] z-40' : ''}
        ${isCurrentSearchMatch ? 'ring-4 ring-pink-600 shadow-[0_0_25px_rgba(236,72,153,0.9)] z-50 scale-110' : ''}
        ${getStyleClasses()}
        ${getStatusBorderClass()}
        transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm group
      `}
      style={{
        width: `${SERVER_WIDTH_PX}px`,
        height: `${height}px`,
      }}
    >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
        </div>

        <div className="flex items-center gap-3 z-10 w-3/4">
            <div className="flex flex-col gap-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)}`}></div>
            </div>
            <div className="h-full border-r border-white/10 mx-1 shrink-0"></div>

            <div className="w-6 flex justify-center shrink-0">
                 <i className={`fa-solid ${getDeviceIcon()} text-sm`}></i>
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-100 leading-tight truncate max-w-[220px]" title={data.label}>
                    {data.label}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-slate-400 font-mono leading-tight truncate max-w-[140px]">
                        {data.model || 'GENERIC'}
                    </span>
                    {data.assetId && (
                        <span className="text-[10px] text-yellow-300 font-mono bg-yellow-900/40 px-1.5 rounded border border-yellow-700/30 shrink-0">
                            {data.assetId}
                        </span>
                    )}
                    {data.ip && (
                        <span className="text-[10px] text-blue-300 font-mono bg-blue-900/40 px-1.5 rounded shrink-0">
                            {data.ip}
                        </span>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 z-10">
            <div className="flex gap-1 opacity-50">
                 <div className="w-2.5 h-2.5 bg-black/40 border border-white/20 rounded-[1px]"></div>
                 <div className="w-2.5 h-2.5 bg-black/40 border border-white/20 rounded-[1px]"></div>
            </div>
            <div className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                <span className="text-xs text-slate-300 font-mono font-bold">{data.uHeight}U</span>
            </div>
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

export default memo(ServerNode);
