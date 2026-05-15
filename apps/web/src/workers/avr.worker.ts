import { expose } from 'comlink';
import {
  CPU,
  AVRIOPort,
  AVRUSART,
  AVRTimer,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config,
  AVRADC,
  adcConfig,
  PinState
} from 'avr8js';

type PinStates = {
  digital: Record<number, 0 | 1>;
  analog: Record<number, number>;
  pwm: Record<number, number>;
};

function parseHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(0x8000); // 32KB
  let maxAddress = 0;
  for (const line of hex.split('\n')) {
    if (line[0] !== ':') continue;
    const len = parseInt(line.substring(1, 3), 16);
    const addr = parseInt(line.substring(3, 7), 16);
    const type = parseInt(line.substring(7, 9), 16);
    if (type === 0) {
      for (let i = 0; i < len; i++) {
        bytes[addr + i] = parseInt(line.substring(9 + i * 2, 11 + i * 2), 16);
      }
      if (addr + len > maxAddress) maxAddress = addr + len;
    }
  }
  return bytes;
}

export class AvrWorker {
  cpu: CPU | null = null;
  portB: AVRIOPort | null = null;
  portC: AVRIOPort | null = null;
  portD: AVRIOPort | null = null;
  usart: AVRUSART | null = null;
  adc: AVRADC | null = null;
  
  running = false;
  pinStates: PinStates = { digital: {}, analog: {}, pwm: {} };
  onPinChangeCallback: ((states: PinStates) => void) | null = null;
  onSerialCallback: ((value: number) => void) | null = null;
  
  loadSketch(hex: string): void {
    const program = new Uint16Array(0x4000);
    const bytes = parseHex(hex);
    for (let i = 0; i < bytes.length; i += 2) {
      program[i / 2] = bytes[i]! | (bytes[i + 1]! << 8);
    }
    
    this.cpu = new CPU(program);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    
    // Add timers for PWM / delay
    new AVRTimer(this.cpu, timer0Config);
    new AVRTimer(this.cpu, timer1Config);
    new AVRTimer(this.cpu, timer2Config);
    
    this.usart = new AVRUSART(this.cpu, usart0Config, 16e6);
    this.adc = new AVRADC(this.cpu, adcConfig);
    
    const updatePinStates = () => {
      let changed = false;
      
      for (let i = 0; i < 8; i++) {
        const v = this.portD!.pinState(i) === PinState.High ? 1 : 0;
        if (this.pinStates.digital[i] !== v) {
          this.pinStates.digital[i] = v as 0 | 1;
          changed = true;
        }
      }
      for (let i = 0; i < 6; i++) {
        const v = this.portB!.pinState(i) === PinState.High ? 1 : 0;
        if (this.pinStates.digital[8 + i] !== v) {
          this.pinStates.digital[8 + i] = v as 0 | 1;
          changed = true;
        }
      }
      // Analog pins can act as digital too (A0 = 14)
      for (let i = 0; i < 6; i++) {
        const v = this.portC!.pinState(i) === PinState.High ? 1 : 0;
        if (this.pinStates.digital[14 + i] !== v) {
          this.pinStates.digital[14 + i] = v as 0 | 1;
          changed = true;
        }
      }
      
      if (changed && this.onPinChangeCallback) {
        this.onPinChangeCallback(this.pinStates);
      }
    };
    
    this.portB.addListener(updatePinStates);
    this.portC.addListener(updatePinStates);
    this.portD.addListener(updatePinStates);
    
    // Set up serial transmit hook
    this.usart.onByteTransmit = (value: number) => {
      if (this.onSerialCallback) {
        this.onSerialCallback(value);
      }
    };
  }
  
  onSerialTransmit(callback: (value: number) => void): void {
    this.onSerialCallback = callback;
  }
  
  start(): void {
    if (!this.cpu || this.running) return;
    this.running = true;
    
    // Run loop
    let cycles = 0;
    const runChunk = () => {
      if (!this.running || !this.cpu) return;
      const cpu = this.cpu;
      const targetCycles = cycles + 500000; // Run in chunks
      while (cpu.cycles < targetCycles) {
        cpu.tick();
      }
      cycles = cpu.cycles;
      setTimeout(runChunk, 0); // let event loop breathe
    };
    runChunk();
  }
  
  stop(): void {
    this.running = false;
  }
  
  getPinStates(): PinStates {
    return this.pinStates;
  }
  
  setPinInput(pin: number, value: number): void {
    if (!this.portB || !this.portC || !this.portD) return;
    const isHigh = value > 0;
    if (pin >= 0 && pin <= 7) {
      this.portD.setPin(pin, isHigh);
    } else if (pin >= 8 && pin <= 13) {
      this.portB.setPin(pin - 8, isHigh);
    } else if (pin >= 14 && pin <= 19) {
      this.portC.setPin(pin - 14, isHigh);
      if (this.adc) {
        // also set analog ADC input for A0-A5
        this.adc.channelValues[pin - 14] = value * 1023 / 5; // Assuming value is 0-5V
      }
    }
  }
  
  onPinChange(callback: (states: PinStates) => void): void {
    this.onPinChangeCallback = callback;
  }
}

expose(new AvrWorker());
