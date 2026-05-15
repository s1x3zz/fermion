/**
 * Loads a minimal test circuit:
 *   Battery 9V → VCC rail → 330Ω resistor → LED (red) → GND rail
 *
 * Only call in DEV mode with ?test=1.
 */
export function loadTestCircuit(circuit) {
    // 9V source: positive terminal on vcc_top rail, negative implicit GND
    circuit.addComponent('battery_9v', 'vcc_top', 5);
    // Ground marker: ties gnd_top rail to node 0
    circuit.addComponent('ground', 'gnd_top', 5);
    // Resistor 330Ω at row e, cols 5-6
    circuit.addComponent('resistor', 'e', 5);
    // LED (red) at row e, cols 8-9 (anode=e:8, cathode=e:9)
    circuit.addComponent('led_red', 'e', 8);
    // Wires:
    // 1. VCC rail col 5 → resistor anode (e5)
    circuit.addWire({ row: 'vcc_top', col: 5 }, { row: 'e', col: 5 }, 'VCC_5V');
    // 2. Resistor cathode (e6) → LED anode (e8)
    circuit.addWire({ row: 'e', col: 6 }, { row: 'e', col: 8 }, 'DIGITAL');
    // 3. LED cathode (e9) → GND rail col 9
    circuit.addWire({ row: 'e', col: 9 }, { row: 'gnd_top', col: 9 }, 'GND');
}
//# sourceMappingURL=devTestCircuit.js.map