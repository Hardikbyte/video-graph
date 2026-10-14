import { Link } from "react-router-dom";

// A full-page error with a way back, used when a board cannot be shown at all.
export default function PageError({ message }) {
  return (
    <div className="page-center page-error">
      <p>{message}</p>
      <Link className="btn btn-outline" to="/boards">
        Back to boards
      </Link>
    </div>
  );
}
