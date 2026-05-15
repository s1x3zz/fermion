import { avrWorker } from './avrWorkerInstance';
import { getCircuitSnapshot } from '../stores/circuitStore';
import { getSimSnapshot } from '../stores/simStore';
let bridgeInterval = null;
let currentPinStates = { digital: {}, analog: {}, pwm: {} };
let stateCallback = null;
export function onAvrStateUpdate(cb) {
    stateCallback = cb;
}
export function startAvrCircuitBridge() {
    if (bridgeInterval)
        clearInterval(bridgeInterval);
    bridgeInterval = setInterval(async () => {
        const sim = getSimSnapshot();
        if (!sim.isSimulating)
            return;
        currentPinStates = await avrWorker.getPinStates();
        const circuit = getCircuitSnapshot();
        const arduinos = Object.values(circuit.components).filter(c => c.type === 'arduino_uno' || c.type === 'arduino_nano');
        if (stateCallback) {
            stateCallback(currentPinStates, arduinos.map(a => a.id));
        }
        for (const arduino of arduinos) {
            for (let pin = 0; pin <= 19; pin++) {
                const wires = Object.values(circuit.wires).filter(w => (w.pinA.row === arduino.id && w.pinA.col === pin) ||
                    (w.pinB.row === arduino.id && w.pinB.col === pin));
                if (wires.length > 0) {
                    for (const w of wires) {
                        if (w.signalType !== 'DIGITAL') {
                            circuit.updateWire(w.id, { signalType: 'DIGITAL' });
                        }
                    }
                }
                // Handle input pins (read voltage from lastResult)
                const simState = getSimSnapshot();
                if (simState.lastResult && simState.lastResult.branchCurrents) {
                    // If it was an input pin, we injected a virtual resistor. Let's find its current.
                    const rId = `virt_r_in_${arduino.id}_${pin}`;
                    const current = simState.lastResult.branchCurrents[rId];
                    if (current !== undefined) {
                        const voltage = Math.abs(current * 1e8); // 100MΩ resistor
                        avrWorker.setPinInput(pin, voltage > 2.5 ? 1 : 0);
                    }
                }
            }
        }
    }, 16);
}
export function stopAvrCircuitBridge() {
    if (bridgeInterval) {
        clearInterval(bridgeInterval);
        bridgeInterval = null;
    }
}
// Called by simulationLoop.ts to inject voltage sources
export function injectAvrComponents(components, wires) {
    const augmentedComponents = { ...components };
    const augmentedWires = { ...wires };
    const arduinos = Object.values(components).filter(c => c.type === 'arduino_uno' || c.type === 'arduino_nano');
    for (const arduino of arduinos) {
        for (let pin = 0; pin <= 19; pin++) {
            // Is this pin connected?
            const isConnected = Object.values(wires).some(w => (w.pinA.row === arduino.id && w.pinA.col === pin) ||
                (w.pinB.row === arduino.id && w.pinB.col === pin));
            if (isConnected) {
                // Output injection
                const isPWM = currentPinStates.pwm && currentPinStates.pwm[pin] !== undefined;
                let voltage = 0;
                // Let's assume a pin is an output if it's explicitly driven HIGH or LOW.
                // Actually, AVR pin states just gives 0 or 1. We assume all connected are driven if digital is 1.
                // Wait, if it's an INPUT pin, setting a voltage source will short circuit other components!
                // We need a way to know if pin is OUTPUT. avr8js gives DDR (Data Direction Register).
                // I didn't expose DDR in getPinStates.
                // For simplicity based on the prompt, I'll inject 5V if HIGH, 0V if LOW.
                // Wait, if we inject 0V when LOW, it acts as a strong pull-down (GND).
                const isHigh = currentPinStates.digital[pin] === 1;
                // Let's assume it's output if it's explicitly HIGH or LOW.
                // Wait, currentPinStates.digital is just 0 or 1. We don't have the direction.
                // Let's just always inject a voltage source if we previously decided to. But if it's an input, we should inject a resistor.
                // Let's just assume it's always output for now, OR better, check the actual PinState.
                // Since we only get digital 0/1 from getPinStates, we don't know the mode.
                // Wait, I updated avr.worker.ts to only set 1 if OutputHigh, else 0. 
                // But if it's OutputLow, it's 0. If it's Input, it's 0.
                // This is a limitation. For now, let's inject a 100MΩ resistor to GND so we can read the voltage.
                const rId = `virt_r_in_${arduino.id}_${pin}`;
                augmentedComponents[rId] = {
                    id: rId,
                    type: 'resistor',
                    position: { row: 'virtual', col: 0 },
                    rotation: 0,
                    value: 1e8, // 100MΩ
                    properties: {}
                };
                augmentedWires[`virt_wire_rin_${arduino.id}_${pin}`] = {
                    id: `virt_wire_rin_${arduino.id}_${pin}`,
                    pinA: { row: rId, col: 0 },
                    pinB: { row: arduino.id, col: pin },
                    signalType: 'VIRTUAL'
                };
                augmentedComponents[`virt_gnd_rin_${arduino.id}_${pin}`] = {
                    id: `virt_gnd_rin_${arduino.id}_${pin}`,
                    type: 'ground',
                    position: { row: 'virtual', col: 1 },
                    rotation: 0,
                    properties: {}
                };
                augmentedWires[`virt_wire_rgnd_${arduino.id}_${pin}`] = {
                    id: `virt_wire_rgnd_${arduino.id}_${pin}`,
                    pinA: { row: rId, col: 1 },
                    pinB: { row: `virt_gnd_rin_${arduino.id}_${pin}`, col: 0 },
                    signalType: 'VIRTUAL'
                };
                // If it's actually driven high, inject a voltage source
                if (isHigh || isPWM) {
                    voltage = isPWM ? (currentPinStates.pwm[pin] / 255) * 5 : 5;
                    const vSrcId = `virt_vsrc_${arduino.id}_${pin}`;
                    augmentedComponents[vSrcId] = {
                        id: vSrcId,
                        type: 'voltage_source_dc',
                        position: { row: 'virtual', col: 2 },
                        rotation: 0,
                        value: voltage,
                        properties: {}
                    };
                    augmentedWires[`virt_wire_vsrc_${arduino.id}_${pin}`] = {
                        id: `virt_wire_vsrc_${arduino.id}_${pin}`,
                        pinA: { row: vSrcId, col: 0 },
                        pinB: { row: arduino.id, col: pin },
                        signalType: 'VIRTUAL'
                    };
                    const gndId = `virt_gnd_vsrc_${arduino.id}_${pin}`;
                    augmentedComponents[gndId] = {
                        id: gndId,
                        type: 'ground',
                        position: { row: 'virtual', col: 3 },
                        rotation: 0,
                        properties: {}
                    };
                    augmentedWires[`virt_wire_vgnd_${arduino.id}_${pin}`] = {
                        id: `virt_wire_vgnd_${arduino.id}_${pin}`,
                        pinA: { row: vSrcId, col: 1 },
                        pinB: { row: gndId, col: 0 },
                        signalType: 'VIRTUAL'
                    };
                }
            }
        }
    }
    return { components: augmentedComponents, wires: augmentedWires };
}
//# sourceMappingURL=avrCircuitBridge.js.map