import { wrap } from 'comlink';
const worker = new Worker(new URL('../workers/avr.worker.ts', import.meta.url), { type: 'module' });
export const avrWorker = wrap(worker);
//# sourceMappingURL=avrWorkerInstance.js.map