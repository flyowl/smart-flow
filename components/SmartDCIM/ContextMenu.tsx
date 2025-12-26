
import React from 'react';

interface ContextMenuProps {
  top: number;
  left: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ top, left, onEdit, onDuplicate, onDelete, onClose }) => {
  return (
    <div 
      className="absolute z-[100] w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <button 
        onClick={onEdit} 
        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
      >
        <i className="fa-solid fa-pen"></i> 编辑 (Edit)
      </button>
      <button 
        onClick={onDuplicate} 
        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center gap-2"
      >
        <i className="fa-regular fa-copy"></i> 复制 (Copy)
      </button>
      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 mx-2"></div>
      <button 
        onClick={onDelete} 
        className="w-full text-left px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-2"
      >
        <i className="fa-solid fa-trash"></i> 删除 (Delete)
      </button>
      
      {/* Invisible overlay to close when clicking outside is handled by parent App's onPaneClick */}
    </div>
  );
};

export default ContextMenu;