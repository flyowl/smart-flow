
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ServerData, ItemType } from '../../types';
import { PX_PER_U, SERVER_WIDTH_PX } from '../../constants';

const ServerNode: React.FC<NodeProps<ServerData>> = ({ data, selected }) => {
  const height = data.uHeight * PX_PER_U;
  const isHighlighted = data.isMatchedType;

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
      case ItemType.STORAGE: return 'fa-database text-cyan-600 dark:text-cyan-400'; // Changed to Cyan
      case ItemType.FIREWALL: return 'fa-shield-halved text-orange-500 dark:text-orange-400';
      default: return 'fa-server text-emerald-600 dark:text-emerald-400'; // Server
    }
  };

  const getStyleClasses = () => {
    switch(data.type) {
      case ItemType.NETWORK:
        // Indigo / Blue for Network
        return 'bg-gradient-to-r from-indigo-50 to-white border-indigo-200 hover:border-indigo-400 dark:from-indigo-950/90 dark:to-slate-800 dark:border-indigo-500/50 dark:hover:border-indigo-400';
      case ItemType.STORAGE:
        // Cyan for Storage (Distinct from Network/Indigo)
        return 'bg-gradient-to-r from-cyan-50 to-white border-cyan-200 hover:border-cyan-400 dark:from-cyan-950/90 dark:to-slate-800 dark:border-cyan-500/50 dark:hover:border-cyan-400';
      case ItemType.FIREWALL:
        // Orange for Firewall
        return 'bg-gradient-to-r from-orange-50 to-white border-orange-200 hover:border-orange-400 dark:from-orange-950/90 dark:to-slate-800 dark:border-orange-500/50 dark:hover:border-orange-400';
      default: 
        // Slate / Emerald tint for Servers
        return 'bg-gradient-to-r from-slate-50 to-white border-slate-300 hover:border-slate-400 dark:from-slate-800 dark:to-slate-800 dark:border-slate-600 dark:hover:border-slate-500';
    }
  };

  // Construct a detailed tooltip string
  const tooltipText = `
Name: ${data.label}
Asset ID: ${data.assetId || 'N/A'}
Type: ${data.type}
IP: ${data.ip || 'N/A'}
Contact: ${data.contact || 'N/A'}
Status: ${data.status}
Model: ${data.model || 'N/A'}
  `.trim();

  // Enhanced handle styles for better UX
  const handleStyle = "w-3 h-3 !bg-slate-300 dark:!bg-slate-400 !border-slate-400 dark:!border-slate-600 !border-2 hover:!bg-blue-500 hover:!border-blue-300 transition-all duration-200 hover:scale-[1.8] hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] z-50";

  return (
    <div 
      title={tooltipText}
      className={`relative rounded border flex items-center justify-between px-4 overflow-hidden
        ${selected ? 'ring-2 ring-blue-400 z-50' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-50 brightness-110' : ''}
        ${getStyleClasses()}
        transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm group
      `}
      style={{ 
        width: `${SERVER_WIDTH_PX}px`, 
        height: `${height}px`,
      }}
    >
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
        </div>

        {/* Left: Indicators */}
        <div className="flex items-center gap-3 z-10 w-3/4">
            <div className="flex flex-col gap-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)}`}></div>
            </div>
            <div className="h-full border-r border-slate-300 dark:border-white/10 mx-1 shrink-0"></div>
            
            {/* Device Icon */}
            <div className="w-6 flex justify-center shrink-0">
                 <i className={`fa-solid ${getDeviceIcon()} text-sm`}></i>
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[220px]" title={data.label}>
                    {data.label}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-tight truncate max-w-[140px]">
                        {data.model || 'GENERIC'}
                    </span>
                    {data.assetId && (
                        <span className="text-[10px] text-yellow-700 dark:text-yellow-300 font-mono bg-yellow-100 dark:bg-yellow-900/40 px-1.5 rounded border border-yellow-200 dark:border-yellow-700/30 shrink-0">
                            {data.assetId}
                        </span>
                    )}
                    {data.ip && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-900/40 px-1.5 rounded hidden group-hover:inline-block shrink-0">
                            {data.ip}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Right: Ports/Label */}
        <div className="flex items-center gap-3 z-10">
             {/* Fake Ports - vary color by type */}
            <div className="flex gap-1 opacity-50">
                 <div className="w-2.5 h-2.5 bg-slate-800/10 dark:bg-black/40 border border-slate-400 dark:border-white/20 rounded-[1px]"></div>
                 <div className="w-2.5 h-2.5 bg-slate-800/10 dark:bg-black/40 border border-slate-400 dark:border-white/20 rounded-[1px]"></div>
            </div>
            <div className="bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 shrink-0">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">{data.uHeight}U</span>
            </div>
        </div>

      {/* Handles with magnified hover effect */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyle}
        style={{ left: '-6px' }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyle}
        style={{ right: '-6px' }}
      />
    </div>
  );
};

export default memo(ServerNode);
