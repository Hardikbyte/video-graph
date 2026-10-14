// The hexagon glow behind the page. Place it once, as the first child of a `.chai-page` wrapper.
export default function Backdrop() {
  return (
    <img
      className="chai-backdrop"
      src="/chaiui/background.svg"
      alt=""
      aria-hidden="true"
      fetchPriority="high"
      decoding="async"
    />
  );
}
