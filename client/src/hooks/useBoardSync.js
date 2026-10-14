import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";

const FLUSH_DELAY_MS = 400;
const RETRY_DELAYS_MS = [1000, 3000, 8000];
const LAYOUT_BATCH = 200; // matches the server limit

function emptyQueue() {
  return {
    positions: new Map(), // nodeId -> { x, y }
    nodePatches: new Map(), // nodeId -> partial node fields
    nodeDeletes: new Set(),
    edgeCreates: new Map(), // edgeId -> full edge
    edgePatches: new Map(), // edgeId -> partial edge style
    edgeDeletes: new Set(),
  };
}

function isEmpty(q) {
  return (
    q.positions.size === 0 &&
    q.nodePatches.size === 0 &&
    q.nodeDeletes.size === 0 &&
    q.edgeCreates.size === 0 &&
    q.edgePatches.size === 0 &&
    q.edgeDeletes.size === 0
  );
}

// Turns the queue into an ordered list of operations. Order matters: deletes first,
// then creates, then patches, then positions.
function toOperations(q) {
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
function mergeBack(q, op) {
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

function send(token, boardId, op, opts) {
  switch (op.kind) {
    case "edgeDelete":
      return api.deleteEdge(token, boardId, op.id, opts);
    case "nodeDelete":
      return api.deleteNode(token, boardId, op.id, opts);
    case "edgeCreate":
      return api.createEdge(token, boardId, op.data, opts);
    case "nodePatch":
      return api.patchNode(token, boardId, op.id, op.data, opts);
    case "edgePatch":
      return api.patchEdge(token, boardId, op.id, op.data, opts);
    case "positions": {
      const batches = [];
      for (let i = 0; i < op.data.length; i += LAYOUT_BATCH) {
        batches.push(api.patchLayout(token, boardId, op.data.slice(i, i + LAYOUT_BATCH), opts));
      }
      return Promise.all(batches);
    }
    default:
      return Promise.resolve();
  }
}

// Collects changes by entity and sends only what changed, batched after a short pause.
export function useBoardSync(token, boardId) {
  const [status, setStatus] = useState("idle");
  const queue = useRef(emptyQueue());
  const timer = useRef(null);
  const flushing = useRef(false);
  const retries = useRef(0);
  const mounted = useRef(true);
  const statusRef = useRef("idle");
  const flushRef = useRef(null); // lets flush schedule itself without capturing itself

  const updateStatus = useCallback((next) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    if (mounted.current) setStatus(next);
  }, []);

  const flush = useCallback(
    async ({ keepalive = false } = {}) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (flushing.current || isEmpty(queue.current)) return;

      flushing.current = true;
      const ops = toOperations(queue.current);
      queue.current = emptyQueue();
      updateStatus("saving");

      let failed = false;
      let retryable = false;

      for (let i = 0; i < ops.length; i += 1) {
        try {
          await send(token, boardId, ops[i], { keepalive });
        } catch (err) {
          if (!err.status || err.status >= 500) {
            // Network or server problem: keep this and everything after it for a retry.
            for (const rest of ops.slice(i)) mergeBack(queue.current, rest);
            failed = true;
            retryable = true;
            break;
          }
          if (err.status === 404 && ops[i].kind !== "positions") {
            continue; // the thing was already removed elsewhere, nothing to save
          }
          failed = true; // rejected by validation, retrying would not help
          console.error("Save rejected:", err.message);
        }
      }

      flushing.current = false;

      if (retryable) {
        const delay = RETRY_DELAYS_MS[Math.min(retries.current, RETRY_DELAYS_MS.length - 1)];
        retries.current += 1;
        updateStatus("error");
        if (mounted.current && !keepalive) timer.current = setTimeout(() => flushRef.current(), delay);
        return;
      }

      retries.current = 0;
      if (!isEmpty(queue.current)) {
        // Changes made while this flush was running: send them too, even if the page is closing.
        if (mounted.current) timer.current = setTimeout(() => flushRef.current(), FLUSH_DELAY_MS);
        else flushRef.current({ keepalive: true });
      } else {
        updateStatus(failed ? "error" : "saved");
      }
    },
    [token, boardId, updateStatus]
  );

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const schedule = useCallback(() => {
    updateStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, FLUSH_DELAY_MS);
  }, [flush, updateStatus]);

  useEffect(() => {
    mounted.current = true;
    const onPageHide = () => flush({ keepalive: true });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      mounted.current = false;
      flush({ keepalive: true });
    };
  }, [flush]);

  const actions = useMemo(
    () => ({
      queuePosition(nodeId, position) {
        const q = queue.current;
        if (q.nodeDeletes.has(nodeId)) return;
        q.positions.set(nodeId, { x: position.x, y: position.y });
        schedule();
      },
      queueNodePatch(nodeId, patch) {
        const q = queue.current;
        if (q.nodeDeletes.has(nodeId)) return;
        q.nodePatches.set(nodeId, { ...(q.nodePatches.get(nodeId) ?? {}), ...patch });
        schedule();
      },
      queueNodeDelete(nodeId) {
        const q = queue.current;
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
        schedule();
      },
      queueEdgeCreate(edge) {
        queue.current.edgeCreates.set(edge.id, edge);
        schedule();
      },
      queueEdgePatch(edgeId, patch) {
        const q = queue.current;
        if (q.edgeDeletes.has(edgeId)) return;
        if (q.edgeCreates.has(edgeId)) {
          q.edgeCreates.set(edgeId, { ...q.edgeCreates.get(edgeId), ...patch });
        } else {
          q.edgePatches.set(edgeId, { ...(q.edgePatches.get(edgeId) ?? {}), ...patch });
        }
        schedule();
      },
      queueEdgeDelete(edgeId) {
        const q = queue.current;
        q.edgePatches.delete(edgeId);
        if (q.edgeCreates.has(edgeId)) {
          q.edgeCreates.delete(edgeId); // never reached the server, nothing to delete
        } else {
          q.edgeDeletes.add(edgeId);
        }
        schedule();
      },
    }),
    [schedule]
  );

  return { status, flush, ...actions };
}
