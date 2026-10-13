import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAuth } from "../context/auth.js";
import { NodeActionsContext } from "../context/NodeActionsContext.jsx";
import { api } from "../api/client.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { DEFAULT_EDGE_COLOR } from "../lib/edgeStyle.js";
import { extractYoutubeId } from "../lib/youtube.js";
import BoardHeader from "./BoardHeader.jsx";
import SelectionPanel from "./SelectionPanel.jsx";
import VideoNode from "./VideoNode.jsx";
import FlowEdge from "./FlowEdge.jsx";
import TextNode from "./TextNode.jsx";
import ImageNode from "./ImageNode.jsx";
import LinkNode from "./LinkNode.jsx";
import NodeFormModal from "./NodeFormModal.jsx";

const nodeTypes = { video: VideoNode, text: TextNode, image: ImageNode, link: LinkNode };
const edgeTypes = { flow: FlowEdge };

// Above this many nodes, "fit everything" would be unreadably small.
const BIG_BOARD_NODES = 40;
const BIG_BOARD_VIEWPORT = { x: 40, y: 90, zoom: 0.6 };

function serializeNode(n) {
  return {
    id: n.id,
    type: n.type,
    youtubeId: n.type === "video" ? n.data.youtubeId : "",
    text: n.data.text || "",
    url: n.data.url || "",
    section: n.data.section || "",
    title: n.data.title || "",
    notes: n.data.notes || "",
    position: n.position,
  };
}

function serializeEdge(e) {
  return {
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
    color: e.data?.color || null,
    label: e.data?.label || "",
    lineStyle: e.data?.lineStyle || "solid",
    arrow: !!e.data?.arrow,
  };
}

function toFlowNodes(boardNodes) {
  return boardNodes.map((n) => ({
    id: n.id,
    type: n.type || "video",
    position: n.position,
    data: {
      youtubeId: n.youtubeId,
      title: n.title,
      notes: n.notes || "",
      text: n.text || "",
      url: n.url || "",
      section: n.section || "",
    },
  }));
}

function withMarker(edge) {
  return {
    ...edge,
    markerEnd: edge.data?.arrow
      ? { type: MarkerType.ArrowClosed, color: edge.data.color || DEFAULT_EDGE_COLOR }
      : undefined,
  };
}

function toFlowEdges(boardEdges) {
  return boardEdges.map((e) =>
    withMarker({
      id: e.id,
      type: "flow",
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
      data: {
        color: e.color || null,
        label: e.label || "",
        lineStyle: e.lineStyle || "solid",
        arrow: !!e.arrow,
      },
    })
  );
}

