import { useParams, useSearchParams } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import BoardCanvas from "../components/BoardCanvas.jsx";
import BoardList from "../components/BoardList.jsx";

// Phones get the scrolling list by default, larger screens get the canvas.
export default function Board() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const view = params.get("view") || (isMobile ? "list" : "canvas");

  function changeView(next, focus) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("view", next);
    if (focus) nextParams.set("focus", focus);
    else nextParams.delete("focus");
    setParams(nextParams, { replace: true });
  }

  if (view === "list") {
    return (
      <BoardList
        key={id}
        boardId={id}
        view={view}
        onViewChange={changeView}
        onOpenOnCanvas={(nodeId) => changeView("canvas", nodeId)}
      />
    );
  }

  return (
    <BoardCanvas
      key={id}
      boardId={id}
      view={view}
      onViewChange={changeView}
      focusId={params.get("focus")}
    />
  );
}
