import { proxy } from 'comlink';
import { avrWorker } from './avrWorkerInstance';

class SerialMonitor {
  private lines: string[] = [];
  private maxLines = 500;
  private currentLine = '';
  private callbacks: ((lines: string[]) => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    await avrWorker.onSerialTransmit(proxy((value: number) => {
      const char = String.fromCharCode(value);
      if (char === '\n') {
        this.lines.push(this.currentLine);
        this.currentLine = '';
        if (this.lines.length > this.maxLines) {
          this.lines.shift();
        }
        this.notify();
      } else if (char !== '\r') {
        this.currentLine += char;
      }
    }));
  }

  getLines(): string[] {
    return [...this.lines, this.currentLine].filter(Boolean);
  }

  onLine(cb: (lines: string[]) => void): void {
    this.callbacks.push(cb);
  }

  clear(): void {
    this.lines = [];
    this.currentLine = '';
    this.notify();
  }

  private notify() {
    const data = this.getLines();
    for (const cb of this.callbacks) {
      cb(data);
    }
  }
}

export const serialMonitor = new SerialMonitor();
