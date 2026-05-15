import { createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import { avrWorker } from '../../lib/avrWorkerInstance';
import { serialMonitor } from '../../lib/serialMonitor';
import { PRECOMPILED_SKETCHES } from '../../lib/precompiledSketches';
import { startAvrCircuitBridge, stopAvrCircuitBridge } from '../../lib/avrCircuitBridge';
import './sketch-editor.css';

interface SketchEditorProps {
  onClose: () => void;
  componentId: string;
}

const TEMPLATE = `void setup() {
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

export function SketchEditor(props: SketchEditorProps) {
  const [sketch, setSketch] = createSignal(TEMPLATE);
  const [selectedHex, setSelectedHex] = createSignal<string>(Object.keys(PRECOMPILED_SKETCHES)[0]!);
  const [isRunning, setIsRunning] = createSignal(false);
  const [lines, setLines] = createSignal<string[]>([]);
  
  onMount(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose() };
    document.addEventListener('keydown', onKey);
    
    // Subscribe to serial monitor
    const updateSerial = (newLines: string[]) => setLines([...newLines]);
    serialMonitor.onLine(updateSerial);
    setLines(serialMonitor.getLines());
    
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });
  
  const handleCompileUpload = async () => {
    const hexBase64 = PRECOMPILED_SKETCHES[selectedHex()];
    if (hexBase64) {
      const hex = atob(hexBase64);
      await avrWorker.loadSketch(hex);
      if (isRunning()) {
        await avrWorker.start();
      }
    }
  };

  const handleRunStop = async () => {
    if (isRunning()) {
      await avrWorker.stop();
      stopAvrCircuitBridge();
      setIsRunning(false);
    } else {
      await avrWorker.start();
      startAvrCircuitBridge();
      setIsRunning(true);
    }
  };

  return (
    <Portal mount={document.body}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="sketch-modal" onClick={(e) => e.stopPropagation()}>
          <div class="sketch-header">
            <h2>Arduino Sketch: {props.componentId}</h2>
            <div class="sketch-actions">
              <select 
                class="sketch-select"
                value={selectedHex()} 
                onInput={(e) => setSelectedHex(e.currentTarget.value)}
              >
                <For each={Object.keys(PRECOMPILED_SKETCHES)}>
                  {(name) => <option value={name}>{name}</option>}
                </For>
              </select>
              <button class="sketch-btn upload-btn" onClick={handleCompileUpload}>Compile & Upload</button>
              <button class={`sketch-btn ${isRunning() ? 'stop-btn' : 'run-btn'}`} onClick={handleRunStop}>
                {isRunning() ? 'Stop AVR' : 'Run AVR'}
              </button>
              <button class="sketch-close" onClick={props.onClose}>✕</button>
            </div>
          </div>
          
          <div class="sketch-body">
            <div class="editor-area">
              <textarea 
                class="sketch-textarea" 
                value={sketch()} 
                onInput={(e) => setSketch(e.currentTarget.value)}
                spellcheck={false}
              />
            </div>
            
            <div class="serial-panel">
              <div class="serial-header">
                <span>Serial Monitor</span>
                <button class="sketch-btn clear-btn" onClick={() => serialMonitor.clear()}>Clear</button>
              </div>
              <div class="serial-output">
                <For each={lines()}>
                  {(line) => <div class="serial-line">{line}</div>}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
