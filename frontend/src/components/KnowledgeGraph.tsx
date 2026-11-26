import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Share2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Box,
  RotateCcw,
  Maximize2,
  MapPin,
  Building,
  User,
} from 'lucide-react';
import { KnowledgeGraphData } from '../types';

interface KnowledgeGraphProps {
  graphData: KnowledgeGraphData | null;
  onRefresh: () => void;
}

interface CustomNodeData {
  nodeType?: 'PROJECT' | 'DOCUMENT' | 'CLAIM' | 'ENTITY';
  category?: string;
  label?: string;
  sublabel?: string;
  isOrange?: boolean;
  hasConflict?: boolean;
  payload?: any;
}

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const nodeType = nodeData.nodeType || 'CLAIM';

  const getDocIcon = (filename?: string) => {
    const ext = (filename || '').split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
      return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
  };

  // Multiple hidden handles so edges connect cleanly in all 4 directions
  const renderHandles = () => (
    <>
      <Handle type="target" position={Position.Top} id="t-in" className="!w-2 !h-2 !opacity-0" />
      <Handle type="source" position={Position.Top} id="t-out" className="!w-2 !h-2 !opacity-0" />
      <Handle type="target" position={Position.Bottom} id="b-in" className="!w-2 !h-2 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="b-out" className="!w-2 !h-2 !opacity-0" />
      <Handle type="target" position={Position.Left} id="l-in" className="!w-2 !h-2 !opacity-0" />
      <Handle type="source" position={Position.Left} id="l-out" className="!w-2 !h-2 !opacity-0" />
      <Handle type="target" position={Position.Right} id="r-in" className="!w-2 !h-2 !opacity-0" />
      <Handle type="source" position={Position.Right} id="r-out" className="!w-2 !h-2 !opacity-0" />
    </>
  );

  // 1. PROJECT HUB NODE (Center 3D Isometric Cube Box)
  if (nodeType === 'PROJECT') {
    return (
      <div
        className={`bg-[#0f172a] border-2 border-blue-500 rounded-2xl px-6 py-4 shadow-[0_0_35px_rgba(59,130,246,0.35)] min-w-[210px] text-center transition-all ${
          selected ? 'ring-2 ring-white shadow-2xl' : ''
        }`}
      >
        {renderHandles()}
        <div className="flex justify-center mb-1.5">
          <Box className="w-7 h-7 text-blue-400 stroke-[1.75]" />
        </div>
        <h3 className="font-bold text-white text-sm tracking-tight leading-snug">
          {nodeData.label || 'Medical Supply Project'}
        </h3>
        <p className="text-[10px] text-blue-400 font-mono tracking-widest font-semibold uppercase mt-0.5">
          {nodeData.sublabel || 'PROJECT'}
        </p>
      </div>
    );
  }

  // 2. DOCUMENT NODE (Green Pill with File Icon)
  if (nodeType === 'DOCUMENT') {
    return (
      <div
        className={`bg-[#0c1f17] border border-emerald-500/80 rounded-xl px-4 py-2.5 shadow-[0_0_18px_rgba(16,185,129,0.18)] flex items-center space-x-2.5 min-w-[170px] max-w-[220px] transition-all ${
          selected ? 'ring-2 ring-white shadow-2xl' : ''
        }`}
      >
        {renderHandles()}
        {getDocIcon(nodeData.label)}
        <span className="font-medium text-white text-xs truncate">
          {nodeData.label || 'Document.pdf'}
        </span>
      </div>
    );
  }

  // 3. CLAIM NODE (Indigo/Purple or Orange Box with Bold Assertion & Subtitle)
  if (nodeType === 'CLAIM') {
    const isOrange = nodeData.isOrange || false;
    const borderBg = isOrange
      ? 'border-orange-500/80 bg-[#241510] shadow-[0_0_20px_rgba(249,115,22,0.18)]'
      : 'border-indigo-500/80 bg-[#161428] shadow-[0_0_20px_rgba(99,102,241,0.18)]';

    return (
      <div
        className={`border ${borderBg} rounded-xl px-4 py-2.5 min-w-[180px] max-w-[230px] text-center transition-all ${
          selected ? 'ring-2 ring-white shadow-2xl' : ''
        }`}
      >
        {renderHandles()}
        <h4 className="font-bold text-white text-xs leading-snug">
          {nodeData.label || 'Factual Claim'}
        </h4>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
          {nodeData.sublabel || 'Claim Ref'}
        </p>
      </div>
    );
  }

  // 4. ENTITY NODE (Purple Pill with Entity Type Subtitle)
  return (
    <div
      className={`bg-[#161428] border border-indigo-500/80 rounded-xl px-5 py-2.5 min-w-[170px] max-w-[220px] text-center shadow-[0_0_20px_rgba(99,102,241,0.18)] transition-all ${
        selected ? 'ring-2 ring-white shadow-2xl' : ''
      }`}
    >
      {renderHandles()}
      <h4 className="font-bold text-white text-xs leading-snug">
        {nodeData.label || 'Entity Name'}
      </h4>
      <p className="text-[10px] text-indigo-300/80 font-mono mt-0.5 capitalize">
        {nodeData.sublabel || 'Location'}
      </p>
    </div>
  );
};

