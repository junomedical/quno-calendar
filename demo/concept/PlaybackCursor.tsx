export function PlaybackCursor() {
  return (
    <div className="concept-cursor" hidden aria-hidden="true" data-gesture="move">
      <svg width="28" height="32" viewBox="0 0 28 32">
        <g fill="#302b42" strokeLinejoin="round">
          <path d="M5.5 5.5 L23 22 L14 20 L5.5 27.5Z" stroke="white" strokeWidth="8" />
          <path d="M5.5 5.5 L23 22 L14 20 L5.5 27.5Z" stroke="#302b42" strokeWidth="5" />
        </g>
      </svg>
    </div>
  );
}
