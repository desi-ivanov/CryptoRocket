export default class Lock {
  private isAcquired: boolean = false;
  private queue: (() => void)[] = [];

  acquire(): Promise<void> {
    if(!this.isAcquired) {
      this.isAcquired = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  reset() {
    this.isAcquired = false;
    this.queue = [];
  }

  release(): void {
    if(this.queue.length > 0) {
      this.queue.shift()?.();
    } else {
      this.isAcquired = false;
    }
  }
}