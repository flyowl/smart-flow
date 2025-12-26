
import React, { useState } from 'react';
import { ItemType, DragItem } from './types';

const Sidebar: React.FC = () => {
  // State for Custom Item creation
  const [customType, setCustomType] = useState<ItemType>(ItemType.SERVER);
  const [customU, setCustomU] = useState<number>(1);
  const [customLabel, setCustomLabel] = useState<string>('自定义设备');

  const onDragStart = (event: React.DragEvent, item: DragItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-50 shadow-2xl select-none transition-colors duration-300">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
          <i className="fa-solid fa-server mr-2 text-blue-500 dark:text-blue-400"></i>
          Smart DCIM
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">数据中心基础设施管理</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Zones */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-slate-400"></i> 区域规划
          </h3>
          <div className="space-y-2">
             <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-dashed border-indigo-300 dark:border-indigo-700 p-3 rounded cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all flex items-center gap-3 group"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.ZONE, label: '功能分区', width: 600, height: 400 })}
            >
                <div className="h-8 w-8 border-2 border-dashed border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded flex items-center justify-center">
                    <i className="fa-solid fa-vector-square text-indigo-500 text-xs"></i>
                </div>
                <div>
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">区域 / 分区</div>
                    <div className="text-xs text-slate-500">可调整大小容器</div>
                </div>
            </div>
          </div>
        </div>

        {/* Standard Racks */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-box text-slate-400"></i> 机柜设施
          </h3>
          <div className="space-y-2">
            {/* Standard Rack */}
            <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center gap-3 group"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.RACK, totalU: 42, label: '标准机柜' })}
            >
                <div className="h-10 w-6 border border-slate-400 dark:border-slate-500 grid grid-rows-4 gap-px p-px bg-slate-200 dark:bg-slate-900">
                    {[1,2,3,4].map(i => <div key={i} className="bg-slate-300 dark:bg-slate-700 w-full h-full"></div>)}
                </div>
                <div>
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">42U 企业级</div>
                    <div className="text-xs text-slate-500">全高机柜</div>
                </div>
            </div>

            {/* Placeholder Rack */}
            <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 p-3 rounded cursor-grab active:cursor-grabbing hover:border-slate-400 transition-all flex items-center gap-3"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.PLACEHOLDER, totalU: 42, label: '占位机柜' })}
            >
                <div className="h-10 w-6 border border-dashed border-slate-400 flex items-center justify-center bg-slate-100 dark:bg-slate-900/30">
                    <i className="fa-solid fa-ban text-slate-400 text-[10px]"></i>
                </div>
                <div>
                    <div className="font-medium text-sm text-slate-600 dark:text-slate-300">占位机柜</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">预留空间 / 不可部署</div>
                </div>
            </div>
          </div>
        </div>

        {/* Servers */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-hard-drive text-slate-400"></i> 计算设施
          </h3>
          <div className="space-y-2">
            {[1, 2, 4].map((u) => (
                <div
                key={u}
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded cursor-grab active:cursor-grabbing hover:border-emerald-400 dark:hover:border-emerald-500 transition-all flex items-center gap-3"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.SERVER, uHeight: u, label: `${u}U 服务器` })}
                >
                <div 
                    className="bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 rounded flex items-center justify-center text-[10px] text-emerald-600 dark:text-emerald-400 font-mono"
                    style={{ height: '24px', width: '24px' }}
                >
                    {u}
                </div>
                <div className="flex-1">
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">{u}U 服务器</div>
                </div>
                <i className="fa-solid fa-grip-lines text-slate-400 dark:text-slate-600"></i>
                </div>
            ))}
          </div>
        </div>

        {/* Network & Security */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-network-wired text-slate-400"></i> 网络与安全
          </h3>
          <div className="space-y-2">
            <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-indigo-900/50 p-2 rounded cursor-grab active:cursor-grabbing hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center gap-3"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.NETWORK, uHeight: 1, label: '核心交换机' })}
            >
                <div className="bg-slate-100 dark:bg-slate-900 border border-indigo-500/50 rounded flex items-center justify-center h-6 w-6">
                    <i className="fa-solid fa-network-wired text-[10px] text-indigo-500 dark:text-indigo-400"></i>
                </div>
                <div className="flex-1">
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">1U 交换机</div>
                </div>
            </div>

            <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-orange-900/50 p-2 rounded cursor-grab active:cursor-grabbing hover:border-orange-400 dark:hover:border-orange-500 transition-all flex items-center gap-3"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.FIREWALL, uHeight: 2, label: '硬件防火墙' })}
            >
                <div className="bg-slate-100 dark:bg-slate-900 border border-orange-500/50 rounded flex items-center justify-center h-6 w-6">
                    <i className="fa-solid fa-shield-halved text-[10px] text-orange-500 dark:text-orange-400"></i>
                </div>
                <div className="flex-1">
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">2U 防火墙</div>
                </div>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-database text-slate-400"></i> 存储设施
          </h3>
           <div
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-cyan-900/50 p-2 rounded cursor-grab active:cursor-grabbing hover:border-cyan-400 dark:hover:border-cyan-500 transition-all flex items-center gap-3"
                draggable
                onDragStart={(e) => onDragStart(e, { type: ItemType.STORAGE, uHeight: 4, label: '4U SAN存储' })}
            >
                <div className="bg-slate-100 dark:bg-slate-900 border border-cyan-500/50 rounded flex items-center justify-center h-6 w-6">
                    <i className="fa-solid fa-database text-[10px] text-cyan-500 dark:text-cyan-400"></i>
                </div>
                <div className="flex-1">
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">4U SAN存储</div>
                </div>
            </div>
        </div>

        {/* Custom Generator */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="fa-solid fa-wrench text-slate-400"></i> 自定义组件
            </h3>
            <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-3 relative z-10 shadow-sm">
                <div className="grid grid-cols-3 gap-1 rounded bg-slate-100 dark:bg-slate-900 p-1">
                    <button 
                        onClick={() => setCustomType(ItemType.SERVER)}
                        className={`text-[10px] py-1 rounded transition-colors ${customType === ItemType.SERVER ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                        title="服务器"
                    ><i className="fa-solid fa-server"></i></button>
                    <button 
                        onClick={() => setCustomType(ItemType.NETWORK)}
                        className={`text-[10px] py-1 rounded transition-colors ${customType === ItemType.NETWORK ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                        title="网络"
                    ><i className="fa-solid fa-network-wired"></i></button>
                    <button 
                        onClick={() => setCustomType(ItemType.RACK)}
                        className={`text-[10px] py-1 rounded transition-colors ${customType === ItemType.RACK ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                        title="机柜"
                    ><i className="fa-solid fa-box"></i></button>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 uppercase">标签名称</label>
                    <input 
                        type="text" 
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400"
                        placeholder="Device Name"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 uppercase">尺寸 (U)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" 
                            min="1" 
                            max={customType === ItemType.RACK ? 52 : 8}
                            value={customU}
                            onChange={(e) => setCustomU(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-xs font-mono w-8 text-right text-emerald-600 dark:text-emerald-400">{customU}U</span>
                    </div>
                </div>

                <div 
                    className={`mt-2 border border-dashed border-slate-300 dark:border-slate-600 p-2 rounded text-center cursor-grab active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                        ${customType === ItemType.RACK ? 'hover:border-blue-500' : 'hover:border-emerald-500'}
                    `}
                    draggable
                    onDragStart={(e) => onDragStart(e, { 
                        type: customType, 
                        [customType === ItemType.RACK ? 'totalU' : 'uHeight']: customU, 
                        label: customLabel 
                    })}
                >
                    <div className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                        <i className="fa-solid fa-hand-pointer mr-2"></i>
                        拖拽创建
                    </div>
                </div>
            </div>
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-600 text-center bg-slate-50 dark:bg-slate-900 z-20">
         v1.3.0 • React Flow • Gemini
      </div>
    </aside>
  );
};

export default Sidebar;