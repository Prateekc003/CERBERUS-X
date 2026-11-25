import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Share2,
  FileText,
  CheckCircle,
  Network,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { KnowledgeGraphData } from '../types';

interface KnowledgeGraphProps {
  graphData: KnowledgeGraphData | null;
  onRefresh: () => void;
}

interface CustomNodeData {
  nodeType?: string;
  hasConflict?: boolean;
  category?: string;
  label?: string;
  sublabel?: string;
  payload?: any;
}

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const nodeType = nodeData.nodeType || 'CLAIM';
  const hasConflict = nodeData.hasConflict || false;

  let borderColor = 'border-dark-cardBorder';
  let headerBg = 'bg-dark-sidebar text-slate-300';
  let icon = <CheckCircle className="w-3.5 h-3.5 text-slate-400" />;

  if (nodeType === 'DOCUMENT') {
    borderColor = 'border-blue-600/50';
    headerBg = 'bg-blue-950/40 text-blue-300 border-b border-blue-900/40';
    icon = <FileText className="w-3.5 h-3.5 text-blue-400" />;
  } else if (nodeType === 'ENTITY') {
    borderColor = 'border-indigo-600/40';
    headerBg = 'bg-indigo-950/40 text-indigo-300 border-b border-indigo-900/40';
    icon = <Network className="w-3.5 h-3.5 text-indigo-400" />;
  } else if (nodeType === 'CLAIM') {
    if (hasConflict) {
      borderColor = 'border-rose-500/80 ring-2 ring-rose-500/20';
      headerBg = 'bg-rose-950/50 text-rose-300 border-b border-rose-900/50';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
    } else {
      borderColor = 'border-dark-cardBorder';
      headerBg = 'bg-dark-sidebar text-slate-300 border-b border-dark-cardBorder';
      icon = <CheckCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  }

  return (
    <div
      className={`bg-dark-card rounded-xl border ${borderColor} ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } w-64 text-left transition-all overflow-hidden font-sans text-xs shadow-md`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className={`px-3 py-1.5 flex items-center justify-between font-mono text-[10px] ${headerBg}`}>
        <div className="flex items-center space-x-1.5 truncate">
          {icon}
          <span className="font-bold truncate">{nodeData.category || nodeType}</span>
        </div>
        {hasConflict && (
          <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded">
            CONFLICT
          </span>
        )}
      </div>

      <div className="p-3 space-y-1">
        <p className="font-semibold text-white text-[11px] leading-snug line-clamp-2">
          {nodeData.label || 'Node'}
        </p>
        {nodeData.sublabel && (
          <p className="text-[10px] text-slate-400 font-mono line-clamp-2">
            {nodeData.sublabel}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ graphData, onRefresh }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  useEffect(() => {
    if (graphData && graphData.nodes) {
      let filteredNodes = graphData.nodes;
      if (filterType !== 'ALL') {
        filteredNodes = graphData.nodes.filter((n) => n.data.nodeType === filterType);
      }
      setNodes(filteredNodes as any);
      setEdges(graphData.edges as any);
    }
  }, [graphData, filterType, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="p-7 space-y-4 max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col text-slate-200">
      {/* Module Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-dark-borderSubtle gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <span>Evidentiary Knowledge Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            NetworkX graph visualizing connected claims, documents, entities, and active contradiction links.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-slate-400">Filter Nodes:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-dark-input border border-dark-cardBorder text-slate-200 rounded px-2.5 py-1 focus:outline-none"
            >
              <option value="ALL">All Nodes ({graphData?.stats.total_nodes || 0})</option>
              <option value="DOCUMENT">Documents ({graphData?.stats.documents_count || 0})</option>
              <option value="CLAIM">Claims ({graphData?.stats.claims_count || 0})</option>
              <option value="ENTITY">Entities ({graphData?.stats.entities_count || 0})</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="text-xs px-2.5 py-1 rounded border border-dark-cardBorder hover:bg-dark-cardHover text-slate-300 font-mono flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspection Side Panel */}
      <div className="flex-1 border border-dark-cardBorder rounded-xl overflow-hidden relative bg-dark-bg flex shadow-inner">
        <div className="flex-1 h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background color="#1d1d28" gap={20} size={1.5} />
            <Controls className="bg-dark-card border border-dark-cardBorder text-slate-200 shadow-md rounded" />
            <MiniMap
              nodeColor={(node: any) => {
                if (node.data.nodeType === 'DOCUMENT') return '#2563eb';
                if (node.data.hasConflict) return '#f43f5e';
                if (node.data.nodeType === 'ENTITY') return '#818cf8';
                return '#64748b';
              }}
              className="border border-dark-cardBorder rounded bg-dark-sidebar"
            />
          </ReactFlow>

          {/* Legend Banner */}
          <div className="absolute bottom-3 left-3 bg-dark-card/90 border border-dark-cardBorder rounded-lg p-2.5 text-[10px] font-mono shadow-md flex items-center space-x-3 text-slate-300 backdrop-blur-xs">
            <span className="font-bold uppercase text-white">Legend:</span>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
              <span>Document</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />
              <span>Verified Claim</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block animate-pulse" />
              <span>Contradiction</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
              <span>Resolved Entity</span>
            </div>
          </div>
        </div>

        {/* Node Inspector Side Panel */}
        {selectedNode && (
          <div className="w-80 bg-dark-card border-l border-dark-cardBorder p-4 overflow-y-auto space-y-3 shrink-0 shadow-xl z-10 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-dark-borderSubtle">
              <span className="font-mono text-[10px] uppercase font-bold text-blue-400">
                {selectedNode.data.nodeType} Inspector
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm">{selectedNode.data.label}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Node ID: {selectedNode.id}
              </p>
            </div>

            {selectedNode.data.hasConflict && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-900/60 text-rose-300 text-[11px]">
                <strong className="block font-bold">CONTRADICTION FLAG:</strong>
                This node is directly engaged in an unresolved quantitative or temporal discrepancy.
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-dark-borderSubtle">
              <span className="font-mono text-[10px] uppercase text-slate-400 font-bold block">
                Extracted Attributes
              </span>
              <pre className="p-2.5 bg-dark-sidebar text-slate-300 rounded font-mono text-[10px] overflow-x-auto max-h-60 whitespace-pre-wrap border border-dark-cardBorder">
                {JSON.stringify(selectedNode.data.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
