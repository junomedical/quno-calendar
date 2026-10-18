export type PlaybackActions = {
  playing: boolean;
  preview: () => void;
  replay: () => void;
  stop: () => void;
  reset: () => void;
};
export function PlaybackControls({ playing, preview, replay, stop, reset }: PlaybackActions) {
  return (
    <div className="concept-playback-controls">
      <button onClick={preview}>Play tour</button>
      <button onClick={replay}>Replay scene</button>
      {playing && <button onClick={stop}>Pause tour</button>}
      <button onClick={stop}>Try it</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
