
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
import SoftwareNode from './nodes/SoftwareNode';
import PortConnectionEdge from './edges/PortConnectionEdge';
import GeminiAdvisor from './GeminiAdvisor';
import NodeDetailsPanel from './NodeDetailsPanel';
import EdgeDetailsPanel from './EdgeDetailsPanel';
import ContextMenu from './ContextMenu';
import VisibilityControls from './VisibilityControls';
import { DragItem, ItemType, ServerData } from './types';
import { PX_PER_U, RACK_PADDING_PX, RACK_WIDTH_PX, SERVER_WIDTH_PX, RACK_HEADER_HEIGHT_PX } from './constants';

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
  virtual_machine: ServerNode,
  zone: ZoneNode,
  software: SoftwareNode,
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
  if (node.type === ItemType.VIRTUAL_MACHINE) return '#a855f7'; // purple-500
  if (node.type === ItemType.SOFTWARE) return '#ec4899'; // pink-500
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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<Node[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

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

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      // Clear all highlights
      setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, isSearchMatch: false, isCurrentSearchMatch: false }
      })));
      return;
    }

    const matches = nodes.filter(node => {
      const data = node.data as ServerData;
      const labelMatch = data.label?.toLowerCase().includes(query.toLowerCase());
      const ipMatch = data.ip?.toLowerCase().includes(query.toLowerCase());
      return labelMatch || ipMatch;
    });

    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);

    // Update node highlights
    setNodes(nds => nds.map(node => {
      const isMatch = matches.some(m => m.id === node.id);
      const isCurrent = matches.length > 0 && matches[0].id === node.id;
      return {
        ...node,
        data: { ...node.data, isSearchMatch: isMatch, isCurrentSearchMatch: isCurrent }
      };
    }));

    // Center on first match
    if (matches.length > 0 && reactFlowInstance) {
      const firstMatch = matches[0];
      const nodePos = getAbsolutePosition(firstMatch, nodes);
      reactFlowInstance.setCenter(nodePos.x + (firstMatch.width || 200) / 2, nodePos.y + (firstMatch.height || 50) / 2, { zoom: 1 });
    }
  }, [nodes, setNodes, reactFlowInstance]);

  const handlePrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const newIndex = currentMatchIndex <= 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    const match = searchMatches[newIndex];
    if (match && reactFlowInstance) {
      const nodePos = getAbsolutePosition(match, nodes);
      reactFlowInstance.setCenter(nodePos.x + (match.width || 200) / 2, nodePos.y + (match.height || 50) / 2, { zoom: 1 });
      // 只高亮节点，不打开编辑框
      setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, isCurrentSearchMatch: node.id === match.id }
      })));
    }
  }, [searchMatches, currentMatchIndex, reactFlowInstance, nodes, setNodes]);

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const newIndex = currentMatchIndex >= searchMatches.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(newIndex);
    const match = searchMatches[newIndex];
    if (match && reactFlowInstance) {
      const nodePos = getAbsolutePosition(match, nodes);
      reactFlowInstance.setCenter(nodePos.x + (match.width || 200) / 2, nodePos.y + (match.height || 50) / 2, { zoom: 1 });
      // 只高亮节点，不打开编辑框
      setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, isCurrentSearchMatch: node.id === match.id }
      })));
    }
  }, [searchMatches, currentMatchIndex, reactFlowInstance, nodes, setNodes]);

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
          height = (dragData.totalU || 42) * PX_PER_U + (RACK_PADDING_PX * 2) + RACK_HEADER_HEIGHT_PX;
          width = RACK_WIDTH_PX;
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_RACK;
      } else if (dragData.type === ItemType.VIRTUAL_MACHINE) {
          // 虚拟机使用4U高度，窄宽度
          width = 140;
          height = 120; // 4U = 4 * 30px
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_DEVICE;
      } else if (dragData.type === ItemType.SOFTWARE) {
          // 软件节点使用固定尺寸
          width = 200;
          height = 80;
          xOffset = width / 2;
          yOffset = height / 2;
          zIndex = Z_INDEX_DEVICE;
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
            description: dragData.type === ItemType.ZONE ? '拖拽调整大小...' : undefined,
            cpu: dragData.cpu,
            memory: dragData.memory,
            techStack: dragData.techStack,
            version: dragData.version,
            port: dragData.port
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

  // Handle Dragging Visuals (Highlight Target Rack & Calculate U Position)
  const onNodeDrag: NodeDragHandler = useCallback((event, node) => {
      // Don't highlight racks if we are dragging a rack or a zone
      if (node.type === ItemType.RACK || node.type === ItemType.PLACEHOLDER || node.type === ItemType.ZONE) {
          if (targetRackId) {
              setTargetRackId(null);
              // 清除所有机柜的预览位置
              setNodes((nds) => nds.map((n) => {
                  if (n.type === ItemType.RACK || n.type === ItemType.PLACEHOLDER) {
                      return {
                          ...n,
                          data: { ...n.data, previewUPosition: null, previewUHeight: undefined }
                      };
                  }
                  return n;
              }));
          }
          return;
      }

      // Get current snapshot of nodes for collision check
      const currentNodes = getNodes();

      // Calculate absolute rect of dragged node
      const absPos = getAbsolutePosition(node, currentNodes);
      const nodeHeight = node.height || (node.data?.uHeight || 1) * PX_PER_U;
      const nodeRect = {
          x: absPos.x,
          y: absPos.y,
          width: node.width || SERVER_WIDTH_PX,
          height: nodeHeight
      };

      // Find first rack that intersects
      const hoveredRack = currentNodes.find(n => {
          if (n.type !== ItemType.RACK && n.type !== ItemType.PLACEHOLDER) return false;
          if (n.id === node.id) return false;

          const rackAbs = getAbsolutePosition(n, currentNodes);
          const rackW = RACK_WIDTH_PX;
          const rackTotalU = n.data.totalU || 42;
          const rackH = (rackTotalU * PX_PER_U) + (RACK_PADDING_PX * 2) + RACK_HEADER_HEIGHT_PX;

          return checkCollision(nodeRect, { x: rackAbs.x, y: rackAbs.y, width: rackW, height: rackH });
      });

      const newTargetId = hoveredRack ? hoveredRack.id : null;

      // 计算实时U位位置
      let previewUPosition: number | null = null;
      let previewUHeight = node.data?.uHeight || 1;

      if (hoveredRack) {
          const rackAbs = getAbsolutePosition(hoveredRack, currentNodes);
          const nodeCenterY = absPos.y + nodeHeight / 2;
          const relY = nodeCenterY - rackAbs.y - RACK_HEADER_HEIGHT_PX;
          const rackInnerHeight = hoveredRack.data.totalU * PX_PER_U;
          const relativeYInRackArea = relY - RACK_PADDING_PX;

          // 将Y位置转换为从底部开始的U位置（0 = 底部）
          const uPositionFromBottom = Math.round((rackInnerHeight - relativeYInRackArea) / PX_PER_U);
          const maxU = hoveredRack.data.totalU - previewUHeight;
          previewUPosition = Math.max(0, Math.min(maxU, uPositionFromBottom));
      }

      // 更新节点状态
      setNodes((nds) => nds.map((n) => {
          if (n.type === ItemType.RACK || n.type === ItemType.PLACEHOLDER) {
              const isTarget = n.id === newTargetId;
              return {
                  ...n,
                  data: {
                      ...n.data,
                      isDropTarget: isTarget,
                      previewUPosition: isTarget ? previewUPosition : null,
                      previewUHeight: isTarget ? previewUHeight : undefined
                  }
              };
          }
          return n;
      }));

      if (newTargetId !== targetRackId) {
          setTargetRackId(newTargetId);
      }
  }, [getNodes, targetRackId, setNodes]);

  // Enhanced Drag Stop Handler with Multi-Level Collision Logic
  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node) => {
        setTargetRackId(null); // Clear highlight on drop

        // ZONES themselves do not get parented into anything for now
        if (node.type === ItemType.ZONE) {
            return;
        }

        setNodes((nds) => {
            // 首先清除所有机柜的预览位置
            const clearedNodes = nds.map((n) => {
                if (n.type === ItemType.RACK || n.type === ItemType.PLACEHOLDER) {
                    return {
                        ...n,
                        data: { ...n.data, previewUPosition: null, previewUHeight: undefined, isDropTarget: false }
                    };
                }
                return n;
            });
            const currentNode = clearedNodes.find(n => n.id === node.id);
            if (!currentNode) return clearedNodes;

            // 1. Calculate Absolute Position of the dragged node
            const absPos = getAbsolutePosition(currentNode, clearedNodes);
            const absX = absPos.x;
            const absY = absPos.y;

            const nodeWidth = node.width || (currentNode.width) || SERVER_WIDTH_PX;
            const nodeHeight = node.height || (currentNode.height) || 30;
            const nodeAbsRect = { x: absX, y: absY, width: nodeWidth, height: nodeHeight };

            // -- LOGIC FOR DEVICES (Servers, etc) --
            const isDevice = node.type !== ItemType.RACK && node.type !== ItemType.PLACEHOLDER;

            if (isDevice) {
                 // Priority 1: Check Racks
                 const rackNodes = clearedNodes.filter(n => n.type === ItemType.RACK && n.id !== node.id);
                 const targetRack = rackNodes.find(rack => {
                     const rackAbs = getAbsolutePosition(rack, clearedNodes);
                     const rackW = RACK_WIDTH_PX;
                     const rackTotalU = rack.data.totalU || 42;
                     const rackH = (rackTotalU * PX_PER_U) + (RACK_PADDING_PX * 2) + RACK_HEADER_HEIGHT_PX;
                     const rackRect = { x: rackAbs.x, y: rackAbs.y, width: rackW, height: rackH };
                     return checkCollision(nodeAbsRect, rackRect);
                 });

                 if (targetRack) {
                     // Attach to Rack
                     const rackAbs = getAbsolutePosition(targetRack, clearedNodes);
                     const relX = RACK_PADDING_PX;
                     // 使用节点中心点计算U位置，更准确
                     const nodeHeight = currentNode.height || (currentNode.data.uHeight || 1) * PX_PER_U;
                     const nodeCenterY = absY + nodeHeight / 2;
                     // 减去 Header 高度，得到相对于机柜内部区域的位置
                     const relY = nodeCenterY - rackAbs.y - RACK_HEADER_HEIGHT_PX;

                     // Snap logic - 使用从底部开始的U位置（底部为0，顶部为totalU-1）
                     // 机柜渲染时：i=0（顶部）显示 totalU-1，i=totalU-1（底部）显示 0
                     // 为了与用户视觉一致，我们从底部开始计算U位置
                     const rackInnerHeight = targetRack.data.totalU * PX_PER_U;
                     const relativeYInRackArea = relY - RACK_PADDING_PX;

                     // 将Y位置转换为从底部开始的U位置（0 = 底部）
                     // 限制范围在有效U格子内
                     const uPositionFromBottom = Math.round((rackInnerHeight - relativeYInRackArea) / PX_PER_U);
                     const deviceUHeight = currentNode.data.uHeight || 1;
                     const maxU = targetRack.data.totalU - deviceUHeight;
                     const clampedU = Math.max(0, Math.min(maxU, uPositionFromBottom));

                     // 将U位置转换回从顶部开始的Y坐标用于存储
                     // 设备顶部对齐到U格子的顶部
                     const targetIndexFromTop = (targetRack.data.totalU - deviceUHeight) - clampedU;
                     // finalY 是相对于机柜的坐标，需要加上 Header 高度
                     const finalY = (targetIndexFromTop * PX_PER_U) + RACK_PADDING_PX + RACK_HEADER_HEIGHT_PX;

                     // Check Slot Collision - 使用从底部开始的U位置
                     const slotStart = clampedU;
                     const slotEnd = slotStart + deviceUHeight - 1;

                     const hasSlotCollision = clearedNodes.some(n => {
                         if (n.parentId !== targetRack.id) return false;
                         if (n.id === node.id) return false;

                         const nUHeight = n.data.uHeight || 1;
                         // 将存储的Y坐标转换回从底部开始的U位置
                         // 现在存储的Y坐标包含了 Header 高度，需要先减去
                         const nIndexFromTop = Math.round((n.position.y - RACK_PADDING_PX - RACK_HEADER_HEIGHT_PX) / PX_PER_U);
                         const nUFromBottom = (targetRack.data.totalU - nUHeight) - nIndexFromTop;
                         const nEndU = nUFromBottom + nUHeight - 1;
                         return (slotStart <= nEndU && slotEnd >= nUFromBottom);
                     });

                     if (hasSlotCollision) {
                         // Revert
                         return clearedNodes.map(n => n.id === node.id && dragStartNodeRef.current ? dragStartNodeRef.current : n);
                     }

                     // Success: Parent is Rack
                     return clearedNodes.map(n => n.id === node.id ? {
                         ...n,
                         parentId: targetRack.id,
                         position: { x: relX, y: finalY },
                         zIndex: Z_INDEX_DEVICE
                     } : n);
                 }
            }

            // -- LOGIC FOR RACKS AND LOOSE DEVICES (Priority 2: Zones) --
            // If we didn't hit a rack (or we are a rack), check Zones
            const zoneNodes = clearedNodes.filter(n => n.type === ItemType.ZONE && n.id !== node.id);
            // Sort zones by z-index or simply find first one. Since zones don't overlap usually, finding one is enough.
            const targetZone = zoneNodes.find(zone => {
                 const zoneAbs = getAbsolutePosition(zone, clearedNodes);
                 // We rely on style width/height for zones as they are resizable
                 const zoneW = parseInt(zone.style?.width as string) || zone.width || 400;
                 const zoneH = parseInt(zone.style?.height as string) || zone.height || 300;
                 const zoneRect = { x: zoneAbs.x, y: zoneAbs.y, width: zoneW, height: zoneH };
                 return checkCollision(nodeAbsRect, zoneRect);
            });

            if (targetZone) {
                // Attach to Zone
                const zoneAbs = getAbsolutePosition(targetZone, clearedNodes);
                const relX = absX - zoneAbs.x;
                const relY = absY - zoneAbs.y;

                return clearedNodes.map(n => n.id === node.id ? {
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
                const hasOverlap = clearedNodes.some(n => {
                    if (n.id === node.id) return false;
                    if (n.type === ItemType.RACK || n.type === ItemType.PLACEHOLDER || n.type === ItemType.ZONE) return false;

                    const nAbs = getAbsolutePosition(n, clearedNodes);
                    const nRect = { x: nAbs.x, y: nAbs.y, width: n.width || SERVER_WIDTH_PX, height: n.height || 30 };
                    return checkCollision(nodeAbsRect, nRect);
                });

                if (hasOverlap) {
                    return clearedNodes.map(n => n.id === node.id && dragStartNodeRef.current ? dragStartNodeRef.current : n);
                }
            }

            // Detach completely
            return clearedNodes.map(n => n.id === node.id ? {
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
      <Sidebar 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onPrevMatch={handlePrevMatch}
        onNextMatch={handleNextMatch}
        matchCount={searchMatches.length}
        currentMatchIndex={currentMatchIndex}
      />
      
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
          connectionRadius={40}
          connectionMode="loose"
          snapToGrid={false}
          snapGrid={[15, 15]}
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