export const KnowledgeGraphContent: React.FC<KnowledgeGraphProps> = ({ graphData, onRefresh }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      customNode: CustomNode,
      custom: CustomNode,
      default: CustomNode,
    }),
    []
  );

  // Update nodes and edges when graphData updates, and auto-fit to screen
  useEffect(() => {
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      setNodes(graphData.nodes as any);
      setEdges((graphData.edges || []) as any);

      // Auto-fit to viewport once nodes are set
      const timer = setTimeout(() => {
        fitView({ padding: 0.12, duration: 350 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [graphData, setNodes, setEdges, fitView]);

  // Re-fit view automatically on window resize
  useEffect(() => {
    const handleResize = () => {
      fitView({ padding: 0.12, duration: 200 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const handleFitToScreen = useCallback(() => {
    fitView({ padding: 0.12, duration: 400 });
  }, [fitView]);

  const handleResetLayout = useCallback(() => {
    onRefresh();
    setTimeout(() => {
      fitView({ padding: 0.12, duration: 400 });
    }, 200);
  }, [onRefresh, fitView]);

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 p-4 md:p-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#22222d] gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <span>Knowledge Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Radial evidentiary network connecting case documents, claims, and key entities.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleFitToScreen}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a38] bg-[#14141d] hover:bg-[#1f1f2b] text-slate-200 font-mono flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Fit graph to current screen viewport"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Fit to Screen</span>
          </button>
          <button
            onClick={handleResetLayout}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a38] hover:bg-[#1f1f2b] text-slate-300 font-mono flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas - 100% full width and remaining height */}
      <div className="flex-1 w-full min-h-0 mt-3 border border-[#22222d] rounded-2xl overflow-hidden relative bg-[#090a10] flex shadow-2xl">
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.12, duration: 400 }}
            minZoom={0.2}
            maxZoom={2.5}
            onInit={(instance) => {
              instance.fitView({ padding: 0.12 });
            }}
          >
            <Background color="#161826" gap={24} size={1} />
            <Controls className="!bg-[#14141b] !border !border-[#2a2a38] !text-slate-200 shadow-xl rounded-lg" />
            <MiniMap
              nodeColor={(node: any) => {
                if (node.data.nodeType === 'PROJECT') return '#3b82f6';
                if (node.data.nodeType === 'DOCUMENT') return '#10b981';
                if (node.data.isOrange) return '#f97316';
                return '#818cf8';
              }}
              style={{ width: 120, height: 75 }}
              className="!bg-[#14141b] !border !border-[#2a2a38] rounded-lg shadow-xl"
            />
          </ReactFlow>

          {/* Clean Radial Legend */}
          <div className="absolute bottom-3 left-3 bg-[#12131c]/90 border border-[#262838] rounded-xl px-3.5 py-2 text-[10px] font-mono shadow-xl flex items-center space-x-3.5 text-slate-300 backdrop-blur-md">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span>Project Hub</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span>Document</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span>Claim / Entity</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span>Audit Discrepancy</span>
            </div>
          </div>
        </div>

        {/* Node Inspector Side Panel */}
        {selectedNode && (
          <div className="w-80 bg-[#12131c] border-l border-[#22222d] p-5 overflow-y-auto space-y-4 shrink-0 shadow-2xl z-10 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-[#22222d]">
              <span className="font-mono text-[10px] uppercase font-bold text-blue-400">
                {selectedNode.data.nodeType} Inspector
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm">{selectedNode.data.label}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {selectedNode.data.sublabel}
              </p>
            </div>

            {selectedNode.data.isOrange && (
              <div className="p-3 rounded-lg bg-orange-950/50 border border-orange-900/60 text-orange-200 text-[11px] leading-relaxed">
                <strong className="block font-bold mb-0.5 text-orange-400">Logistical Variance:</strong>
                This assertion represents a cross-document quantity discrepancy under active audit.
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#22222d]">
              <span className="font-mono text-[10px] uppercase text-slate-400 font-bold block">
                Extracted Data
              </span>
              <pre className="p-3 bg-[#090a10] text-slate-300 rounded-lg font-mono text-[10px] overflow-x-auto max-h-60 whitespace-pre-wrap border border-[#22222d]">
                {JSON.stringify(selectedNode.data.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphContent {...props} />
    </ReactFlowProvider>
  );
};
