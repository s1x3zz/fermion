import { proxy } from 'comlink';
import { avrWorker } from './avrWorkerInstance';
class SerialMonitor {
    lines = [];
    maxLines = 500;
    currentLine = '';
    callbacks = [];
    constructor() {
        this.init();
    }
    async init() {
        await avrWorker.onSerialTransmit(proxy((value) => {
            const char = String.fromCharCode(value);
            if (char === '\n') {
                this.lines.push(this.currentLine);
                this.currentLine = '';
                if (this.lines.length > this.maxLines) {
                    this.lines.shift();
                }
                this.notify();
            }
            else if (char !== '\r') {
                this.currentLine += char;
            }
        }));
    }
    getLines() {
        return [...this.lines, this.currentLine].filter(Boolean);
    }
    onLine(cb) {
        this.callbacks.push(cb);
    }
    clear() {
        this.lines = [];
        this.currentLine = '';
        this.notify();
    }
    notify() {
        const data = this.getLines();
        for (const cb of this.callbacks) {
            cb(data);
        }
    }
}
export const serialMonitor = new SerialMonitor();
//# sourceMappingURL=serialMonitor.js.map