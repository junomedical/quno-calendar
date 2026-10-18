import type { CalendarEngine } from "./CalendarEngine";
import type { EngineSnapshot } from "./types";
import type { RenderWindow } from "#quno-internal/timeline/runtime/model/types";

function sameWindow({ first, second }: { first: RenderWindow; second: RenderWindow }): boolean {
  return (
    first.visibleDateKeys.length === second.visibleDateKeys.length &&
    first.visibleDateKeys.every((date, index) => date === second.visibleDateKeys[index]) &&
    first.dateIndexes.length === second.dateIndexes.length &&
    first.dateIndexes.every((index, position) => index === second.dateIndexes[position]) &&
    first.resourceIndexes.size === second.resourceIndexes.size &&
    [...first.resourceIndexes].every(([date, indexes]) => {
      const next = second.resourceIndexes.get(date);
      return next?.length === indexes.length && indexes.every((index, position) => index === next[position]);
    })
  );
}

/** React needs a new frame only when its geometry or mounted/visible identities change.
 * Imperative commands, ownership and pointer projection always read the live engine instead.
 */
export class RenderSnapshotReader {
  private snapshot: EngineSnapshot;
  private observed: EngineSnapshot;
  private engine: CalendarEngine;

  constructor({ engine }: { engine: CalendarEngine }) {
    this.engine = engine;
    this.snapshot = this.observed = engine.read();
  }

  read = (): EngineSnapshot => {
    const next = this.engine.read();
    if (next === this.observed) return this.snapshot;
    this.observed = next;
    if (next.geometry !== this.snapshot.geometry || !sameWindow({ first: this.snapshot.window, second: next.window }))
      this.snapshot = next;
    return this.snapshot;
  };
}