function CanvasInner({ boardId, view, onViewChange, focusId }) {
  const { token } = useAuth();
  const { setCenter, setViewport } = useReactFlow();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [board, setBoard] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [revision, setRevision] = useState(0);

  const saveTimeout = useRef(null);
  const pendingSave = useRef(null);
  const latest = useRef({ nodes: [], edges: [] });

  // Only changes that need persisting bump the revision (not drags in progress,
  // selection or measurement changes), so autosave does not run on every frame.
  const markDirty = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    latest.current = { nodes, edges };
  }, [nodes, edges]);

  useEffect(() => {
    let cancelled = false;
    api
      .getBoard(token, boardId)
      .then((data) => {
        if (cancelled) return;
        setBoard(data);
        setNodes(
          toFlowNodes(data.nodes).map((n) => (n.id === focusId ? { ...n, selected: true } : n))
        );
        setEdges(toFlowEdges(data.edges));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // focusId only matters for the first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, token]);

  const scheduleSave = useCallback(
    (nextNodes, nextEdges) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      setSaveStatus("saving");
      const payload = {
        nodes: nextNodes.map(serializeNode),
        edges: nextEdges.map(serializeEdge),
      };
      pendingSave.current = payload;
      saveTimeout.current = setTimeout(async () => {
        pendingSave.current = null;
        try {
          await api.saveBoard(token, boardId, payload);
          setSaveStatus("saved");
        } catch (err) {
          setSaveStatus("error");
          setError(err.message);
        }
      }, 600);
    },
    [boardId, token]
  );

  useEffect(
    () => () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (pendingSave.current) {
        api.saveBoard(token, boardId, pendingSave.current).catch(() => {});
        pendingSave.current = null;
      }
    },
    [boardId, token]
  );

  useEffect(() => {
    if (revision === 0) return;
    scheduleSave(latest.current.nodes, latest.current.edges);
  }, [revision, scheduleSave]);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      if (changes.some((c) => c.type === "remove" || (c.type === "position" && c.dragging === false))) {
        markDirty();
      }
    },
    [markDirty]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      if (changes.some((c) => c.type === "remove")) markDirty();
    },
    [markDirty]
  );

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            type: "flow",
            data: { color: null, label: "", lineStyle: "solid", arrow: false },
          },
          eds
        )
      );
      markDirty();
    },
    [markDirty]
  );

  async function handleAddNode(payload) {
    const position = {
      x: 80 + Math.random() * 400,
      y: 80 + Math.random() * 300,
    };
    const updated = await api.addNode(token, boardId, { ...payload, position });
    setBoard(updated);
    const [created] = toFlowNodes(updated.nodes.slice(-1));
    setNodes((nds) => [...nds, created]);
  }

  const onNoteChange = useCallback(
    (nodeId, notes) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, notes } } : n))
      );
      markDirty();
    },
    [markDirty]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      markDirty();
    },
    [markDirty]
  );

  const onNodeEdit = useCallback((nodeId) => setEditingNodeId(nodeId), []);

  const onEdgeUpdate = useCallback(
    (edgeId, patch) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? withMarker({ ...e, data: { ...e.data, ...patch } }) : e
        )
      );
      markDirty();
    },
    [markDirty]
  );

  const onEdgeDelete = useCallback(
    (edgeId) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      markDirty();
    },
    [markDirty]
  );

  const actions = useMemo(() => ({ onNoteChange }), [onNoteChange]);

  async function handleEditNode({ type, urlOrId, url, title, notes, text, section }) {
    const patch = {
      title,
      notes: notes ?? "",
      text: text ?? "",
      url: url ?? "",
      section: section ?? "",
    };
    if (type === "video") patch.youtubeId = extractYoutubeId(urlOrId);
    setNodes((nds) =>
      nds.map((n) => (n.id === editingNodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
    markDirty();
  }

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;

  // Exactly one selected node or one selected edge drives the bottom panel.
  const { selectedNode, selectedEdge } = useMemo(() => {
    const selNodes = nodes.filter((n) => n.selected);
    const selEdges = edges.filter((e) => e.selected);
    return {
      selectedNode: selNodes.length === 1 && selEdges.length === 0 ? selNodes[0] : null,
      selectedEdge: selEdges.length === 1 && selNodes.length === 0 ? selEdges[0] : null,
    };
  }, [nodes, edges]);

  // Section -> its top-left node, in order of first appearance.
  const sections = useMemo(() => {
    const byName = new Map();
    for (const n of nodes) {
      const name = n.data.section;
      if (!name) continue;
      const best = byName.get(name);
      if (
        !best ||
        n.position.y < best.position.y ||
        (n.position.y === best.position.y && n.position.x < best.position.x)
      ) {
        byName.set(name, n);
      }
    }
    return [...byName.entries()].map(([name, node]) => ({ name, position: node.position }));
  }, [nodes]);

  function jumpToSection(name) {
    const target = sections.find((s) => s.name === name);
    if (!target) return;
    const zoom = BIG_BOARD_VIEWPORT.zoom;
    setViewport(
      {
        x: BIG_BOARD_VIEWPORT.x - target.position.x * zoom,
        y: BIG_BOARD_VIEWPORT.y - target.position.y * zoom,
        zoom,
      },
      { duration: 400 }
    );
  }

  const isBig = nodes.length > BIG_BOARD_NODES;

  const handleInit = useCallback(() => {
    if (!focusId) return;
    const node = latest.current.nodes.find((n) => n.id === focusId);
    if (node) setCenter(node.position.x + 110, node.position.y + 100, { zoom: 0.9 });
  }, [focusId, setCenter]);

  if (loading) {
    return <div className="page-center muted">Loading board...</div>;
  }

  if (error && !board) {
    return <div className="page-center auth-error">{error}</div>;
  }

  return (
    <div className="board-page">
      <BoardHeader name={board?.name} view={view} onViewChange={onViewChange}>
        {sections.length > 1 && (
          <select
            className="jump-select"
            value=""
            aria-label="Jump to section"
            onChange={(e) => jumpToSection(e.target.value)}
          >
            <option value="">Jump to...</option>
            {sections.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <span className={`save-status save-status-${saveStatus}`}>
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved"
              : saveStatus === "error"
                ? "Save failed"
                : ""}
        </span>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </BoardHeader>

      <div className="board-canvas">
        <NodeActionsContext.Provider value={actions}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={handleInit}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView={!isBig && !focusId}
            defaultViewport={isBig ? BIG_BOARD_VIEWPORT : undefined}
            minZoom={0.1}
            onlyRenderVisibleElements
          >
            <Background />
            <Controls position="top-left" showInteractive={false} />
            {!isMobile && <MiniMap pannable zoomable />}
          </ReactFlow>
        </NodeActionsContext.Provider>
      </div>

      <SelectionPanel
        node={selectedNode}
        edge={selectedEdge}
        onNodeEdit={onNodeEdit}
        onNodeDelete={onNodeDelete}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeDelete={onEdgeDelete}
      />

      {showAddModal && (
        <NodeFormModal
          sectionOptions={sections.map((s) => s.name)}
          onSubmit={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingNode && (
        <NodeFormModal
          mode="edit"
          sectionOptions={sections.map((s) => s.name)}
          initial={{
            type: editingNode.type,
            url:
              editingNode.type === "video"
                ? `https://youtu.be/${editingNode.data.youtubeId}`
                : editingNode.data.url,
            title: editingNode.data.title,
            notes: editingNode.data.notes,
            text: editingNode.data.text,
            section: editingNode.data.section,
          }}
          onSubmit={handleEditNode}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}

export default function BoardCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
