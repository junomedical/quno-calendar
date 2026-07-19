/**
 * Domain: Events.
 * Responsibility: Reuses the earliest available overlap lane in logarithmic time.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/** Minimal binary min-heap used by the interval partitioning sweep. */
export class MinHeap<T> {
  private readonly values: T[] = [];

  constructor(private readonly compare: (left: T, right: T) => number) {}

  get size(): number {
    return this.values.length;
  }

  peek(): T | undefined {
    return this.values[0];
  }

  push(value: T): void {
    this.values.push(value);
    this.bubbleUp(this.values.length - 1);
  }

  pop(): T | undefined {
    const first = this.values[0];
    const last = this.values.pop();

    if (this.values.length > 0 && last !== undefined) {
      this.values[0] = last;
      this.bubbleDown(0);
    }

    return first;
  }

  private bubbleUp(startIndex: number): void {
    let index = startIndex;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.values[index], this.values[parentIndex]) >= 0) {
        return;
      }

      [this.values[index], this.values[parentIndex]] = [this.values[parentIndex], this.values[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(startIndex: number): void {
    let index = startIndex;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      let smallestIndex = index;

      if (leftIndex < this.values.length && this.compare(this.values[leftIndex], this.values[smallestIndex]) < 0) {
        smallestIndex = leftIndex;
      }
      if (rightIndex < this.values.length && this.compare(this.values[rightIndex], this.values[smallestIndex]) < 0) {
        smallestIndex = rightIndex;
      }
      if (smallestIndex === index) {
        return;
      }

      [this.values[index], this.values[smallestIndex]] = [this.values[smallestIndex], this.values[index]];
      index = smallestIndex;
    }
  }
}
