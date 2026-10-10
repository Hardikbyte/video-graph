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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import VideoNode from "../components/VideoNode.jsx";
import AddVideoModal from "../components/AddVideoModal.jsx";

const nodeTypes = { video: VideoNode };

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
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
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
  const [saveStatus, setSaveStatus] = useState("idle");

  const saveTimeout = useRef(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      saveTimeout.current = setTimeout(async () => {
        try {
          const payload = {
            nodes: nextNodes.map((n) => ({
              id: n.id,
              youtubeId: n.data.youtubeId,
              title: n.data.title,
              notes: n.data.notes || "",
              position: n.position,
            })),
            edges: nextEdges.map((e) => ({
              id: e.id,
              source: e.source,
              sourceHandle: e.sourceHandle,
              target: e.target,
              targetHandle: e.targetHandle,
            })),
          };
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
    (connection) => setEdges((eds) => addEdge({ ...connection, id: crypto.randomUUID() }, eds)),
    []
  );

  async function handleAddVideo({ urlOrId, title, notes }) {
    const position = {
      x: 80 + Math.random() * 400,
      y: 80 + Math.random() * 300,
    };
    const updated = await api.addNode(token, id, { urlOrId, title, notes, position });
    setBoard(updated);
    setNodes(toFlowNodes(updated.nodes));
    skipNextSave.current = true;
  }

  const onNoteChange = useCallback((nodeId, notes) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, notes } } : n))
    );
  }, []);

  const nodesWithHandlers = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...n.data, onNoteChange } })),
    [nodes, onNoteChange]
  );

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

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
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypesMemo}
          fitView
          minZoom={0.1}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      {showAddModal && (
        <AddVideoModal onAdd={handleAddVideo} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
