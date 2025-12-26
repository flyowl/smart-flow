
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  useReactFlow,
  Panel,
  ReactFlowInstance,
  NodeDragHandler,
  BackgroundVariant,
  MiniMap,
  MarkerType,
  XYPosition
} from 'reactflow';

import Sidebar from './Sidebar';
import RackNode from './nodes/RackNode';
import ServerNode from './nodes/ServerNode';
import ZoneNode from './nodes/ZoneNode';
import PortConnectionEdge from './edges/PortConnectionEdge';
import GeminiAdvisor from './GeminiAdvisor';
import NodeDetailsPanel from './NodeDetailsPanel';
import EdgeDetailsPanel from './EdgeDetailsPanel';
import ContextMenu from './ContextMenu';
import VisibilityControls from './VisibilityControls';
import { DragItem, ItemType, ServerData } from './types';
import { PX_PER_U, RACK_PADDING_PX, RACK_WIDTH_PX, SERVER_WIDTH_PX } from './constants';

// --- Error Suppression Logic (Moved from root index.tsx) ---
const resizeErrorMessages = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
];

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (resizeErrorMessages.some(msg => e.message.includes(msg))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = args[0];
    if (
      (typeof firstArg === 'string' && resizeErrorMessages.some(msg => firstArg.includes(msg))) ||
      (firstArg instanceof Error && resizeErrorMessages.some(msg => firstArg.message.includes(msg)))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Register custom nodes and edges
const nodeTypes = {
  rack: RackNode,
  placeholder: RackNode,
  server: ServerNode,
  network: ServerNode,
  storage: ServerNode,
  firewall: ServerNode,
  zone: ZoneNode,
};

const edgeTypes = {
  portConnection: PortConnectionEdge,
};

// Z-Index Layers
const Z_INDEX_ZONE = -10;
const Z_INDEX_RACK = 0;
const Z_INDEX_DEVICE = 1000;

let id = 0;
const getId = () => `dnd_${id++}_${Date.now()}`;

// MiniMap node color helper
const nodeColor = (node: Node) => {
  if (node.type === ItemType.ZONE) return '#e0e7ff'; // indigo-100
  if (node.type === ItemType.RACK) return '#64748b'; // slate-500
  if (node.type === ItemType.PLACEHOLDER) return '#94a3b8'; // slate-400
  if (node.type === ItemType.NETWORK) return '#6366f1'; // indigo
  if (node.type === ItemType.FIREWALL) return '#f97316'; // orange
  if (node.type === ItemType.STORAGE) return '#06b6d4'; // cyan-500
  return '#10b981'; // emerald-500 (server)
};

// --- HELPER FUNCTIONS FOR COLLISION ---

const getAbsolutePosition = (node: Node, allNodes: Node[]): XYPosition => {
    if (!node.parentId) return node.position;
    const parent = allNodes.find(n => n.id === node.parentId);
    if (parent) {
        // Recursive call in case of multi-level nesting (Server -> Rack -> Zone)
        const parentPos = getAbsolutePosition(parent, allNodes);
        return {
            x: parentPos.x + node.position.x,
            y: parentPos.y + node.position.y
        };
    }
    return node.position;
};

const checkCollision = (rect1: any, rect2: any) => {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

const DCIMCanvas = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Theme State
  const [isDark, setIsDark] = useState(true);

  // Selection State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [activeType, setActiveType] = useState<ItemType | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  
  // Highlight/Drag State
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [targetRackId, setTargetRackId] = useState<string | null>(null);

  // Drag State for Revert
  const dragStartNodeRef = useRef<Node | null>(null);

  // Use ReactFlow hook for internal state access
  const { project, getNodes } = useReactFlow();

  // Context Menu State
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);

  // Space Key State for Panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Auto-hide help after 10s
  useEffect(() => {
     const timer = setTimeout(() => setShowHelp(false), 10000);
     return () => clearTimeout(timer);
  }, []);

  // Handle Spacebar listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
        if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setIsSpacePressed(false);
    };
    
    const handleBlur = () => setIsSpacePressed(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Highlight Type logic
  useEffect(() => {
    let type: ItemType | null = null;
    if (selectedNode) {
         if (selectedNode.type === 'placeholder') type = ItemType.PLACEHOLDER;
         else if (selectedNode.type === 'rack') type = ItemType.RACK;
         else if (selectedNode.type === 'zone') type = ItemType.ZONE;
         else type = (selectedNode.data as ServerData).type;
    }
    setActiveType(type);
    setIsHighlightActive(false); 
  }, [selectedNode]);

  // Apply visual highlights for Search/Filter
  useEffect(() => {
     setNodes(nds => nds.map(node => {
        let myType = node.type; 
        const isMatched = isHighlightActive && activeType && myType === activeType;
        if (node.data.isMatchedType !== isMatched) {
            return { ...node, data: { ...node.data, isMatchedType: isMatched } };
        }
        return node;
     }));
  }, [activeType, isHighlightActive, setNodes]);

  // Apply visual highlights for Drag Target (Drop Zone)
  useEffect(() => {
     setNodes(nds => nds.map(node => {
         if (node.type !== ItemType.RACK && node.type !== ItemType.PLACEHOLDER) return node;
         const isTarget = node.id === targetRackId;
         if (node.data.isDropTarget !== isTarget) {
             return { ...node, data: { ...node.data, isDropTarget: isTarget } };
         }
         return node;
     }));
  }, [targetRackId, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
        const newEdge = { 
            ...params, 
            type: 'portConnection',
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isDark ? '#94a3b8' : '#475569',
            },
            zIndex: 900, // Below devices (1000) but visible
            data: {
                sourcePort: 'Port?',
                targetPort: 'Port?',
                speed: ''
            }
        };
        setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, isDark]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNode(node);
    setSelectedEdge(null);
    setIsEditingNode(false);
    setMenu(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedEdge(edge);
      setSelectedNode(null);
      setMenu(null);
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        setMenu({
          id: node.id,
          top: event.clientY - bounds.top,
          left: event.clientX - bounds.left,
        });
        setSelectedNode(node);
        setSelectedEdge(null);
      }
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setMenu(null);
    setIsEditingNode(false);
  }, []);

  const handleEdit = useCallback(() => {
    if (menu) {
        setIsEditingNode(true);
        const node = nodes.find(n => n.id === menu.id);
        if (node) setSelectedNode(node);
        setMenu(null);
    }
  }, [menu, nodes]);

  const handleDelete = useCallback(() => {
     if (menu) {
         setNodes((nds) => nds.filter((n) => n.id !== menu.id && n.parentId !== menu.id));
         setMenu(null);
         setSelectedNode(null);
     }
  }, [menu, setNodes]);

  const handleDuplicate = useCallback(() => {
      if (menu) {
          const nodeToCopy = nodes.find(n => n.id === menu.id);
          if (nodeToCopy) {
              const newId = getId();
              const position = {
                  x: nodeToCopy.position.x + 20,
                  y: nodeToCopy.position.y + 20
              };
              const newNode = {
                  ...nodeToCopy,
                  id: newId,
                  position,
                  selected: false,
                  zIndex: nodeToCopy.zIndex, // Preserve zIndex
                  data: {
                      ...nodeToCopy.data,
                      label: `${nodeToCopy.data.label} (Copy)`
                  }
              };
              setNodes((nds) => nds.concat(newNode));
          }
          setMenu(null);
      }
  }, [menu, nodes, setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const dragDataString = event.dataTransfer.getData('application/reactflow');
      if (!dragDataString) return;

      const dragData: DragItem = JSON.parse(dragDataString);

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let xOffset = 0;
      let yOffset = 0;
      let width = 0;
      let height = 0;
      let zIndex = Z_INDEX_DEVICE;

      if (dragData.type === ItemType.ZONE) {
          width = dragData.width || 400;
          height = dragData.height || 300;
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_ZONE;
      } else if (dragData.type === ItemType.RACK || dragData.type === ItemType.PLACEHOLDER) {
          height = (dragData.totalU || 42) * PX_PER_U + (RACK_PADDING_PX * 2);
          width = RACK_WIDTH_PX;
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_RACK;
      } else {
          height = (dragData.uHeight || 1) * PX_PER_U;
          width = SERVER_WIDTH_PX;
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_DEVICE;
      }

      const newNode: Node = {
        id: getId(),
        type: dragData.type,
        position: {
            x: position.x - xOffset, 
            y: position.y - yOffset
        },
        style: { width, height },
        zIndex: zIndex,
        data: { 
            label: dragData.label,
            totalU: dragData.totalU, 
            uHeight: dragData.uHeight, 
            type: dragData.type,
            status: 'active',
            description: dragData.type === ItemType.ZONE ? '拖拽调整大小...' : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, project, setNodes]
  );

  // Capture initial state for Revert logic
  const onNodeDragStart: NodeDragHandler = useCallback((event, node) => {
     dragStartNodeRef.current = JSON.parse(JSON.stringify(node));
  }, []);

  // Handle Dragging Visuals (Highlight Target Rack)
  const onNodeDrag: NodeDragHandler = useCallback((event, node) => {
      // Don't highlight racks if we are dragging a rack or a zone
      if (node.type === ItemType.RACK || node.type === ItemType.PLACEHOLDER || node.type === ItemType.ZONE) {
          if (targetRackId) setTargetRackId(null);
          return;
      }

      // Get current snapshot of nodes for collision check
      const currentNodes = getNodes();

      // Calculate absolute rect of dragged node
      // Note: During drag, 'node' has the current position.
      // If it has a parent, position is relative to parent. We need absolute world coordinates for collision.
      const absPos = getAbsolutePosition(node, currentNodes);
      const nodeRect = { 
          x: absPos.x, 
          y: absPos.y, 
          width: node.width || SERVER_WIDTH_PX, 
          height: node.height || 40 
      };

      // Find first rack that intersects
      const hoveredRack = currentNodes.find(n => {
          if (n.type !== ItemType.RACK && n.type !== ItemType.PLACEHOLDER) return false;
          if (n.id === node.id) return false; 

          const rackAbs = getAbsolutePosition(n, currentNodes);
          const rackW = n.width || RACK_WIDTH_PX;
          const rackH = n.height || ((n.data.totalU * PX_PER_U) + RACK_PADDING_PX * 2);
          
          return checkCollision(nodeRect, { x: rackAbs.x, y: rackAbs.y, width: rackW, height: rackH });
      });

      const newTargetId = hoveredRack ? hoveredRack.id : null;
      if (newTargetId !== targetRackId) {
          setTargetRackId(newTargetId);
      }
  }, [getNodes, targetRackId]);

  // Enhanced Drag Stop Handler with Multi-Level Collision Logic
  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node) => {
        setTargetRackId(null); // Clear highlight on drop

        // ZONES themselves do not get parented into anything for now
        if (node.type === ItemType.ZONE) {
            return;
        }

        setNodes((nds) => {
            const currentNode = nds.find(n => n.id === node.id);
            if (!currentNode) return nds;

            // 1. Calculate Absolute Position of the dragged node
            const absPos = getAbsolutePosition(currentNode, nds);
            const absX = absPos.x;
            const absY = absPos.y;

            const nodeWidth = node.width || (currentNode.width) || SERVER_WIDTH_PX;
            const nodeHeight = node.height || (currentNode.height) || 30;
            const nodeAbsRect = { x: absX, y: absY, width: nodeWidth, height: nodeHeight };

            // -- LOGIC FOR DEVICES (Servers, etc) --
            const isDevice = node.type !== ItemType.RACK && node.type !== ItemType.PLACEHOLDER;

            if (isDevice) {
                 // Priority 1: Check Racks
                 const rackNodes = nds.filter(n => n.type === ItemType.RACK && n.id !== node.id);
                 const targetRack = rackNodes.find(rack => {
                     const rackAbs = getAbsolutePosition(rack, nds);
                     const rackW = rack.width || RACK_WIDTH_PX;
                     const rackH = rack.height || ((rack.data.totalU * PX_PER_U) + RACK_PADDING_PX * 2);
                     const rackRect = { x: rackAbs.x, y: rackAbs.y, width: rackW, height: rackH };
                     return checkCollision(nodeAbsRect, rackRect);
                 });

                 if (targetRack) {
                     // Attach to Rack
                     const rackAbs = getAbsolutePosition(targetRack, nds);
                     const relX = RACK_PADDING_PX; 
                     let relY = absY - rackAbs.y;

                     // Snap logic
                     const relativeYInRackArea = relY - RACK_PADDING_PX;
                     const snappedUIndex = Math.round(relativeYInRackArea / PX_PER_U);
                     const maxSlots = (targetRack.data.totalU) - (currentNode.data.uHeight || 1);
                     const clampedIndex = Math.max(0, Math.min(maxSlots, snappedUIndex));
                     const finalY = (clampedIndex * PX_PER_U) + RACK_PADDING_PX;

                     // Check Slot Collision
                     const slotStart = clampedIndex + 1;
                     const slotEnd = slotStart + (currentNode.data.uHeight || 1) - 1;

                     const hasSlotCollision = nds.some(n => {
                         if (n.parentId !== targetRack.id) return false;
                         if (n.id === node.id) return false; 
                         
                         const nUHeight = n.data.uHeight || 1;
                         const nStartU = Math.round((n.position.y - RACK_PADDING_PX) / PX_PER_U) + 1;
                         const nEndU = nStartU + nUHeight - 1;
                         return (slotStart <= nEndU && slotEnd >= nStartU);
                     });

                     if (hasSlotCollision) {
                         // Revert
                         return nds.map(n => n.id === node.id && dragStartNodeRef.current ? dragStartNodeRef.current : n);
                     }

                     // Success: Parent is Rack
                     return nds.map(n => n.id === node.id ? {
                         ...n,
                         parentId: targetRack.id,
                         position: { x: relX, y: finalY },
                         zIndex: Z_INDEX_DEVICE
                     } : n);
                 }
            }

            // -- LOGIC FOR RACKS AND LOOSE DEVICES (Priority 2: Zones) --
            // If we didn't hit a rack (or we are a rack), check Zones
            const zoneNodes = nds.filter(n => n.type === ItemType.ZONE && n.id !== node.id);
            // Sort zones by z-index or simply find first one. Since zones don't overlap usually, finding one is enough.
            const targetZone = zoneNodes.find(zone => {
                 const zoneAbs = getAbsolutePosition(zone, nds);
                 // We rely on style width/height for zones as they are resizable
                 const zoneW = parseInt(zone.style?.width as string) || zone.width || 400;
                 const zoneH = parseInt(zone.style?.height as string) || zone.height || 300;
                 const zoneRect = { x: zoneAbs.x, y: zoneAbs.y, width: zoneW, height: zoneH };
                 return checkCollision(nodeAbsRect, zoneRect);
            });

            if (targetZone) {
                // Attach to Zone
                const zoneAbs = getAbsolutePosition(targetZone, nds);
                const relX = absX - zoneAbs.x;
                const relY = absY - zoneAbs.y;

                return nds.map(n => n.id === node.id ? {
                    ...n,
                    parentId: targetZone.id,
                    position: { x: relX, y: relY },
                    zIndex: isDevice ? Z_INDEX_DEVICE : Z_INDEX_RACK
                } : n);
            }

            // -- NO PARENT (Canvas) --
            // If we are here, we are not in a Rack, and not in a Zone.
            // Or we were in a rack/zone and dragged out to empty space.
            
            // Check for collision with other items in canvas (only for devices vs devices to avoid overlap)
            if (isDevice) {
                const hasOverlap = nds.some(n => {
                    if (n.id === node.id) return false;
                    if (n.type === ItemType.RACK || n.type === ItemType.PLACEHOLDER || n.type === ItemType.ZONE) return false;

                    const nAbs = getAbsolutePosition(n, nds);
                    const nRect = { x: nAbs.x, y: nAbs.y, width: n.width || SERVER_WIDTH_PX, height: n.height || 30 };
                    return checkCollision(nodeAbsRect, nRect);
                });

                if (hasOverlap) {
                    return nds.map(n => n.id === node.id && dragStartNodeRef.current ? dragStartNodeRef.current : n);
                }
            }

            // Detach completely
            return nds.map(n => n.id === node.id ? {
                ...n,
                parentId: undefined,
                position: { x: absX, y: absY },
                zIndex: isDevice ? Z_INDEX_DEVICE : Z_INDEX_RACK
            } : n);

        });
    },
    [setNodes]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnScroll={!isSpacePressed}
          panOnDrag={isSpacePressed || [1, 2]} 
          selectionOnDrag={!isSpacePressed}
          fitView
          minZoom={0.05}
          maxZoom={2}
          className="bg-slate-50 dark:bg-[#0f172a]"
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color={isDark ? "#334155" : "#cbd5e1"} 
          />
          <Controls />
          <MiniMap 
            nodeColor={nodeColor} 
            style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }} 
            maskColor={isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"} 
          />
          
          <VisibilityControls />
          <GeminiAdvisor isDark={isDark} onThemeChange={setIsDark} />

          {/* Type Highlighter Panel */}
          {activeType && selectedNode && (
            <Panel position="top-center" className="mt-4">
                 <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Highlighting: <span className="text-slate-900 dark:text-white font-bold">{activeType.toUpperCase()}</span>
                    </span>
                    <button 
                        onClick={() => setIsHighlightActive(!isHighlightActive)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isHighlightActive ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${isHighlightActive ? 'left-6' : 'left-1'}`}></div>
                    </button>
                 </div>
            </Panel>
          )}

          {/* Instructions Overlay */}
          {showHelp && (
            <Panel position="bottom-center" className="mb-8 pointer-events-none">
                 <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs shadow-2xl flex items-center gap-4 animate-bounce">
                    <span className="flex items-center gap-2">
                        <i className="fa-solid fa-hand-pointer"></i> Select
                    </span>
                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
                    <span className="flex items-center gap-2">
                        <span className="bg-slate-200 dark:bg-slate-700 px-1.5 rounded text-[10px]">Space</span> + Drag to Pan
                    </span>
                    <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
                    <span className="flex items-center gap-2">
                        <i className="fa-solid fa-bezier-curve"></i> Connect Devices
                    </span>
                 </div>
            </Panel>
          )}

        </ReactFlow>

        {/* Details Panels */}
        {selectedNode && (
            <NodeDetailsPanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                isEditing={isEditingNode}
            />
        )}
        
        {selectedEdge && (
            <EdgeDetailsPanel 
                edge={selectedEdge} 
                onClose={() => setSelectedEdge(null)} 
            />
        )}

        {/* Context Menu */}
        {menu && (
            <ContextMenu 
                top={menu.top} 
                left={menu.left} 
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onClose={() => setMenu(null)}
            />
        )}
      </div>
    </div>
  );
};

export default function SmartDCIM() {
  return (
    <ReactFlowProvider>
      <DCIMCanvas />
    </ReactFlowProvider>
  );
}