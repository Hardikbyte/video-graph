import { createContext, useContext } from "react";

export const NodeActionsContext = createContext({
  onNoteChange: () => {},
});

export function useNodeActions() {
  return useContext(NodeActionsContext);
}
