import { useRef } from "react";

// Props for a link inside a draggable node: a click that follows a real drag
// (the pointer moved more than `threshold` pixels) is cancelled, so dragging a node
// by its thumbnail does not also open the link.
export function useClickGuard(threshold = 5) {
  const start = useRef(null);
  return {
    onPointerDown: (event) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onClick: (event) => {
      const from = start.current;
      if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > threshold) {
        event.preventDefault();
      }
    },
  };
}
