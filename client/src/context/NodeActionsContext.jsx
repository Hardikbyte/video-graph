import { createContext, useContext } from "react";

const noop = () => {};

export const NodeActionsContext = createContext({
  onNoteChange: noop,
  onEdit: noop,
  onDelete: noop,
  onEdgeUpdate: noop,
  onEdgeDelete: noop,
});

export function useNodeActions() {
  return useContext(NodeActionsContext);
}
