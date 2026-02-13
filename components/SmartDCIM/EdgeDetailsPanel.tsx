
import React, { useState, useEffect } from 'react';
import { Edge, useReactFlow } from 'reactflow';
import { PortConnectionData } from './types';

interface EdgeDetailsPanelProps {
  edge: Edge | null;
  onClose: () => void;
}

const COLORS = [
  { label: '默认 (Default)', value: '' }, // Default
  { label: '蓝色 (Ethernet)', value: '#3b82f6' }, // blue-500
  { label: '橙色 (Fiber)', value: '#f97316' }, // orange-500
  { label: '青色 (OM3/4)', value: '#06b6d4' }, // cyan-500
  { label: '绿色 (Mgmt)', value: '#10b981' }, // emerald-500
  { label: '红色 (Critical)', value: '#ef4444' }, // red-500
  { label: '紫色 (SAN)', value: '#a855f7' }, // purple-500
  { label: '黄色 (Copper)', value: '#eab308' }, // yellow-500
];

const EdgeDetailsPanel: React.FC<EdgeDetailsPanelProps> = ({ edge, onClose }) => {
  const { setEdges } = useReactFlow();
  const [formData, setFormData] = useState<PortConnectionData>({ sourcePort: '', targetPort: '', speed: '', color: '' });

  useEffect(() => {
    if (edge) {
      setFormData({
        sourcePort: edge.data?.sourcePort || '',
        targetPort: edge.data?.targetPort || '',
        speed: edge.data?.speed || '',
        color: edge.data?.color || ''
      });
    }
  }, [edge]);

  if (!edge) return null;

  const handleSave = () => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === edge.id) {
          const updatedData = { ...e.data, ...formData };
          
          // Also update the marker color to match the line, if possible
          // We check the current theme to set the correct default if color is cleared
          const isDark = document.documentElement.classList.contains('dark');
          const defaultColor = isDark ? '#94a3b8' : '#475569';
          
          const newMarker = {
             ...(typeof e.markerEnd === 'object' ? e.markerEnd : {}),
             color: formData.color || defaultColor,
             type: 'arrowclosed' // Ensure type is preserved
          };

          return { ...e, data: updatedData, markerEnd: newMarker as any };
        }
        return e;
      })
    );
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <i className="fa-solid fa-bezier-curve text-blue-500 dark:text-blue-400"></i>
                连接配置 (Connection)
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div className="p-4 space-y-4">
             {/* Port Configuration */}
             <div className="flex items-start gap-2">
                 <div className="flex-1 space-y-1">
                     <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">源端口 (Source)</label>
                     <div className="relative">
                         <i className="fa-solid fa-circle-dot absolute left-2 top-2 text-[8px] text-emerald-500"></i>
                         <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded pl-5 pr-2 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none font-mono"
                            value={formData.sourcePort}
                            placeholder="Eth0"
                            onChange={e => setFormData({...formData, sourcePort: e.target.value})}
                         />
                     </div>
                 </div>
                 
                 <div className="pt-6 text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                 </div>

                 <div className="flex-1 space-y-1">
                     <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">对端端口 (Target)</label>
                     <div className="relative">
                        <i className="fa-solid fa-circle-dot absolute left-2 top-2 text-[8px] text-blue-500"></i>
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded pl-5 pr-2 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none font-mono"
                            value={formData.targetPort}
                            placeholder="Port 1"
                            onChange={e => setFormData({...formData, targetPort: e.target.value})}
                        />
                     </div>
                 </div>
             </div>

             {/* Details */}
             <div className="space-y-1">
                 <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">连接类型 / 备注 (Type/Note)</label>
                 <input 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    value={formData.speed || ''}
                    placeholder="e.g. 10GbE Fiber, DAC, CAT6..."
                    onChange={e => setFormData({...formData, speed: e.target.value})}
                 />
             </div>

             {/* Color Selection */}
             <div className="space-y-2">
                 <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">线缆颜色 (Cable Color)</label>
                 <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setFormData({...formData, color: c.value})}
                            title={c.label}
                            className={`h-6 w-full rounded border flex items-center justify-center transition-all
                                ${formData.color === c.value 
                                    ? 'ring-2 ring-blue-500 scale-110 z-10' 
                                    : 'hover:scale-105'}
                                ${c.value === '' ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : ''}
                            `}
                            style={{ backgroundColor: c.value || undefined, borderColor: c.value ? c.value : undefined }}
                        >
                             {formData.color === c.value && (
                                 <i className={`fa-solid fa-check text-[10px] ${!c.value ? 'text-slate-600 dark:text-slate-300' : 'text-white/90 drop-shadow-md'}`}></i>
                             )}
                        </button>
                    ))}
                 </div>
             </div>

             <div className="pt-2">
                <button 
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-1.5 rounded text-xs font-bold transition-all shadow-lg"
                >
                    <i className="fa-solid fa-check mr-1"></i> 更新连接信息 (Update)
                </button>
             </div>
        </div>
    </div>
  );
};

export default EdgeDetailsPanel;
