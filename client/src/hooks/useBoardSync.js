import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import {
  describeOperation,
  emptyQueue,
  isEmpty,
  mergeBack,
  queueEdgeCreate,
  queueEdgeDelete,
  queueEdgePatch,
  queueNodeDelete,
  queueNodePatch,
  queuePosition,
  toOperations,
} from "../lib/syncQueue.js";

const FLUSH_DELAY_MS = 400;
const RETRY_DELAYS_MS = [1000, 3000, 8000];
const LAYOUT_BATCH = 200; // matches the server limit

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
// `onError({ error, description, retry })` is called for every failed save, and
// `onRecovered()` once everything has been saved after a failure.
export function useBoardSync(token, boardId, { onError, onRecovered } = {}) {
  const [status, setStatus] = useState("idle");
  const [lastError, setLastError] = useState(null);
  const queue = useRef(emptyQueue());
  const timer = useRef(null);
  const flushing = useRef(false);
  const retries = useRef(0);
  const mounted = useRef(true);
  const statusRef = useRef("idle");
  const hadError = useRef(false);
  const flushRef = useRef(null); // lets flush schedule itself without capturing itself
  const callbacks = useRef({ onError, onRecovered });

  useEffect(() => {
    callbacks.current = { onError, onRecovered };
  }, [onError, onRecovered]);

  const updateStatus = useCallback((next) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    if (mounted.current) setStatus(next);
  }, []);

  const reportError = useCallback((error, op) => {
    hadError.current = true;
    const description = describeOperation(op);
    const report = { error, description, retry: () => flushRef.current?.() };
    if (mounted.current) setLastError(report);
    callbacks.current.onError?.(report);
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
            reportError(err, ops[i]);
            failed = true;
            retryable = true;
            break;
          }
          // A JSON 404 on a patch means the node or edge no longer exists (deleted elsewhere),
          // so there is nothing to save. An HTML 404 (err.hint is set) is an old server: report it.
          const gone = err.status === 404 && !err.hint && ["nodePatch", "edgePatch"].includes(ops[i].kind);
          if (gone) continue;
          reportError(err, ops[i]); // rejected, retrying the same request would not help
          failed = true;
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
        if (!failed && hadError.current) {
          hadError.current = false;
          if (mounted.current) setLastError(null);
          callbacks.current.onRecovered?.();
        }
      }
    },
    [token, boardId, updateStatus, reportError]
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
        queuePosition(queue.current, nodeId, position);
        schedule();
      },
      queueNodePatch(nodeId, patch) {
        queueNodePatch(queue.current, nodeId, patch);
        schedule();
      },
      queueNodeDelete(nodeId) {
        queueNodeDelete(queue.current, nodeId);
        schedule();
      },
      queueEdgeCreate(edge) {
        queueEdgeCreate(queue.current, edge);
        schedule();
      },
      queueEdgePatch(edgeId, patch) {
        queueEdgePatch(queue.current, edgeId, patch);
        schedule();
      },
      queueEdgeDelete(edgeId) {
        queueEdgeDelete(queue.current, edgeId);
        schedule();
      },
    }),
    [schedule]
  );

  return { status, lastError, flush, ...actions };
}
