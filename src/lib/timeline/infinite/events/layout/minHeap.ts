/** Minimal binary min-heap used by the interval partitioning sweep. */
export class MinHeap<T> {
  private readonly values: T[] = [];

  private readonly compare: (args: { left: T; right: T }) => number;

  constructor({ compare }: { compare: (args: { left: T; right: T }) => number }) {
    this.compare = compare;
  }

  get size(): number {
    return this.values.length;
  }

  peek(): T | undefined {
    return this.values[0];
  }

  push({ value }: { value: T }): void {
    this.values.push(value);
    this.bubbleUp({ startIndex: this.values.length - 1 });
  }

  pop(): T | undefined {
    const first = this.values[0];
    const last = this.values.pop();

    if (this.values.length > 0 && last !== undefined) {
      this.values[0] = last;
      this.bubbleDown({ startIndex: 0 });
    }

    return first;
  }

  private bubbleUp({ startIndex }: { startIndex: number }): void {
    let index = startIndex;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare({ left: this.values[index], right: this.values[parentIndex] }) >= 0) {
        return;
      }

      [this.values[index], this.values[parentIndex]] = [this.values[parentIndex], this.values[index]];
      index = parentIndex;
    }
  }

  private bubbleDown({ startIndex }: { startIndex: number }): void {
    let index = startIndex;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      let smallestIndex = index;

      if (
        leftIndex < this.values.length &&
        this.compare({ left: this.values[leftIndex], right: this.values[smallestIndex] }) < 0
      ) {
        smallestIndex = leftIndex;
      }
      if (
        rightIndex < this.values.length &&
        this.compare({ left: this.values[rightIndex], right: this.values[smallestIndex] }) < 0
      ) {
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
