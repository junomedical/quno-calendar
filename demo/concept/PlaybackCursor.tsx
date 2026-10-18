export function PlaybackCursor() {
  return (
    <div className="concept-cursor" hidden aria-hidden="true" data-gesture="move">
      <svg width="28" height="32" viewBox="0 0 28 32">
        <path
          d="M4.01 2.97 L23.99 22.03 Q25 23 23.62 22.77 L14.38 21.23 Q13 21 11.95 21.93 L5.05 28.07 Q4 29 3.95 27.6 L3.05 3.4 Q3 2 4.01 2.97Z"
          fill="#302b42"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span />
    </div>
  );
}
