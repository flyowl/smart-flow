
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { RackData, ItemType } from '../../types';
import { PX_PER_U, RACK_WIDTH_PX, RACK_PADDING_PX } from '../../constants';

const RackNode: React.FC<NodeProps<RackData>> = ({ data, selected }) => {
  // Calculate total height based on U count + top/bottom padding
  const innerHeight = data.totalU * PX_PER_U;
  const totalHeight = innerHeight + (RACK_PADDING_PX * 2);

  const isPlaceholder = data.type === ItemType.PLACEHOLDER;
  const isHighlighted = data.isMatchedType;
  const isDropTarget = data.isDropTarget;

  // Render Placeholder View
  if (isPlaceholder) {
      return (
        <div 
            className={`relative flex flex-col items-center transition-all duration-300
                ${selected ? 'ring-2 ring-slate-400' : ''}
                ${isHighlighted ? 'ring-4 ring-slate-200 dark:ring-slate-200 shadow-[0_0_20px_rgba(148,163,184,0.3)] z-10' : ''}
                ${isDropTarget ? 'ring-4 ring-emerald-500/50 scale-[1.02] z-20' : ''}
            `}
            style={{ width: `${RACK_WIDTH_PX}px`, height: `${totalHeight}px` }}
        >
            {/* Dashed Border Area */}
            <div className={`w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600/60 bg-slate-100/50 dark:bg-slate-800/20 rounded-lg flex flex-col items-center justify-center p-4
                 ${isHighlighted ? 'bg-slate-200/50 dark:bg-slate-700/30 border-slate-400' : ''}
                 ${isDropTarget ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : ''}
            `}>
                 <div className="bg-slate-200/80 dark:bg-slate-800/80 p-4 rounded-full mb-3 border border-slate-300 dark:border-slate-700">
                    <i className="fa-solid fa-ban text-3xl text-slate-400 dark:text-slate-500"></i>
                 </div>
                 <div className="text-slate-600 dark:text-slate-300 font-bold text-lg text-center">{data.label}</div>
                 {data.assetId && (
                     <div className="text-yellow-600 dark:text-yellow-500/80 font-mono text-xs mt-1 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-800/30">
                         {data.assetId}
                     </div>
                 )}
                 <div className="text-slate-500 dark:text-slate-500 text-xs text-center mt-2 px-2 leading-tight">
                     {data.description || 'Reserved Space'}
                 </div>
                 <div className="mt-4 text-xs text-slate-500 dark:text-slate-600 bg-slate-200 dark:bg-slate-900/80 px-3 py-1 rounded border border-slate-300 dark:border-slate-800 uppercase tracking-wider font-semibold">
                    不可放置设备
                 </div>
            </div>
        </div>
      );
  }

  // Generate background grid lines for U units - U数从0开始
  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i < data.totalU; i++) {
      lines.push(
        <div
          key={i}
          className="w-full border-b border-slate-300/50 dark:border-slate-700/50 flex items-center justify-between px-1 text-[10px] text-slate-400 dark:text-slate-600 select-none font-mono"
          style={{ height: `${PX_PER_U}px` }}
        >
          <span>{data.totalU - i - 1}</span>
          <span className="opacity-20 w-full text-center mx-2 border-t border-slate-300/30 dark:border-slate-700/30 h-0"></span>
          <span>{data.totalU - i - 1}</span>
        </div>
      );
    }
    return lines;
  };

  return (
    <div 
      className={`relative bg-gray-100 dark:bg-slate-800 border-2 rounded-lg shadow-xl dark:shadow-2xl transition-all duration-300 group flex flex-col items-center
        ${selected ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500' : 'border-slate-300 dark:border-slate-600'}
        ${isHighlighted ? 'ring-4 ring-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] border-blue-400 z-10' : ''}
        ${isDropTarget ? 'ring-4 ring-emerald-500/70 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-900/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.01] z-20' : ''}
      `}
      style={{ width: `${RACK_WIDTH_PX}px`, height: `${totalHeight}px` }}
    >
      {/* Top Bezel / Header */}
      <div className={`w-full text-base font-bold py-3 text-center border-b rounded-t-md relative z-20 flex flex-col items-center justify-center transition-colors
         ${isDropTarget ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-400' : 
            isHighlighted ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-slate-700' : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}
      `}>
        <div className="flex items-center gap-2">
            {isDropTarget && <i className="fa-solid fa-arrow-down animate-bounce text-emerald-600 dark:text-emerald-400"></i>}
            <span>{data.label}</span>
            <span className="text-slate-500 dark:text-slate-600 font-normal text-sm">({data.totalU}U)</span>
        </div>
        {data.assetId && (
            <div className="text-[10px] text-yellow-600 dark:text-yellow-500/80 font-mono mt-0.5 leading-none">
                {data.assetId}
            </div>
        )}
      </div>

      {/* Main Rack Area */}
      <div className="flex-1 w-full relative bg-slate-50/50 dark:bg-slate-900/40 flex px-[20px] py-[20px] backdrop-blur-[1px]">
          {/* Rail Left */}
          <div className="absolute left-0 top-[20px] bottom-[20px] w-[20px] bg-slate-200/50 dark:bg-slate-800/50 border-r border-slate-300/50 dark:border-slate-700/50 flex flex-col items-center justify-around py-1 z-10">
              {/* Screw holes simulation */}
              {Array.from({length: 8}).map((_,i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>)}
          </div>

          {/* Grid Area */}
          <div className="w-full h-full relative z-0">
             {renderGrid()}
          </div>

          {/* Rail Right */}
          <div className="absolute right-0 top-[20px] bottom-[20px] w-[20px] bg-slate-200/50 dark:bg-slate-800/50 border-l border-slate-300/50 dark:border-slate-700/50 flex flex-col items-center justify-around py-1 z-10">
              {Array.from({length: 8}).map((_,i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>)}
          </div>
      </div>
    </div>
  );
};

export default memo(RackNode);
