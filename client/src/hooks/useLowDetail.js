import { useStore } from "@xyflow/react";

const LOW_DETAIL_ZOOM = 0.5;

// True when the canvas is zoomed out far enough that thumbnails, favicons and
// textareas are unreadable. Returns a boolean, so components only re-render
// when the threshold is crossed, not on every zoom tick.
export function useLowDetail() {
  return useStore((state) => state.transform[2] < LOW_DETAIL_ZOOM);
}
