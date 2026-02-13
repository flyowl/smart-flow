
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UdfData } from '../types';
import { UDF_WIDTH_PX, UDF_HEIGHT_PX } from '../constants';

const UdfNode: React.FC<NodeProps<UdfData>> = ({ data, selected }) => {
  const isHighlighted = data.isMatchedType;
  const isSearchMatch = data.isSearchMatch;
  const isCurrentSearchMatch = data.isCurrentSearchMatch;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.6)] animate-pulse';
      case 'maintenance': return 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]';
      case 'malfunction': return 'bg-red-600 dark:bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse';
      case 'offline': return 'bg-slate-500 dark:bg-slate-500 shadow-[0_0_5px_rgba(100,116,139,0.6)]';
      default: return 'bg-slate-500';
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
Type: UDF (光纤架/网口架)
Fiber Ports: ${data.fiberPorts || 0}
Network Ports: ${data.networkPorts || 0}
Status: ${data.status}
  `.trim();

  const handleStyle = "w-3 h-3 !bg-slate-300 dark:!bg-slate-400 !border-slate-400 dark:!border-slate-600 !border-2 hover:!bg-blue-500 hover:!border-blue-300 transition-all duration-200 hover:scale-[1.8] hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] z-50";

  return (
    <div
      title={tooltipText}
      className={`relative rounded flex items-center justify-between px-4 overflow-hidden
        ${selected ? 'ring-2 ring-blue-400 z-50' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-50 brightness-110' : ''}
        ${isSearchMatch ? 'ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] z-40' : ''}
        ${isCurrentSearchMatch ? 'ring-4 ring-pink-600 shadow-[0_0_25px_rgba(236,72,153,0.9)] z-50 scale-110' : ''}
        border bg-gradient-to-r from-teal-950/90 to-slate-800 border-teal-500/50 hover:border-teal-400
        ${getStatusBorderClass()}
        transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm group
      `}
      style={{
        width: `${UDF_WIDTH_PX}px`,
        height: `${UDF_HEIGHT_PX}px`,
        marginTop: '51px',
      }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
      </div>

      <div className="flex items-center gap-3 z-10 w-1/3">
        <div className="flex flex-col gap-1 shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        <div className="h-full border-r border-white/10 mx-1 shrink-0"></div>
        
        <div className="w-6 flex justify-center shrink-0">
          <i className="fa-solid fa-ethernet text-sm text-teal-400"></i>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-100 leading-tight truncate" title={data.label}>
            {data.label}
          </span>
          <span className="text-xs text-teal-400 font-mono">UDF 配线架</span>
        </div>
      </div>

      <div className="flex items-center gap-4 z-10">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-circle text-[6px] text-amber-400"></i>
            <span className="text-[10px] text-amber-300 font-mono">{data.fiberPorts || 0}</span>
          </div>
          <span className="text-[8px] text-slate-500">光纤口</span>
        </div>
        
        <div className="h-6 w-px bg-white/10"></div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-circle text-[6px] text-blue-400"></i>
            <span className="text-[10px] text-blue-300 font-mono">{data.networkPorts || 0}</span>
          </div>
          <span className="text-[8px] text-slate-500">网口</span>
        </div>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex gap-1 opacity-50">
          {Array.from({ length: Math.min(8, (data.fiberPorts || 0) + (data.networkPorts || 0)) }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2.5 rounded-[1px] ${i < (data.fiberPorts || 0) ? 'bg-amber-500/30 border border-amber-500/50' : 'bg-blue-500/30 border border-blue-500/50'}`}
            ></div>
          ))}
        </div>

        {data.assetId && (
          <div className="bg-black/20 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            <span className="text-[10px] text-yellow-300 font-mono">{data.assetId}</span>
          </div>
        )}
      </div>

      <Handle 
        id="top"
        type="target" 
        position={Position.Top} 
        className={handleStyle}
        style={{ top: '-6px' }} 
      />
      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom} 
        className={handleStyle}
        style={{ bottom: '-6px' }}
      />
      <Handle 
        id="left"
        type="target" 
        position={Position.Left} 
        className={handleStyle}
        style={{ left: '-6px' }} 
      />
      <Handle 
        id="right"
        type="source" 
        position={Position.Right} 
        className={handleStyle}
        style={{ right: '-6px' }}
      />
    </div>
  );
};

export default memo(UdfNode);
