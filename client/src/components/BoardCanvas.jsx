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
import { api, REQUIRED_API_VERSION } from "../api/client.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useBoardSync } from "../hooks/useBoardSync.js";
import { useToast } from "../context/toast.js";
import { useTheme } from "../context/theme.js";
import { DEFAULT_EDGE_COLOR } from "../lib/edgeStyle.js";
import { extractYoutubeId, youtubeWatchUrl } from "../lib/youtube.js";
import BoardHeader from "./BoardHeader.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import PageError from "./PageError.jsx";
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
const BIG_BOARD_VIEWPORT = { x: 72, y: 90, zoom: 0.6 };

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
  const toast = useToast();
  const { theme } = useTheme();
  const [pendingNodeDeleteId, setPendingNodeDeleteId] = useState(null);

  const [board, setBoard] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);

  // Each change is queued by entity and sent on its own (a moved node sends only its
  // new position), instead of re-sending the whole board.
  const handleSaveError = useCallback(
    ({ error, description, retry }) =>
      toast.error(error, { title: "Could not save changes", context: description, key: "save-failed", retry }),
    [toast]
  );
  const handleSaveRecovered = useCallback(() => {
    toast.dismiss("save-failed");
    toast.success("All changes saved");
  }, [toast]);

  const {
    status: saveStatus,
    lastError: lastSaveError,
    queuePosition,
    queueNodePatch,
    queueNodeDelete,
    queueEdgeCreate,
    queueEdgePatch,
    queueEdgeDelete,
  } = useBoardSync(token, boardId, { onError: handleSaveError, onRecovered: handleSaveRecovered });

  const latest = useRef({ nodes: [], edges: [] });

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
      .catch((err) => {
        setError(err.message);
        toast.error(err, { title: "Could not load the board" });
      })
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // focusId only matters for the first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, token]);

  // An old server answers the new save requests with 404, which looks like a bug.
  // Say so up front instead.
  useEffect(() => {
    api
      .health()
      .then((info) => {
        if ((info?.api ?? 0) < REQUIRED_API_VERSION) {
          toast.show({
            type: "error",
            key: "old-server",
            title: "The server is out of date",
            message: "Moving and editing items will not save until the server is restarted.",
            hint: "Stop the server and run `npm start` in the server folder, then reload this page.",
          });
        }
      })
      .catch(() => {}); // an unreachable server is reported by the board load itself
  }, [toast]);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      for (const change of changes) {
        // Positions are sent when a drag ends, not on every tick of it.
        if (change.type === "position" && change.dragging === false && change.position) {
          queuePosition(change.id, change.position);
        } else if (change.type === "remove") {
          queueNodeDelete(change.id);
        }
      }
    },
    [queuePosition, queueNodeDelete]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      for (const change of changes) {
        if (change.type === "remove") queueEdgeDelete(change.id);
      }
    },
    [queueEdgeDelete]
  );

  const onConnect = useCallback(
    (connection) => {
      const duplicate = latest.current.edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      if (duplicate) return;

      const id = crypto.randomUUID();
      const style = { color: null, label: "", lineStyle: "solid", arrow: false };
      setEdges((eds) => addEdge({ ...connection, id, type: "flow", data: style }, eds));
      queueEdgeCreate({
        id,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
        ...style,
      });
    },
    [queueEdgeCreate]
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
      queueNodePatch(nodeId, { notes });
    },
    [queueNodePatch]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      queueNodeDelete(nodeId);
    },
    [queueNodeDelete]
  );

  const onNodeEdit = useCallback((nodeId) => setEditingNodeId(nodeId), []);

  const onEdgeUpdate = useCallback(
    (edgeId, patch) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? withMarker({ ...e, data: { ...e.data, ...patch } }) : e
        )
      );
      queueEdgePatch(edgeId, patch);
    },
    [queueEdgePatch]
  );

  const onEdgeDelete = useCallback(
    (edgeId) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      queueEdgeDelete(edgeId);
    },
    [queueEdgeDelete]
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
    queueNodePatch(editingNodeId, patch);
  }

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;

  // The Delete button asks first and says what goes with the node.
  const pendingDeleteNode = pendingNodeDeleteId ? nodes.find((n) => n.id === pendingNodeDeleteId) : null;
  const pendingDeleteConnections = pendingDeleteNode
    ? edges.filter((e) => e.source === pendingDeleteNode.id || e.target === pendingDeleteNode.id).length
    : 0;
  const pendingDeleteLabel =
    pendingDeleteNode?.data.title || pendingDeleteNode?.data.text?.slice(0, 40) || "this item";

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
    return <PageError message={error} />;
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
        {saveStatus === "error" && lastSaveError ? (
          <button
            className="save-status save-status-error save-status-button"
            onClick={() => handleSaveError(lastSaveError)}
          >
            Save failed: details
          </button>
        ) : (
          <span className={`save-status save-status-${saveStatus}`}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : ""}
          </span>
        )}
        <button className="btn btn-primary btn-plain" onClick={() => setShowAddModal(true)}>
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
            colorMode={theme}
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
        onNodeDelete={setPendingNodeDeleteId}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeDelete={onEdgeDelete}
      />

      <ConfirmDialog
        open={!!pendingDeleteNode}
        title={`Delete "${pendingDeleteLabel}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          onNodeDelete(pendingNodeDeleteId);
          setPendingNodeDeleteId(null);
        }}
        onCancel={() => setPendingNodeDeleteId(null)}
      >
        This removes the item from the board
        {pendingDeleteConnections > 0
          ? ` and its ${pendingDeleteConnections} ${pendingDeleteConnections === 1 ? "connection" : "connections"}`
          : ""}
        . This cannot be undone.
      </ConfirmDialog>

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
                ? youtubeWatchUrl(editingNode.data.youtubeId)
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
