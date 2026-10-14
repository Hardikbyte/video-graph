import { Link } from "react-router-dom";

// The wordmark. The orange dot is the one place orange is used on a surface.
export default function Logo({ to = "/boards", asLink = true }) {
  const content = (
    <>
      <span className="logo-dot" aria-hidden="true" />
      VideoGraph
    </>
  );
  return asLink ? (
    <Link className="logo" to={to}>
      {content}
    </Link>
  ) : (
    <span className="logo">{content}</span>
  );
}
