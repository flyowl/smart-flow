import React, { useState } from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { ItemType } from '../types';

// Define the categories and mapping to ItemTypes
const CATEGORIES = [
  { 
    id: 'rack', 
    label: '机柜设施 (Racks)', 
    types: [ItemType.RACK, ItemType.PLACEHOLDER], 
    icon: 'fa-box text-blue-500 dark:text-blue-400' 
  },
  { 
    id: 'server', 
    label: '计算设施 (Servers)', 
    types: [ItemType.SERVER], 
    icon: 'fa-server text-emerald-500 dark:text-emerald-400' 
  },
  { 
    id: 'network', 
    label: '网络设施 (Network)', 
    types: [ItemType.NETWORK], 
    icon: 'fa-network-wired text-indigo-500 dark:text-indigo-400' 
  },
  { 
    id: 'storage', 
    label: '存储设施 (Storage)', 
    types: [ItemType.STORAGE], 
    icon: 'fa-database text-cyan-500 dark:text-cyan-400' 
  },
  { 
    id: 'firewall', 
    label: '安全设施 (Security)', 
    types: [ItemType.FIREWALL], 
    icon: 'fa-shield-halved text-orange-500 dark:text-orange-400' 
  },
];

const VisibilityControls: React.FC = () => {
  const { getNodes, setNodes } = useReactFlow();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to check if a category is currently considered "visible"
  // We consider it visible if at least one node of that type is NOT hidden.
  const isCategoryVisible = (types: ItemType[]) => {
    const nodes = getNodes();
    // If no nodes of this type exist, we can default to true (checked) for the UI
    const nodesOfType = nodes.filter(n => types.includes(n.type as ItemType));
    if (nodesOfType.length === 0) return true;
    
    // Return true if found any visible node
    return nodesOfType.some(n => !n.hidden);
  };

  const toggleCategory = (types: ItemType[]) => {
    const currentlyVisible = isCategoryVisible(types);
    const shouldHide = currentlyVisible; // If visible, we want to hide.

    setNodes((nds) => 
      nds.map((node) => {
        if (types.includes(node.type as ItemType)) {
          return { ...node, hidden: shouldHide };
        }
        return node;
      })
    );
  };

  const toggleAll = (show: boolean) => {
    setNodes((nds) => nds.map(n => ({ ...n, hidden: !show })));
  };

  return (
    <Panel position="top-left" className="ml-2 mt-2">
      <div className="relative font-sans text-xs">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded shadow-lg border transition-all
            ${isOpen 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-blue-500' 
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}
          `}
        >
          <i className={`fa-solid ${isOpen ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          <span>视图图层 (Layers)</span>
          <i className={`fa-solid fa-chevron-down ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
            
            {/* Category List */}
            <div className="p-1">
                {CATEGORIES.map((cat) => {
                    const isVisible = isCategoryVisible(cat.types);
                    return (
                        <div 
                            key={cat.id}
                            onClick={() => toggleCategory(cat.types)}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group
                                ${!isVisible ? 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 flex justify-center ${!isVisible ? 'text-slate-400 dark:text-slate-600' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                    {!isVisible ? (
                                        <i className="fa-regular fa-square"></i>
                                    ) : (
                                        <i className="fa-solid fa-square-check"></i>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                     <i className={`fa-solid ${cat.icon} w-4 text-center text-[10px]`}></i>
                                     <span className={`${!isVisible ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {cat.label}
                                     </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Bulk Actions */}
            <div className="p-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                 <button 
                    onClick={() => toggleAll(true)} 
                    className="flex-1 py-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                 >
                    Show All
                 </button>
                 <button 
                    onClick={() => toggleAll(false)} 
                    className="flex-1 py-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                 >
                    Hide All
                 </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default VisibilityControls;