// Pending changes that still need to reach the server, grouped by what they touch.
// Pure functions only, so the merge rules can be unit tested without React.

export function emptyQueue() {
  return {
    positions: new Map(), // nodeId -> { x, y }
    nodePatches: new Map(), // nodeId -> partial node fields
    nodeDeletes: new Set(),
    edgeCreates: new Map(), // edgeId -> full edge
    edgePatches: new Map(), // edgeId -> partial edge style
    edgeDeletes: new Set(),
  };
}

export function isEmpty(q) {
  return (
    q.positions.size === 0 &&
    q.nodePatches.size === 0 &&
    q.nodeDeletes.size === 0 &&
    q.edgeCreates.size === 0 &&
    q.edgePatches.size === 0 &&
    q.edgeDeletes.size === 0
  );
}

export function queuePosition(q, nodeId, position) {
  if (q.nodeDeletes.has(nodeId)) return;
  q.positions.set(nodeId, { x: position.x, y: position.y });
}

export function queueNodePatch(q, nodeId, patch) {
  if (q.nodeDeletes.has(nodeId)) return;
  q.nodePatches.set(nodeId, { ...(q.nodePatches.get(nodeId) ?? {}), ...patch });
}

export function queueNodeDelete(q, nodeId) {
  q.positions.delete(nodeId);
  q.nodePatches.delete(nodeId);
  // Edges queued for creation on this node would be rejected, and the server
  // removes the node's existing edges as part of the delete.
  for (const [edgeId, edge] of q.edgeCreates) {
    if (edge.source === nodeId || edge.target === nodeId) {
      q.edgeCreates.delete(edgeId);
      q.edgePatches.delete(edgeId);
    }
  }
  q.nodeDeletes.add(nodeId);
}

export function queueEdgeCreate(q, edge) {
  q.edgeCreates.set(edge.id, edge);
}

export function queueEdgePatch(q, edgeId, patch) {
  if (q.edgeDeletes.has(edgeId)) return;
  if (q.edgeCreates.has(edgeId)) {
    q.edgeCreates.set(edgeId, { ...q.edgeCreates.get(edgeId), ...patch });
  } else {
    q.edgePatches.set(edgeId, { ...(q.edgePatches.get(edgeId) ?? {}), ...patch });
  }
}

export function queueEdgeDelete(q, edgeId) {
  q.edgePatches.delete(edgeId);
  if (q.edgeCreates.has(edgeId)) {
    q.edgeCreates.delete(edgeId); // never reached the server, nothing to delete
  } else {
    q.edgeDeletes.add(edgeId);
  }
}

// Turns the queue into an ordered list of operations. Order matters: deletes first,
// then creates, then patches, then positions.
export function toOperations(q) {
  const ops = [];
  for (const id of q.edgeDeletes) ops.push({ kind: "edgeDelete", id });
  for (const id of q.nodeDeletes) ops.push({ kind: "nodeDelete", id });
  for (const [id, data] of q.edgeCreates) ops.push({ kind: "edgeCreate", id, data });
  for (const [id, data] of q.nodePatches) ops.push({ kind: "nodePatch", id, data });
  for (const [id, data] of q.edgePatches) ops.push({ kind: "edgePatch", id, data });
  if (q.positions.size) {
    ops.push({
      kind: "positions",
      data: [...q.positions].map(([id, { x, y }]) => ({ id, x, y })),
    });
  }
  return ops;
}

// Puts an operation back after a failed flush. Anything queued meanwhile is newer and wins.
export function mergeBack(q, op) {
  switch (op.kind) {
    case "edgeDelete":
      q.edgeDeletes.add(op.id);
      break;
    case "nodeDelete":
      q.nodeDeletes.add(op.id);
      break;
    case "edgeCreate":
      q.edgeCreates.set(op.id, { ...op.data, ...(q.edgeCreates.get(op.id) ?? {}) });
      break;
    case "nodePatch":
      q.nodePatches.set(op.id, { ...op.data, ...(q.nodePatches.get(op.id) ?? {}) });
      break;
    case "edgePatch":
      q.edgePatches.set(op.id, { ...op.data, ...(q.edgePatches.get(op.id) ?? {}) });
      break;
    case "positions":
      for (const { id, x, y } of op.data) {
        if (!q.positions.has(id)) q.positions.set(id, { x, y });
      }
      break;
  }
}

// A short, human description of an operation for error messages.
export function describeOperation(op) {
  switch (op.kind) {
    case "positions":
      return op.data.length === 1 ? "Saving the new position of a node" : `Saving the new positions of ${op.data.length} nodes`;
    case "nodePatch":
      return `Saving changes to node ${op.id.slice(0, 8)}`;
    case "nodeDelete":
      return `Deleting node ${op.id.slice(0, 8)}`;
    case "edgeCreate":
      return "Saving a new connection";
    case "edgePatch":
      return "Saving changes to a connection";
    case "edgeDelete":
      return "Deleting a connection";
    default:
      return "Saving changes";
  }
}
