import { CPU, AVRIOPort, AVRUSART, AVRADC } from 'avr8js';
type PinStates = {
    digital: Record<number, 0 | 1>;
    analog: Record<number, number>;
    pwm: Record<number, number>;
};
export declare class AvrWorker {
    cpu: CPU | null;
    portB: AVRIOPort | null;
    portC: AVRIOPort | null;
    portD: AVRIOPort | null;
    usart: AVRUSART | null;
    adc: AVRADC | null;
    running: boolean;
    pinStates: PinStates;
    onPinChangeCallback: ((states: PinStates) => void) | null;
    onSerialCallback: ((value: number) => void) | null;
    loadSketch(hex: string): void;
    onSerialTransmit(callback: (value: number) => void): void;
    start(): void;
    stop(): void;
    getPinStates(): PinStates;
    setPinInput(pin: number, value: number): void;
    onPinChange(callback: (states: PinStates) => void): void;
}
export {};
//# sourceMappingURL=avr.worker.d.ts.map