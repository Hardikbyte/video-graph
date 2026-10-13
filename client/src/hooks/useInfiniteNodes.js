import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

const INITIAL_STATE = {
  items: [],
  nextCursor: null,
  total: 0,
  sections: [],
  name: "",
  status: "loading",
  error: "",
};

// Loads a board's nodes in chunks using the server's cursor paging.
export function useInfiniteNodes(token, boardId) {
  const [state, setState] = useState(INITIAL_STATE);
  const itemsRef = useRef([]);
  const cursorRef = useRef(null);
  const pending = useRef(null);

  const load = useCallback(
    (cursor) => {
      if (pending.current) return pending.current;

      pending.current = (async () => {
        try {
          const page = await api.getNodesPage(token, boardId, { cursor });
          const base = cursor ? itemsRef.current : [];
          const seen = new Set(base.map((n) => n.id));
          const items = [...base, ...page.nodes.filter((n) => !seen.has(n.id))];
          itemsRef.current = items;
          cursorRef.current = page.nextCursor;
          setState((prev) => ({
            items,
            nextCursor: page.nextCursor,
            total: page.total,
            sections: page.sections ?? prev.sections,
            name: page.board.name,
            status: "ready",
            error: "",
          }));
        } catch (err) {
          setState((prev) => ({ ...prev, status: "error", error: err.message }));
        } finally {
          pending.current = null;
        }
      })();

      return pending.current;
    },
    [token, boardId]
  );

  useEffect(() => {
    load(null);
  }, [load]);

  const loadMore = useCallback(() => {
    if (cursorRef.current) return load(cursorRef.current);
    return Promise.resolve();
  }, [load]);

  // Keeps loading chunks until the item at `offset` is available.
  const loadUntil = useCallback(
    async (offset) => {
      while (itemsRef.current.length <= offset && cursorRef.current) {
        await load(cursorRef.current);
      }
    },
    [load]
  );

  const reload = useCallback(() => {
    itemsRef.current = [];
    cursorRef.current = null;
    return load(null);
  }, [load]);

  return { ...state, loadMore, loadUntil, reload };
}
