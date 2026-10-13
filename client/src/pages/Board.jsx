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
import { api } from "../api/client.js";
import VideoNode from "../components/VideoNode.jsx";
import FlowEdge from "../components/FlowEdge.jsx";
import VideoFormModal from "../components/VideoFormModal.jsx";
import { extractYoutubeId } from "../lib/youtube.js";

const nodeTypes = { video: VideoNode };
const edgeTypes = { flow: FlowEdge };
const DEFAULT_EDGE_COLOR = "#9aa1c4";

function serializeNode(n) {
  return {
    id: n.id,
    youtubeId: n.data.youtubeId,
    title: n.data.title,
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
    type: "video",
    position: n.position,
    data: { youtubeId: n.youtubeId, title: n.title, notes: n.notes || "" },
  }));
}

function toFlowEdges(boardEdges) {
  return boardEdges.map((e) => ({
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
  }));
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

  const saveTimeout = useRef(null);
  const pendingSave = useRef(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getBoard(token, id)
      .then((data) => {
        if (cancelled) return;
        setBoard(data);
        setNodes(toFlowNodes(data.nodes));
        setEdges(toFlowEdges(data.edges));
        skipNextSave.current = true;
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
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    scheduleSave(nodes, edges);
  }, [nodes, edges, scheduleSave]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection) =>
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
      ),
    []
  );

  async function handleAddVideo({ urlOrId, title, notes }) {
    const position = {
      x: 80 + Math.random() * 400,
      y: 80 + Math.random() * 300,
    };
    const updated = await api.addNode(token, id, { urlOrId, title, notes, position });
    setBoard(updated);
    const [created] = toFlowNodes(updated.nodes.slice(-1));
    setNodes((nds) => [...nds, created]);
  }

  const onNoteChange = useCallback((nodeId, notes) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, notes } } : n))
    );
  }, []);

  const onNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const onNodeEdit = useCallback((nodeId) => setEditingNodeId(nodeId), []);

  const onEdgeUpdate = useCallback((edgeId, patch) => {
    setEdges((eds) =>
      eds.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e))
    );
  }, []);

  const onEdgeDelete = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  async function handleEditVideo({ urlOrId, title, notes }) {
    const youtubeId = extractYoutubeId(urlOrId);
    if (!youtubeId) throw new Error("Could not parse a YouTube video ID from input");
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNodeId ? { ...n, data: { ...n.data, youtubeId, title, notes } } : n
      )
    );
  }

  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, onNoteChange, onEdit: onNodeEdit, onDelete: onNodeDelete },
      })),
    [nodes, onNoteChange, onNodeEdit, onNodeDelete]
  );

  const edgesWithHandlers = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        markerEnd: e.data?.arrow
          ? { type: MarkerType.ArrowClosed, color: e.data.color || DEFAULT_EDGE_COLOR }
          : undefined,
        data: { ...e.data, onEdgeUpdate, onEdgeDelete },
      })),
    [edges, onEdgeUpdate, onEdgeDelete]
  );

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
            + Add video
          </button>
        </div>
      </header>

      <div className="board-canvas">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edgesWithHandlers}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      {showAddModal && (
        <VideoFormModal onSubmit={handleAddVideo} onClose={() => setShowAddModal(false)} />
      )}

      {editingNode && (
        <VideoFormModal
          mode="edit"
          initial={{
            urlOrId: `https://youtu.be/${editingNode.data.youtubeId}`,
            title: editingNode.data.title,
            notes: editingNode.data.notes,
          }}
          onSubmit={handleEditVideo}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}
