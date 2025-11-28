import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { PortConnectionData } from '../../types';

const PortConnectionEdge: React.FC<EdgeProps<PortConnectionData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Linear interpolation to position labels near the ends of the edge
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Position labels at 15% and 85% of the distance between handles
  const sourceLabelX = lerp(sourceX, targetX, 0.15);
  const sourceLabelY = lerp(sourceY, targetY, 0.15);

  const targetLabelX = lerp(sourceX, targetX, 0.85);
  const targetLabelY = lerp(sourceY, targetY, 0.85);

  // Styling based on selection
  // Use data.color if present, otherwise default to slate-600
  const strokeColor = selected ? '#3b82f6' : (data?.color || '#475569'); 
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: strokeColor, strokeWidth }} />
      <EdgeLabelRenderer>
        {/* Source Port Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceLabelX}px,${sourceLabelY}px)`,
            fontSize: 8,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className={`px-1.5 py-0.5 rounded border text-[8px] font-mono leading-none whitespace-nowrap
            ${selected 
                ? 'bg-blue-900/90 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'} 
            shadow-sm backdrop-blur-sm transition-all`}
          >
             {data?.sourcePort || '?'}
          </div>
        </div>

        {/* Target Port Label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetLabelX}px,${targetLabelY}px)`,
            fontSize: 8,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
           <div 
            className={`px-1.5 py-0.5 rounded border text-[8px] font-mono leading-none whitespace-nowrap
            ${selected 
                ? 'bg-blue-900/90 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'} 
            shadow-sm backdrop-blur-sm transition-all`}
          >
             {data?.targetPort || '?'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default PortConnectionEdge;