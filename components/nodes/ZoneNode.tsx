
import React, { memo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { ZoneData } from '../../types';

const EDGE_HIT_AREA = 20; // 边线扩展选中范围（像素）

const ZoneNode: React.FC<NodeProps<ZoneData>> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        handleStyle={{ width: 12, height: 12 }}
        lineStyle={{ borderWidth: 2 }}
      />

      {/* 扩展的边线选中区域 - 上 */}
      <div
        className="absolute left-0 right-0 cursor-ns-resize z-10"
        style={{ top: -EDGE_HIT_AREA, height: EDGE_HIT_AREA * 2 }}
      />
      {/* 扩展的边线选中区域 - 下 */}
      <div
        className="absolute left-0 right-0 cursor-ns-resize z-10"
        style={{ bottom: -EDGE_HIT_AREA, height: EDGE_HIT_AREA * 2 }}
      />
      {/* 扩展的边线选中区域 - 左 */}
      <div
        className="absolute top-0 bottom-0 cursor-ew-resize z-10"
        style={{ left: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2 }}
      />
      {/* 扩展的边线选中区域 - 右 */}
      <div
        className="absolute top-0 bottom-0 cursor-ew-resize z-10"
        style={{ right: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2 }}
      />
      {/* 扩展的边线选中区域 - 四角 */}
      <div
        className="absolute cursor-nwse-resize z-10"
        style={{ top: -EDGE_HIT_AREA, left: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2, height: EDGE_HIT_AREA * 2 }}
      />
      <div
        className="absolute cursor-nesw-resize z-10"
        style={{ top: -EDGE_HIT_AREA, right: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2, height: EDGE_HIT_AREA * 2 }}
      />
      <div
        className="absolute cursor-nesw-resize z-10"
        style={{ bottom: -EDGE_HIT_AREA, left: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2, height: EDGE_HIT_AREA * 2 }}
      />
      <div
        className="absolute cursor-nwse-resize z-10"
        style={{ bottom: -EDGE_HIT_AREA, right: -EDGE_HIT_AREA, width: EDGE_HIT_AREA * 2, height: EDGE_HIT_AREA * 2 }}
      />

      <div
        className={`w-full h-full relative transition-all duration-300 group
            ${selected ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600'}
        `}
      >
        {/* Background Area */}
        <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl backdrop-blur-[2px] pointer-events-none"></div>

        {/* Label Container */}
        <div className="absolute -top-4 left-4 bg-white dark:bg-slate-900 px-3 py-1 rounded border border-slate-300 dark:border-slate-600 shadow-sm z-10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {data.label}
            </span>
        </div>

        {/* Description / Content Hint */}
        {data.description && (
            <div className="absolute top-3 left-4 right-4 text-xs text-slate-400 dark:text-slate-500 italic truncate pointer-events-none">
                {data.description}
            </div>
        )}

        {/* Floor texture effect */}
        <div className="w-full h-full opacity-5 pointer-events-none"
             style={{ 
                 backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
                 backgroundSize: '10px 10px'
             }}
        ></div>
      </div>
    </>
  );
};

export default memo(ZoneNode);
