import React, { useState, useRef } from 'react';
import { useReactFlow, Panel, Node, Edge, MarkerType } from 'reactflow';
import { analyzeDataCenter, generateLayout } from '../services/geminiService';
import { ItemType, RackData } from '../types';
import { PX_PER_U, RACK_PADDING_PX, RACK_WIDTH_PX, SERVER_WIDTH_PX } from '../constants';

type Mode = 'idle' | 'analyzing' | 'generating';
type GenMode = 'rack' | 'business';

interface GeminiAdvisorProps {
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
}

const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ isDark, onThemeChange }) => {
  // Destructure getEdges here at the top level to avoid "Invalid Hook Call" error
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  
  // State
  const [mode, setMode] = useState<Mode>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  
  // Generation Options
  const [genMode, setGenMode] = useState<GenMode>('rack');
  
  // Analysis Data
  const [report, setReport] = useState<any>(null);
  const [analysisScope, setAnalysisScope] = useState<'all' | 'selection'>('all');
  
  // Generation Data
  const [prompt, setPrompt] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS ---

  const handleExport = () => {
      const nodes = getNodes();
      // Use the function from the hook called at top level
      const edges = getEdges(); 
      
      const exportData = {
          nodes: nodes,
          edges: edges
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "smart-dcim-config.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setShowDataMenu(false);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
      setShowDataMenu(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              // Support both legacy (array of nodes) and new (object with nodes/edges) formats
              if (Array.isArray(data)) {
                  setNodes(data);
                  setEdges([]);
              } else if (data.nodes) {
                  setNodes(data.nodes);
                  setEdges(data.edges || []);
              }
          } catch (err) {
              console.error("Import failed", err);
              setError("Failed to import JSON file.");
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setMode('analyzing');
    
    try {
      const allNodes = getNodes();
      const selectedNodes = allNodes.filter(n => n.selected);

      let nodesToAnalyze = allNodes;

      if (selectedNodes.length > 0) {
          setAnalysisScope('selection');
          // Logic: Include selected nodes AND their descendants (e.g., Zone -> Rack -> Server)
          const relevantIds = new Set(selectedNodes.map(n => n.id));

          // Pass 1: Find direct children (e.g. Rack in Zone, Server in Rack)
          const children = allNodes.filter(n => n.parentId && relevantIds.has(n.parentId));
          children.forEach(c => relevantIds.add(c.id));

          // Pass 2: Find grandchildren (e.g. Server in Rack which is in Zone)
          // We iterate again using the updated relevantIds set
          const grandChildren = allNodes.filter(n => n.parentId && relevantIds.has(n.parentId));
          grandChildren.forEach(c => relevantIds.add(c.id));

          nodesToAnalyze = allNodes.filter(n => relevantIds.has(n.id));
      } else {
          setAnalysisScope('all');
      }

      const result = await analyzeDataCenter(nodesToAnalyze);
      setReport(result);
    } catch (err: any) {
      setError("Analysis Failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
      if (!prompt.trim()) return;
      setLoading(true);
      setError(null);
      
      try {
        const layoutData = await generateLayout(prompt, genMode);
        
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const currentNodes = getNodes();
        
        // Find a safe X starting position (max X of current nodes + padding)
        let zoneStartX = 50;
        let zoneStartY = 50;
        if (currentNodes.length > 0) {
            const maxX = Math.max(...currentNodes.map(n => n.position.x + (n.width || 400)));
            zoneStartX = maxX + 100;
        }

        // Use a stable timestamp for this batch to ensure ID consistency
        const batchId = Date.now();

        // --- 1. Create Container Zone ---
        const zoneId = `gen_zone_${batchId}`;
        const containerInfo = layoutData.containerZone || { 
            width: 1200, 
            height: 800, 
            label: 'AI Generated Zone' 
        };

        const zoneNode: Node = {
            id: zoneId,
            type: ItemType.ZONE,
            position: { x: zoneStartX, y: zoneStartY },
            data: { 
                label: containerInfo.label,
                description: 'AI Auto-Generated Container'
            },
            style: { width: containerInfo.width, height: containerInfo.height },
            zIndex: -10
        };
        newNodes.push(zoneNode);

        // Define internal padding for the zone
        const ZONE_PADDING_X = 50;
        const ZONE_PADDING_Y = 60; // Leave space for header

        if (genMode === 'rack' && layoutData.racks) {
            // --- RACK MODE ---
            layoutData.racks.forEach((rack: any, rIndex: number) => {
                const rackId = `gen_rack_${batchId}_${rIndex}`;
                // Position relative to Zone
                const relX = ZONE_PADDING_X + (rIndex * (RACK_WIDTH_PX + 50));
                const relY = ZONE_PADDING_Y;

                // Create Rack Node
                const rackNode: Node<RackData> = {
                    id: rackId,
                    type: ItemType.RACK,
                    parentId: zoneId, // Attach to Zone
                    // Removed extent: 'parent' to avoid "Parent node not found" race condition during batch add
                    position: { x: relX, y: relY },
                    data: {
                        label: rack.label,
                        totalU: rack.totalU,
                        type: ItemType.RACK
                    },
                    zIndex: 0,
                    style: { width: RACK_WIDTH_PX, height: (rack.totalU * PX_PER_U) + (RACK_PADDING_PX * 2) }
                };
                newNodes.push(rackNode);

                // Create Device Nodes (Children of Rack)
                if (rack.devices && Array.isArray(rack.devices)) {
                    rack.devices.forEach((dev: any, dIndex: number) => {
                        const posU = dev.positionU || 1;
                        const h = dev.uHeight || 1;
                        
                        const validPosU = Math.min(Math.max(posU, 1), rack.totalU - h + 1);
                        const slotIndexFromTop = rack.totalU - (validPosU + h - 1);
                        const devY = RACK_PADDING_PX + (slotIndexFromTop * PX_PER_U);

                        const devNode: Node = {
                            id: `gen_dev_${batchId}_${rIndex}_${dIndex}`,
                            type: dev.type || ItemType.SERVER,
                            parentId: rackId, // Attach to Rack
                            // Removed extent: 'parent' to avoid "Parent node not found" race condition during batch add
                            position: { x: RACK_PADDING_PX, y: devY },
                            data: {
                                label: dev.label,
                                uHeight: h,
                                type: dev.type || ItemType.SERVER,
                                status: dev.status || 'active',
                                description: 'AI Generated (Rack View)'
                            },
                            zIndex: 1000,
                            style: { width: SERVER_WIDTH_PX, height: h * PX_PER_U }
                        };
                        newNodes.push(devNode);
                    });
                }
            });
        } else if (genMode === 'business' && layoutData.nodes) {
            // --- BUSINESS MODE ---
            const nodeIdMap: Record<string, string> = {};

            layoutData.nodes.forEach((node: any, index: number) => {
                // Layout nodes horizontally inside the zone
                const relX = ZONE_PADDING_X + (index * (SERVER_WIDTH_PX + 100));
                const relY = ZONE_PADDING_Y + 100; // Center vertically somewhat
                
                const realId = `gen_biz_${batchId}_${index}`;
                nodeIdMap[node.id] = realId;

                const newNode: Node = {
                    id: realId,
                    type: node.type || ItemType.SERVER,
                    parentId: zoneId, // Attach to Zone
                    position: { x: relX, y: relY },
                    data: {
                        label: node.label,
                        uHeight: node.uHeight || 1,
                        type: node.type || ItemType.SERVER,
                        status: 'active',
                        description: 'AI Generated (Business View)'
                    },
                    zIndex: 1000,
                    style: { width: SERVER_WIDTH_PX, height: (node.uHeight || 1) * PX_PER_U }
                };
                newNodes.push(newNode);
            });

            // Process Edges
            if (layoutData.edges && Array.isArray(layoutData.edges)) {
                layoutData.edges.forEach((edge: any, i: number) => {
                    const sourceId = nodeIdMap[edge.source];
                    const targetId = nodeIdMap[edge.target];

                    if (sourceId && targetId) {
                        const newEdge: Edge = {
                            id: `gen_edge_${batchId}_${i}`,
                            source: sourceId,
                            target: targetId,
                            type: 'portConnection',
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: isDark ? '#94a3b8' : '#475569',
                            },
                            data: {
                                speed: edge.label || '',
                                color: '#3b82f6' // Default blue for generated edges
                            }
                        };
                        newEdges.push(newEdge);
                    }
                });
            }
        }

        // Append new nodes
        setNodes((nds) => [...nds, ...newNodes]);
        if (newEdges.length > 0) {
            setEdges((eds) => [...eds, ...newEdges]);
        }

        setMode('idle'); 
        setPrompt('');

      } catch (err) {
          setError("Generation Failed. Try again.");
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  // --- RENDER HELPERS ---
  
  if (mode === 'idle') {
      return (
        <Panel position="top-right" className="mr-4 mt-4 flex gap-3 items-center"> 
            <div className="flex gap-2">
                {/* Data Manager Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDataMenu(!showDataMenu)}
                        className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-2 rounded shadow-lg flex items-center gap-2 transition-all text-xs font-medium"
                    >
                        <i className="fa-solid fa-database text-slate-500 dark:text-slate-400"></i>
                        数据管理
                        <i className="fa-solid fa-chevron-down text-[10px] ml-1"></i>
                    </button>
                    
                    {showDataMenu && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                             <button
                                onClick={handleExport}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-file-export text-slate-400"></i> 导出 JSON
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-file-import text-slate-400"></i> 导入 JSON
                            </button>
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept=".json" 
                                className="hidden" 
                            />
                        </div>
                    )}
                </div>

                {/* Overlay to close menu when clicking outside */}
                {showDataMenu && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowDataMenu(false)}></div>
                )}

                <button
                    onClick={() => setMode('generating')}
                    className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/80 text-indigo-700 dark:text-white border border-indigo-200 dark:border-indigo-500/50 px-3 py-2 rounded shadow-lg flex items-center gap-2 transition-all text-xs font-medium"
                >
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 dark:text-indigo-300"></i>
                    AI 自动生成
                </button>

                <button
                    onClick={handleAnalyze}
                    className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 px-3 py-2 rounded shadow-lg flex items-center gap-2 transition-all text-xs font-medium"
                >
                    <i className="fa-solid fa-chart-pie"></i>
                    AI 分析
                </button>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>

            {/* Theme Toggle */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-full p-1 flex items-center gap-1 shadow-lg transition-all">
                <button
                    onClick={() => onThemeChange(false)}
                    className={`p-1.5 rounded-full text-xs transition-all ${!isDark ? 'bg-yellow-100 text-yellow-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="Light Mode"
                >
                    <i className="fa-solid fa-sun"></i>
                </button>
                <button
                    onClick={() => onThemeChange(true)}
                    className={`p-1.5 rounded-full text-xs transition-all ${isDark ? 'bg-slate-700 text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Dark Mode"
                >
                    <i className="fa-solid fa-moon"></i>
                </button>
             </div>
        </Panel>
      );
  }

  return (
    <Panel position="top-right" className="mr-4 mt-4">
        <div className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl p-4 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 uppercase tracking-wider">
                    {mode === 'analyzing' ? '基础设施智能分析' : 'AI 自动构建助手'}
                </h2>
                <div className="flex items-center gap-3">
                     {/* Mini Theme Toggle in active mode */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
                        <button onClick={() => onThemeChange(false)} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${!isDark ? 'bg-white shadow text-yellow-500' : 'text-slate-400'}`}><i className="fa-solid fa-sun"></i></button>
                        <button onClick={() => onThemeChange(true)} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${isDark ? 'bg-slate-600 shadow text-blue-300' : 'text-slate-400'}`}><i className="fa-solid fa-moon"></i></button>
                    </div>
                    <button 
                        onClick={() => { setMode('idle'); setError(null); }} 
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400 space-y-3">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500"></i>
                    <div className="text-xs animate-pulse">
                        {mode === 'analyzing' 
                            ? (analysisScope === 'selection' ? '正在分析选中区域数据...' : '正在分析全量数据...') 
                            : '正在规划机房布局...'}
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-3 rounded text-red-600 dark:text-red-300 text-xs break-all">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>
                    {error}
                </div>
            ) : mode === 'analyzing' && report ? (
                // --- ANALYSIS REPORT VIEW ---
                <div className="space-y-4">
                    {/* Scores Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold relative z-10">能效评分</div>
                            <div className={`text-2xl font-bold ${report.efficiencyScore > 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'} relative z-10`}>
                                {report.efficiencyScore}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold relative z-10">高可用评分</div>
                             <div className={`text-2xl font-bold ${report.haScore > 80 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'} relative z-10`}>
                                {report.haScore || '-'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                         <div className="flex justify-between items-center bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/50">
                             <span className="text-slate-500">电力负载</span>
                             <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{report.powerEstimateKW} kW</span>
                         </div>
                         <div className="flex justify-between items-center bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/50">
                             <span className="text-slate-500">散热输出</span>
                             <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{report.heatOutputBTU?.toLocaleString()} BTU</span>
                         </div>
                    </div>

                    {/* Redundancy Analysis */}
                     {report.redundancyAnalysis && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded border border-indigo-100 dark:border-indigo-800/30">
                            <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase mb-1 flex items-center gap-1">
                                <i className="fa-solid fa-network-wired"></i> 冗余与高可用分析
                            </h4>
                            <p className="text-xs leading-relaxed text-indigo-800 dark:text-indigo-200">
                                {report.redundancyAnalysis}
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-slate-100 dark:bg-slate-800/30 p-3 rounded border border-slate-200 dark:border-slate-700/50">
                         <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">总体评价</h4>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic">"{report.summary}"</p>
                    </div>
                    
                    {/* Recommendations */}
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">优化建议</h3>
                        <ul className="space-y-2">
                            {report.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="flex items-start text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700/50 hover:border-blue-400 transition-colors">
                                    <div className="mt-0.5 mr-2 shrink-0 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px]">
                                        {idx + 1}
                                    </div>
                                    <span className="leading-relaxed">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : mode === 'generating' ? (
                // --- GENERATION FORM VIEW ---
                <div className="space-y-4">
                     <p className="text-xs text-slate-500 dark:text-slate-400">
                        描述您想要构建的数据中心场景。AI 将自动规划机柜布局和设备摆放。
                     </p>
                     
                     {/* Mode Selector - Beautified Grid */}
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                            生成模式 / Mode
                         </label>
                         <div className="grid grid-cols-2 gap-3">
                             {/* Rack Mode Option */}
                             <div 
                                onClick={() => setGenMode('rack')}
                                className={`cursor-pointer rounded-lg border-2 p-3 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group
                                ${genMode === 'rack' 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'}
                                `}
                             >
                                {genMode === 'rack' && <div className="absolute top-1 right-1"><i className="fa-solid fa-circle-check text-blue-500 text-xs"></i></div>}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${genMode === 'rack' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 group-hover:text-blue-500'}`}>
                                    <i className="fa-solid fa-server text-sm"></i>
                                </div>
                                <div className={`text-xs font-bold ${genMode === 'rack' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>机柜视图</div>
                                <div className="text-[8px] text-slate-400 mt-0.5 text-center leading-tight">含机柜物理布局</div>
                             </div>

                             {/* Business Mode Option */}
                             <div 
                                onClick={() => setGenMode('business')}
                                className={`cursor-pointer rounded-lg border-2 p-3 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group
                                ${genMode === 'business' 
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'}
                                `}
                             >
                                {genMode === 'business' && <div className="absolute top-1 right-1"><i className="fa-solid fa-circle-check text-indigo-500 text-xs"></i></div>}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${genMode === 'business' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-slate-600 group-hover:text-indigo-500'}`}>
                                    <i className="fa-solid fa-bezier-curve text-sm"></i>
                                </div>
                                <div className={`text-xs font-bold ${genMode === 'business' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>业务视图</div>
                                <div className="text-[8px] text-slate-400 mt-0.5 text-center leading-tight">逻辑业务流拓扑</div>
                             </div>
                         </div>
                     </div>

                     <textarea
                        className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-3 text-xs text-slate-800 dark:text-white focus:border-indigo-500 outline-none resize-none placeholder-slate-400"
                        placeholder={genMode === 'rack' 
                            ? "例如: 建立5个机柜，其中2个装满Web服务器，1个存储，注意机柜间预留空间..."
                            : "例如: 生成一个从数据库到应用服务器，再到防火墙的业务链路..."
                        }
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                     />
                     <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2 rounded font-bold text-xs shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                        开始生成
                     </button>
                </div>
            ) : null}
            
            <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-600 pt-2 border-t border-slate-200 dark:border-slate-800 mt-4">
                <span>Gemini 2.5 Flash</span>
                {/* Cleaned up footer */}
            </div>
        </div>
    </Panel>
  );
};

export default GeminiAdvisor;