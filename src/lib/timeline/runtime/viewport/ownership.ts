import type { SemanticAnchor } from "#quno-internal/timeline/runtime/model/types";

export type IntentKind = "restore" | "gesture" | "navigation" | "data" | "recenter";
export type ViewportIntent = Readonly<{
  id: number;
  kind: IntentKind;
  anchor: SemanticAnchor;
  expiresAt: number;
  cancelOnManual: boolean;
}>;
const priority: Record<IntentKind, number> = { restore: 5, gesture: 4, navigation: 3, data: 2, recenter: 1 };

export class ViewportOwnership {
  private intent: ViewportIntent | null = null;
  private sequence = 0;

  active({ now }: { now: number }): ViewportIntent | null {
    if (this.intent && this.intent.expiresAt <= now) this.intent = null;
    return this.intent;
  }

  claim({
    kind,
    anchor,
    now,
    duration,
    cancelOnManual = true
  }: {
    kind: IntentKind;
    anchor: SemanticAnchor;
    now: number;
    duration: number;
    cancelOnManual?: boolean;
  }): ViewportIntent | null {
    const current = this.active({ now });
    if (current && priority[current.kind] > priority[kind]) return null;
    this.intent = Object.freeze({ id: ++this.sequence, kind, anchor, expiresAt: now + duration, cancelOnManual });
    return this.intent;
  }

  cancel({ id }: { id?: number } = {}) {
    if (id === undefined || this.intent?.id === id) this.intent = null;
  }

  manual() {
    if (this.intent?.cancelOnManual) this.intent = null;
  }
}
