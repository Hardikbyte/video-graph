import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAuth } from "../context/AuthContext.jsx";
import { NodeActionsContext } from "../context/NodeActionsContext.jsx";
import { api } from "../api/client.js";
import VideoNode from "../components/VideoNode.jsx";
import FlowEdge from "../components/FlowEdge.jsx";
import TextNode from "../components/TextNode.jsx";
import ImageNode from "../components/ImageNode.jsx";
import LinkNode from "../components/LinkNode.jsx";
import NodeFormModal from "../components/NodeFormModal.jsx";
import { extractYoutubeId } from "../lib/youtube.js";

const nodeTypes = { video: VideoNode, text: TextNode, image: ImageNode, link: LinkNode };
const edgeTypes = { flow: FlowEdge };
const DEFAULT_EDGE_COLOR = "#9aa1c4";

function serializeNode(n) {
  return {
    id: n.id,
    type: n.type,
    youtubeId: n.type === "video" ? n.data.youtubeId : "",
    text: n.data.text || "",
    url: n.data.url || "",
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

export default function Board() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

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
      .getBoard(token, id)
      .then((data) => {
        if (cancelled) return;
        setBoard(data);
        setNodes(toFlowNodes(data.nodes));
        setEdges(toFlowEdges(data.edges));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, token]);

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
          await api.saveBoard(token, id, payload);
          setSaveStatus("saved");
        } catch (err) {
          setSaveStatus("error");
          setError(err.message);
        }
      }, 600);
    },
    [id, token]
  );

  useEffect(
    () => () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (pendingSave.current) {
        api.saveBoard(token, id, pendingSave.current).catch(() => {});
        pendingSave.current = null;
      }
    },
    [id, token]
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
    const updated = await api.addNode(token, id, { ...payload, position });
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

  const actions = useMemo(
    () => ({
      onNoteChange,
      onEdit: onNodeEdit,
      onDelete: onNodeDelete,
      onEdgeUpdate,
      onEdgeDelete,
    }),
    [onNoteChange, onNodeEdit, onNodeDelete, onEdgeUpdate, onEdgeDelete]
  );

  async function handleEditNode({ type, urlOrId, url, title, notes, text }) {
    const patch = { title, notes: notes ?? "", text: text ?? "", url: url ?? "" };
    if (type === "video") patch.youtubeId = extractYoutubeId(urlOrId);
    setNodes((nds) =>
      nds.map((n) => (n.id === editingNodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
    markDirty();
  }

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;

  if (loading) {
    return <div className="page-center muted">Loading board...</div>;
  }

  if (error && !board) {
    return <div className="page-center auth-error">{error}</div>;
  }

  return (
    <div className="board-page">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={() => navigate("/boards")}>
          ← Boards
        </button>
        <h1 className="board-title">{board?.name}</h1>
        <div className="topbar-right">
          <span className={`save-status save-status-${saveStatus}`}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : ""}
          </span>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add
          </button>
        </div>
      </header>

      <div className="board-canvas">
        <NodeActionsContext.Provider value={actions}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.1}
            onlyRenderVisibleElements
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </NodeActionsContext.Provider>
      </div>

      {showAddModal && (
        <NodeFormModal onSubmit={handleAddNode} onClose={() => setShowAddModal(false)} />
      )}

      {editingNode && (
        <NodeFormModal
          mode="edit"
          initial={{
            type: editingNode.type,
            url:
              editingNode.type === "video"
                ? `https://youtu.be/${editingNode.data.youtubeId}`
                : editingNode.data.url,
            title: editingNode.data.title,
            notes: editingNode.data.notes,
            text: editingNode.data.text,
          }}
          onSubmit={handleEditNode}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}
