import { wrap } from 'comlink';
import type { AvrWorker } from '../workers/avr.worker';

const worker = new Worker(
  new URL('../workers/avr.worker.ts', import.meta.url),
  { type: 'module' }
);

export const avrWorker = wrap<AvrWorker>(worker);
