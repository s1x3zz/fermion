import {
  Scene,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh,
  Vector3,
  Color,
} from 'three';
import type { PlacedComponent } from '@fermion/core';
import type { Breadboard } from '../Breadboard';
import { ComponentMesh } from './ComponentMesh';

export class ArduinoMesh extends ComponentMesh {
  public ledL!: Mesh;
  public ledON!: Mesh;
  public ledTX!: Mesh;
  public ledRX!: Mesh;
  
  private isNano: boolean;
  private pinPositions: Map<number | string, Vector3> = new Map();

  constructor(scene: Scene, instance: PlacedComponent) {
    super(scene, instance);
    this.isNano = instance.type === 'arduino_nano';
    this._build();
  }

  private _build(): void {
    const scale = this.isNano ? 0.7 : 1.0;
    
    // Base PCB
    const pcbGeo = new BoxGeometry(5.4 * scale, 0.12, 6.8 * scale);
    const pcbMat = new MeshStandardMaterial({
      color: new Color('#1a5c1a'),
      roughness: 0.7,
    });
    const pcb = new Mesh(pcbGeo, pcbMat);
    pcb.position.y = 0.06;
    this.group.add(pcb);

    // USB port
    const usbGeo = new BoxGeometry(0.6 * scale, 0.35, 0.9 * scale);
    const usbMat = new MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const usb = new Mesh(usbGeo, usbMat);
    usb.position.set(-1.5 * scale, 0.235, -3.4 * scale + 0.45 * scale);
    this.group.add(usb);

    // Power jack
    const pwrGeo = new CylinderGeometry(0.2 * scale, 0.2 * scale, 0.5 * scale, 12);
    pwrGeo.rotateX(Math.PI / 2);
    const pwrMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const pwr = new Mesh(pwrGeo, pwrMat);
    pwr.position.set(1.5 * scale, 0.2, -3.4 * scale + 0.25 * scale);
    this.group.add(pwr);

    // MCU chip
    const mcuGeo = new BoxGeometry(0.8 * scale, 0.15, 0.8 * scale);
    const mcuMat = new MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const mcu = new Mesh(mcuGeo, mcuMat);
    mcu.position.set(0, 0.195, 0);
    this.group.add(mcu);

    // Status LEDs
    const ledGeo = new SphereGeometry(0.05 * scale);
    
    this.ledL = new Mesh(ledGeo, new MeshBasicMaterial({ color: 0x000000 }));
    this.ledL.position.set(-0.8 * scale, 0.15, -2.5 * scale);
    this.group.add(this.ledL);

    this.ledON = new Mesh(ledGeo, new MeshBasicMaterial({ color: 0x00ff00 })); // Always ON when powered
    this.ledON.position.set(-1.0 * scale, 0.15, -2.5 * scale);
    this.group.add(this.ledON);

    this.ledTX = new Mesh(ledGeo, new MeshBasicMaterial({ color: 0x000000 }));
    this.ledTX.position.set(-1.2 * scale, 0.15, -2.5 * scale);
    this.group.add(this.ledTX);

    this.ledRX = new Mesh(ledGeo, new MeshBasicMaterial({ color: 0x000000 }));
    this.ledRX.position.set(-1.4 * scale, 0.15, -2.5 * scale);
    this.group.add(this.ledRX);

    // Pin headers
    const headerMat = new MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const pinGeo = new CylinderGeometry(0.04 * scale, 0.04 * scale, 0.3, 8);
    const pinMat = new MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 });

    const createHeaderRow = (count: number, startX: number, startZ: number, spacing: number, pinOffset: number, isAnalog = false) => {
      const rowLen = count * spacing;
      const headerGeo = new BoxGeometry(0.2 * scale, 0.2, rowLen);
      const header = new Mesh(headerGeo, headerMat);
      header.position.set(startX, 0.22, startZ + rowLen / 2 - spacing / 2);
      this.group.add(header);

      for (let i = 0; i < count; i++) {
        const pin = new Mesh(pinGeo, pinMat);
        const pX = startX;
        const pZ = startZ + i * spacing;
        pin.position.set(pX, 0.37, pZ);
        this.group.add(pin);
        
        // Store relative pin position
        const pinId = isAnalog ? (14 + i) : (pinOffset + i);
        this.pinPositions.set(pinId, new Vector3(pX, 0.52, pZ));
      }
    };

    // Digital pins (0-13)
    createHeaderRow(14, -2.5 * scale, -2.0 * scale, 0.254 * scale, 0);
    // Analog pins (A0-A5)
    createHeaderRow(6, 2.5 * scale, 0.5 * scale, 0.254 * scale, 0, true);
    // Power pins
    createHeaderRow(6, 2.5 * scale, -1.5 * scale, 0.254 * scale, -6);
  }

  override setPosition(board: Breadboard): void {
    // For Arduino, just float it beside the board
    const leftEdge = board.getPinPosition('a', 1);
    this.group.position.set(leftEdge.x - 4, 0, 0);
  }

  public getPinHeaderPosition(pin: number | string): Vector3 | null {
    const localPos = this.pinPositions.get(pin);
    if (!localPos) return null;
    
    // Convert to world position
    const worldPos = new Vector3();
    this.group.localToWorld(worldPos.copy(localPos));
    return worldPos;
  }

  public setLedState(led: 'L' | 'TX' | 'RX', state: boolean) {
    const mesh = this[`led${led}`];
    if (mesh) {
      (mesh.material as MeshBasicMaterial).color.setHex(state ? (led === 'L' ? 0xffff00 : 0xffa500) : 0x000000);
    }
  }

  public getAllPins(): { pin: number, pos: Vector3 }[] {
    const pins: { pin: number, pos: Vector3 }[] = [];
    for (const [pin, localPos] of this.pinPositions.entries()) {
      if (typeof pin === 'number') {
        const worldPos = new Vector3();
        this.group.localToWorld(worldPos.copy(localPos));
        pins.push({ pin, pos: worldPos });
      }
    }
    return pins;
  }
}
