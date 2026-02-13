
import React, { useState, useEffect } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { ItemType, RackData, ServerData, ZoneData, UdfData } from './types';
import { PX_PER_U, RACK_PADDING_PX } from './constants';

interface NodeDetailsPanelProps {
  node: Node | null;
  onClose: () => void;
  isEditing?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'active', label: '正常运行 (Active)', color: 'bg-emerald-500', icon: 'fa-check-circle' },
  { value: 'maintenance', label: '维护中 (Maint)', color: 'bg-amber-500', icon: 'fa-screwdriver-wrench' },
  { value: 'offline', label: '已关机 (Offline)', color: 'bg-slate-500', icon: 'fa-power-off' },
  { value: 'malfunction', label: '发生故障 (Error)', color: 'bg-red-500', icon: 'fa-triangle-exclamation' },
];

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node, onClose, isEditing: initialEditing = false }) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(initialEditing);
  
  // Local state for editing. We use a union type for flexibility.
  const [formData, setFormData] = useState<Partial<ServerData & RackData & ZoneData & UdfData>>({});

  useEffect(() => {
    setIsEditing(initialEditing);
  }, [initialEditing]);

  useEffect(() => {
    if (node) {
        setFormData({ ...node.data, width: node.width, height: node.height });
    }
  }, [node]);

  if (!node) return null;

  const isRack = node.type === ItemType.RACK || node.type === ItemType.PLACEHOLDER;
  const isPlaceholder = node.type === ItemType.PLACEHOLDER;
  const isZone = node.type === ItemType.ZONE;
  const isSoftware = node.type === ItemType.SOFTWARE;
  const isUdf = node.type === ItemType.UDF;
  
  const data = node.data;

  const handleSave = () => {
    setNodes((nds) => 
      nds.map((n) => {
        if (n.id === node.id) {
          const newData = { ...n.data, ...formData };
          let newStyle = { ...n.style };

          // Recalculate physical height style based on new U size
          if (isRack) {
             const newTotalU = formData.totalU ?? (n.data as RackData).totalU;
             const height = newTotalU * PX_PER_U + (RACK_PADDING_PX * 2);
             newStyle = { ...newStyle, height: `${height}px` };
          } else if (isZone) {
             // For Zone, we also update style width/height if customized via panel
             newStyle = { ...newStyle, width: `${formData.width}px`, height: `${formData.height}px` };
          } else {
             const newUHeight = formData.uHeight ?? (n.data as ServerData).uHeight;
             const height = newUHeight * PX_PER_U;
             newStyle = { ...newStyle, height: `${height}px` };
          }

          return { 
            ...n, 
            data: newData, 
            style: newStyle 
          };
        }
        return n;
      })
    );
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getDeviceIcon = () => {
     if (isPlaceholder) return 'fa-ban text-slate-500';
     if (isRack) return 'fa-server text-blue-500 dark:text-blue-400';
     if (isZone) return 'fa-layer-group text-indigo-500 dark:text-indigo-400';
     if (isSoftware) return 'fa-code text-pink-500 dark:text-pink-400';
     if (isUdf) return 'fa-ethernet text-teal-500 dark:text-teal-400';
     const sData = data as ServerData;
     switch(sData.type) {
         case ItemType.NETWORK: return 'fa-network-wired text-indigo-500 dark:text-indigo-400';
         case ItemType.STORAGE: return 'fa-database text-cyan-500 dark:text-cyan-400';
         case ItemType.FIREWALL: return 'fa-shield-halved text-orange-500 dark:text-orange-400';
         default: return 'fa-hard-drive text-emerald-500 dark:text-emerald-400';
     }
  };

  const getDeviceTypeLabel = () => {
      if (isPlaceholder) return '占位机柜 (Placeholder)';
      if (isRack) return '机柜详情 (Rack)';
      if (isZone) return '区域详情 (Zone)';
      if (isSoftware) return '软件应用 (Software)';
      if (isUdf) return '配线架 (UDF)';
      const sData = data as ServerData;
      switch(sData.type) {
          case ItemType.NETWORK: return '网络设备 (Network)';
          case ItemType.STORAGE: return '存储设备 (Storage)';
          case ItemType.FIREWALL: return '安全设备 (Firewall)';
          default: return '服务器详情 (Server)';
      }
  };

  // Helper to render status display in non-edit mode
  const renderStatusDisplay = (status: string) => {
      const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
      return (
        <div className="flex items-center gap-2 mt-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded border border-slate-200 dark:border-slate-700/50">
            <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${option.color} ${(status === 'malfunction' || status === 'active') ? 'animate-pulse' : ''}`}></span>
            <span className="text-xs text-slate-700 dark:text-slate-200 capitalize font-medium">
                {option.label}
            </span>
        </div>
      );
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-100/80 dark:bg-slate-800/80 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
           <i className={`fa-solid ${getDeviceIcon()}`}></i>
           {getDeviceTypeLabel()}
        </h3>
        <div className="flex gap-2">
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-500 transition-colors" title="Edit">
                    <i className="fa-solid fa-pen"></i>
                </button>
            )}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
         {/* Common Info */}
         <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">名称 / Label</label>
            {isEditing ? (
                <input 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-blue-500 outline-none"
                    value={formData.label || ''}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                />
            ) : (
                <div className="text-slate-800 dark:text-slate-200 font-medium text-sm mt-1">{formData.label}</div>
            )}
         </div>

         {/* Asset ID Field */}
         {!isZone && (
             <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">资产编号 / Asset ID</label>
                {isEditing ? (
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-yellow-500 outline-none font-mono text-yellow-600 dark:text-yellow-500"
                        value={formData.assetId || ''}
                        placeholder="e.g. ASSET-001"
                        onChange={(e) => handleInputChange('assetId', e.target.value)}
                    />
                ) : (
                    <div className="text-slate-700 dark:text-slate-300 font-mono text-xs mt-1 flex items-center gap-2">
                        <i className="fa-solid fa-barcode text-slate-400 dark:text-slate-500"></i>
                        {formData.assetId ? (
                            <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800/30">
                                {formData.assetId}
                            </span>
                        ) : (
                            <span className="text-slate-500 dark:text-slate-600 italic">Not Assigned</span>
                        )}
                    </div>
                )}
             </div>
         )}
         
         <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/30">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ID</label>
                <div className="text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate mt-1" title={node.id}>{node.id.split('_')[1] || node.id}</div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/30">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">坐标 (X,Y)</label>
                <div className="text-slate-700 dark:text-slate-300 font-mono text-[10px] mt-1">
                    {Math.round(node.position.x)}, {Math.round(node.position.y)}
                </div>
             </div>
         </div>

         {/* Zone Dimensions Editing */}
         {isZone && (
             <div>
                 <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">尺寸 / Dimensions (px)</label>
                 {isEditing ? (
                     <div className="flex gap-2 mt-1">
                         <div className="flex-1">
                             <input 
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono outline-none"
                                 value={formData.width || 0}
                                 onChange={(e) => handleInputChange('width', parseInt(e.target.value))}
                                 placeholder="Width"
                             />
                             <div className="text-[9px] text-slate-400 mt-0.5">Width</div>
                         </div>
                         <div className="flex-1">
                             <input 
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono outline-none"
                                 value={formData.height || 0}
                                 onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                                 placeholder="Height"
                             />
                             <div className="text-[9px] text-slate-400 mt-0.5">Height</div>
                         </div>
                     </div>
                 ) : (
                     <div className="flex gap-4 mt-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                         <span>W: {formData.width}px</span>
                         <span>H: {formData.height}px</span>
                     </div>
                 )}
             </div>
         )}

         {/* Height / Capacity Editing (Non-Zone) */}
         {!isZone && (
             <div>
                 {node.type === ItemType.VIRTUAL_MACHINE ? (
                     // 虚拟机显示 CPU 和内存配置
                     <div className="space-y-3">
                         <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">资源配置</label>
                         {isEditing ? (
                             <div className="grid grid-cols-2 gap-2 mt-1">
                                 <div>
                                     <input 
                                         type="number"
                                         min="1"
                                         max="128"
                                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono focus:border-blue-500 outline-none"
                                         value={formData.cpu ?? 2}
                                         onChange={(e) => {
                                             const value = e.target.value === '' ? 2 : parseInt(e.target.value);
                                             handleInputChange('cpu', isNaN(value) ? 2 : value);
                                         }}
                                         placeholder="CPU"
                                     />
                                     <div className="text-[9px] text-slate-400 mt-0.5">CPU (核)</div>
                                 </div>
                                 <div>
                                     <input 
                                         type="number"
                                         min="1"
                                         max="512"
                                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono focus:border-blue-500 outline-none"
                                         value={formData.memory ?? 4}
                                         onChange={(e) => {
                                             const value = e.target.value === '' ? 4 : parseInt(e.target.value);
                                             handleInputChange('memory', isNaN(value) ? 4 : value);
                                         }}
                                         placeholder="内存"
                                     />
                                     <div className="text-[9px] text-slate-400 mt-0.5">内存 (GB)</div>
                                 </div>
                             </div>
                         ) : (
                             <div className="flex items-center gap-4 mt-1">
                                 <div className="flex items-center gap-1">
                                     <i className="fa-solid fa-microchip text-purple-500 dark:text-purple-400 text-xs"></i>
                                     <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                                         {(data as ServerData).cpu ?? 2} 核
                                     </span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <i className="fa-solid fa-memory text-purple-500 dark:text-purple-400 text-xs"></i>
                                     <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                                         {(data as ServerData).memory ?? 4} GB
                                     </span>
                                 </div>
                             </div>
                         )}
                     </div>
                 ) : (
                     // 普通设备显示 U 高度
                     <>
                         <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                             {isRack ? '总容量 (Total U)' : '设备高度 (Height U)'}
                         </label>
                         {isEditing ? (
                             <div className="flex items-center gap-2 mt-1">
                                 <input 
                                     type="number"
                                     min="1"
                                     max={isRack ? 60 : 42}
                                     className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-mono focus:border-blue-500 outline-none"
                                     value={isRack ? (formData.totalU ?? 42) : (formData.uHeight ?? 1)}
                                     onChange={(e) => handleInputChange(isRack ? 'totalU' : 'uHeight', parseInt(e.target.value))}
                                 />
                                 <span className="text-xs text-slate-400 font-mono">U</span>
                             </div>
                         ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-lg font-mono font-bold ${isRack ? 'text-blue-500 dark:text-blue-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                    {isRack ? (data as RackData).totalU : (data as ServerData).uHeight}
                                </span>
                                <span className="text-xs text-slate-500 font-bold mt-1">U</span>
                            </div>
                         )}
                     </>
                 )}
             </div>
         )}

         {/* Description / Note */}
         <div>
             <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">备注 / Description</label>
             {isEditing ? (
                 <textarea 
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-blue-500 outline-none resize-none h-16"
                     value={formData.description || ''}
                     placeholder="Description or notes..."
                     onChange={(e) => handleInputChange('description', e.target.value)}
                 />
             ) : (
                 <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 italic whitespace-pre-wrap">
                     {formData.description || 'No description'}
                 </div>
             )}
         </div>

         {/* Extended Server/Device Fields */}
         {!isRack && !isZone && (
             <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                 {/* IP Address */}
                <div>
                     <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">IP Address</label>
                     {isEditing ? (
                         <input
                             className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 font-mono focus:border-blue-500 outline-none"
                             value={formData.ip || ''}
                             placeholder="192.168.1.10"
                             onChange={(e) => handleInputChange('ip', e.target.value)}
                         />
                     ) : (
                         <div className="text-slate-700 dark:text-slate-300 font-mono text-xs mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                             {formData.ip || 'Not Configured'}
                         </div>
                     )}
                </div>

               {/* Model */}
               <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">型号 / Model</label>
                    {isEditing ? (
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-blue-500 outline-none"
                            value={formData.model || ''}
                            placeholder="Dell PowerEdge R750"
                            onChange={(e) => handleInputChange('model', e.target.value)}
                        />
                    ) : (
                        <div className="text-slate-700 dark:text-slate-300 text-xs mt-1">
                            {formData.model || 'N/A'}
                        </div>
                    )}
               </div>

               {/* Contact Person */}
               <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">联系人 / Contact</label>
                    {isEditing ? (
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-blue-500 outline-none"
                            value={formData.contact || ''}
                            placeholder="Ops Team A"
                            onChange={(e) => handleInputChange('contact', e.target.value)}
                        />
                    ) : (
                        <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex items-center gap-2">
                            <i className="fa-regular fa-user text-slate-400 dark:text-slate-500"></i>
                            {formData.contact || 'N/A'}
                        </div>
                    )}
               </div>

                {/* 软件节点专属字段 */}
                {isSoftware && (
                    <>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">技术栈 / Tech Stack</label>
                            {isEditing ? (
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 focus:border-pink-500 outline-none"
                                    value={formData.techStack || ''}
                                    placeholder="Java/Spring Boot"
                                    onChange={(e) => handleInputChange('techStack', e.target.value)}
                                />
                            ) : (
                                <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex items-center gap-2">
                                    <i className="fa-solid fa-code text-pink-500 dark:text-pink-400"></i>
                                    {formData.techStack || 'N/A'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">版本 / Version</label>
                            {isEditing ? (
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 font-mono focus:border-pink-500 outline-none"
                                    value={formData.version || ''}
                                    placeholder="1.0.0"
                                    onChange={(e) => handleInputChange('version', e.target.value)}
                                />
                            ) : (
                                <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 bg-pink-50 dark:bg-pink-900/20 px-2 py-1 rounded inline-block font-mono">
                                    v{formData.version || '1.0.0'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">端口 / Port</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    min="1"
                                    max="65535"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 font-mono focus:border-pink-500 outline-none"
                                    value={formData.port || ''}
                                    placeholder="8080"
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? '' : parseInt(e.target.value);
                                        handleInputChange('port', isNaN(value as number) ? '' : value);
                                    }}
                                />
                            ) : (
                                <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 font-mono">
                                    :{formData.port || '8080'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* UDF 节点专属字段 */}
                {isUdf && (
                    <>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">光纤口数量 / Fiber Ports</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    min="0"
                                    max="96"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 font-mono focus:border-teal-500 outline-none"
                                    value={formData.fiberPorts ?? 24}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        handleInputChange('fiberPorts', isNaN(value) ? 0 : value);
                                    }}
                                />
                            ) : (
                                <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex items-center gap-2">
                                    <i className="fa-solid fa-circle text-amber-400 text-[8px]"></i>
                                    <span className="font-mono font-bold text-amber-500">{(data as UdfData).fiberPorts ?? 24}</span>
                                    <span className="text-slate-500">口</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">网口数量 / Network Ports</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    min="0"
                                    max="96"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white mt-1 font-mono focus:border-teal-500 outline-none"
                                    value={formData.networkPorts ?? 24}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        handleInputChange('networkPorts', isNaN(value) ? 0 : value);
                                    }}
                                />
                            ) : (
                                <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex items-center gap-2">
                                    <i className="fa-solid fa-circle text-blue-400 text-[8px]"></i>
                                    <span className="font-mono font-bold text-blue-500">{(data as UdfData).networkPorts ?? 24}</span>
                                    <span className="text-slate-500">口</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-teal-50 dark:bg-teal-900/20 p-2 rounded border border-teal-200 dark:border-teal-800/30">
                            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                <i className="fa-solid fa-info-circle mr-1"></i>
                                总端口: {((data as UdfData).fiberPorts ?? 24) + ((data as UdfData).networkPorts ?? 24)} 口
                            </div>
                        </div>
                    </>
                )}

                <div>
                   <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">运行状态 / Status</label>
                   {isEditing ? (
                       <div className="grid grid-cols-2 gap-2 mt-2">
                           {STATUS_OPTIONS.map((opt) => (
                               <button
                                   key={opt.value}
                                   onClick={() => handleInputChange('status', opt.value)}
                                   className={`
                                       flex items-center gap-2 p-2 rounded border transition-all text-xs
                                       ${formData.status === opt.value
                                           ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-100'
                                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                   `}
                               >
                                   <div className={`w-2 h-2 rounded-full ${opt.color} flex-shrink-0`}></div>
                                   <span className="truncate">{opt.label.split('(')[0]}</span>
                               </button>
                           ))}
                       </div>
                   ) : (
                       renderStatusDisplay((data as ServerData | UdfData).status)
                   )}
                </div>
             </div>
         )}
         
         {isRack && !isPlaceholder && !isEditing && (
              <div className="bg-gradient-to-r from-blue-100/50 to-slate-100 dark:from-blue-900/20 dark:to-slate-900 rounded p-3 border border-blue-500/20">
                 <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full w-full animate-pulse opacity-50"></div> 
                 </div>
             </div>
         )}

         {isEditing && (
             <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                 <button 
                    onClick={() => { setIsEditing(false); setFormData(node.data); }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 rounded transition-colors"
                 >
                    取消
                 </button>
                 <button 
                    onClick={handleSave}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg transition-colors flex items-center gap-1"
                 >
                    <i className="fa-solid fa-check"></i> 保存
                 </button>
             </div>
         )}
      </div>
    </div>
  );
};

export default NodeDetailsPanel;