import { createSignal, createEffect, onMount, onCleanup, Show } from 'solid-js'
import { useSearchParams, useNavigate } from '@solidjs/router'
import type { CameraController } from '@fermion/renderer'
import type { SceneAPI } from '../scene/Scene'
import { Scene } from '../scene/Scene'
import { Toolbar } from '../components/sim/Toolbar'
import { ComponentSidebar } from '../components/sim/ComponentSidebar'
import { Inspector } from '../components/sim/Inspector'
import { StatusBar } from '../components/sim/StatusBar'
import { ToastContainer, toast } from '../components/ui/Toast'
import { SaveModal } from '../components/ui/SaveModal'
import { UpgradeModal } from '../components/ui/UpgradeModal'
import { SketchEditor } from '../components/sim/SketchEditor'
import { useSimStore } from '../stores/simStore'
import { useProjectStore, ProjectLimitError } from '../stores/projectStore'
import { useAuthStore } from '../stores/authStore'
import { useCircuitStore } from '../stores/circuitStore'
import { startSimulationLoop, stopSimulationLoop } from '../lib/simulationLoop'
import { startAutosave, stopAutosave } from '../lib/autosave'
import { serializeCircuit, deserializeCircuit, CURRENT_VERSION } from '@fermion/core'
import { onAvrStateUpdate } from '../lib/avrCircuitBridge'
import type { UserTier, PinPosition, FermionProject } from '@fermion/core'
import './simulator.css'

export default function Simulator() {
  const [searchParams] = useSearchParams<{ project?: string }>()
  const navigate = useNavigate()
  const sim = useSimStore()
  const project = useProjectStore()
  const auth = useAuthStore()
  const circuit = useCircuitStore()

  const [sceneApiSig, setSceneApiSig] = createSignal<SceneAPI | null>(null)
  const [controller, setController] = createSignal<CameraController | null>(null)
  const [radius, setRadius] = createSignal(14.4)
  const [isDirty, setIsDirty] = createSignal(false)
  const [showSaveModal, setShowSaveModal] = createSignal(false)
  const [showDraftBanner, setShowDraftBanner] = createSignal(false)
  const [showUpgradeModal, setShowUpgradeModal] = createSignal(false)
  const [sketchEditorTarget, setSketchEditorTarget] = createSignal<string | null>(null)
  const [pendingDraftCircuit, setPendingDraftCircuit] = createSignal<
    import('@fermion/core').BreadboardCircuit | null
  >(null)
  const [pendingCircuitLoad, setPendingCircuitLoad] = createSignal<{
    components: Record<string, import('@fermion/core').PlacedComponent>
    wires: Record<string, import('@fermion/core').PlacedWire>
  } | null>(null)

  const userTier = (): UserTier => {
    const u = auth.user()
    if (!u) return 'guest'
    return (u.user_metadata?.tier as UserTier) ?? 'free'
  }

  // ── Load circuit into scene when API becomes ready ───────────────────────────

  createEffect(() => {
    const api = sceneApiSig()
    const load = pendingCircuitLoad()
    if (api && load) {
      api.loadCircuit(load.components, load.wires)
      setPendingCircuitLoad(null)
    }
  })

  // ── Sync selection to 3D scene ────────────────────────────────────────────────

  createEffect(() => { sceneApiSig()?.setSelectedComponent(sim.selectedComponentId()) })
  createEffect(() => { sceneApiSig()?.setSelectedWire(sim.selectedWireId()) })

  createEffect(() => {
    onAvrStateUpdate((states, arduinos) => {
      const api = sceneApiSig()
      if (api) {
        arduinos.forEach(id => api.updateAvrLeds(id, states))
      }
    })
  })

  // ── Start / stop simulation loop ─────────────────────────────────────────────

  createEffect(() => {
    if (sim.isSimulating()) {
      startSimulationLoop({
        getComponents: () => circuit.components(),
        getWires: () => circuit.wires(),
        onWireCurrentUpdate: (wireId, current) => sceneApiSig()?.updateWireCurrent(wireId, current),
        onComponentGlow: (compId, isOn, current) => sceneApiSig()?.updateComponentGlow(compId, isOn, current),
      })
    } else {
      stopSimulationLoop()
      sceneApiSig()?.resetGlow()
    }
  })

  // ── Mount: load project / check draft / dev test ──────────────────────────────

  onMount(async () => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const pid = searchParams.project
    if (pid) {
      const p = await project.loadProject(pid)
      if (!p) {
        toast.error('Project not found')
        void navigate('/dashboard')
        return
      }
      const { components: comps, wires: ws } = deserializeCircuit(p.circuit)
      circuit.loadFromData(comps, ws)
      setPendingCircuitLoad({ components: comps, wires: ws })
    } else {
      // Check for autosave draft
      const draft = await project.loadDraft()
      if (draft && (draft.circuit.components.length > 0 || draft.circuit.wires.length > 0)) {
        setPendingDraftCircuit(draft.circuit)
        setShowDraftBanner(true)
      }
    }

    // Dev test circuit
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('test') === '1') {
      const { loadTestCircuit } = await import('../lib/devTestCircuit')
      loadTestCircuit(circuit)
    }

    // Start autosave
    startAutosave({
      getComponents: () => circuit.components(),
      getWires: () => circuit.wires(),
      getActiveProject: () => project.activeProject(),
      onDirtyChange: setIsDirty,
      onAutosaved: () => { /* toast.info('Auto-saved') — too noisy, skip */ },
    })
  })

  onCleanup(() => {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    stopSimulationLoop()
    stopAutosave()
  })

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  onMount(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        void handleSave()
        return
      }

      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        const id = sim.selectedComponentId()
        if (id) {
          const comp = circuit.components()[id]
          if (comp?.type.startsWith('arduino_')) {
            handleOpenSketch(id)
          }
        }
        return
      }

      if (isInput) return

      if (e.key === ' ') { e.preventDefault(); sim.toggleSimulate(); return }
      if (e.key === 'Escape') { sceneApiSig()?.cancelWiring(); sim.deselect(); return }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const compId = sim.selectedComponentId()
        if (compId) {
          sceneApiSig()?.removeComponent(compId)
          circuit.removeComponent(compId)
          sim.deselect()
        } else {
          const wireId = sim.selectedWireId()
          if (wireId) {
            sceneApiSig()?.removeWire(wireId)
            circuit.removeWire(wireId)
            sim.deselect()
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    onCleanup(() => window.removeEventListener('keydown', onKeyDown))
  })

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    const active = project.activeProject()
    const serialized = serializeCircuit(circuit.components(), circuit.wires())
    const thumb = sceneApiSig()?.captureThumb()

    if (!active) {
      setShowSaveModal(true)
      return
    }

    const updated: FermionProject = {
      ...active,
      circuit: serialized,
      updatedAt: Date.now(),
      metadata: {
        componentCount: serialized.components.length,
        wireCount: serialized.wires.length,
        simulatorVersion: CURRENT_VERSION,
      },
      ...(thumb !== undefined ? { thumbnail: thumb } : {}),
    }
    try {
      await project.saveProject(updated)
      setIsDirty(false)
      toast.success('Saved')
    } catch {
      toast.error('Save failed')
    }
  }

  async function handleSaveWithName(name: string) {
    const serialized = serializeCircuit(circuit.components(), circuit.wires())
    const thumb = sceneApiSig()?.captureThumb()

    try {
      const p = await project.createProject(name)
      const updated: FermionProject = {
        ...p,
        circuit: serialized,
        metadata: {
          componentCount: serialized.components.length,
          wireCount: serialized.wires.length,
          simulatorVersion: CURRENT_VERSION,
        },
        ...(thumb !== undefined ? { thumbnail: thumb } : {}),
      }
      await project.saveProject(updated)
      await project.clearDraft()
      setIsDirty(false)
      setShowSaveModal(false)
      toast.success(`"${name}" saved`)
    } catch (err) {
      if (err instanceof ProjectLimitError) {
        toast.error(`Project limit reached (max ${err.limit})`)
      } else {
        toast.error('Save failed')
      }
    }
  }

  function handleRestoreDraft() {
    const draftCircuit = pendingDraftCircuit()
    if (!draftCircuit) return
    const { components: comps, wires: ws } = deserializeCircuit(draftCircuit)
    circuit.loadFromData(comps, ws)
    setPendingCircuitLoad({ components: comps, wires: ws })
    setPendingDraftCircuit(null)
    setShowDraftBanner(false)
    toast.success('Draft restored')
  }

  async function handleDiscardDraft() {
    await project.clearDraft()
    setPendingDraftCircuit(null)
    setShowDraftBanner(false)
  }

  function handleFrame(info: { fps: number; radius: number }) {
    setRadius(info.radius)
    sim.updateFps(info.fps)
  }

  function handleCursorMove(x: number, z: number) {
    sim.updateCursor(x, z)
  }

  function handleComponentPlace(type: string, row: string, col: number): string {
    const id = circuit.addComponent(type as import('@fermion/core').ComponentType, row, col)
    setIsDirty(true)
    return id
  }

  function handleComponentSelect(id: string | null) {
    if (id) sim.selectComponent(id)
    else sim.deselect()
  }

  function handleWireCreate(pinA: PinPosition, pinB: PinPosition, signalType: string): string {
    const id = circuit.addWire(pinA, pinB, signalType)
    setIsDirty(true)
    return id
  }

  function handleWireSelect(id: string | null) {
    if (id) sim.selectWire(id)
    else sim.deselect()
  }

  function handleDeleteSelected() {
    const compId = sim.selectedComponentId()
    if (compId) {
      sceneApiSig()?.removeComponent(compId)
      circuit.removeComponent(compId)
      sim.deselect()
      return
    }
    const wireId = sim.selectedWireId()
    if (wireId) {
      sceneApiSig()?.removeWire(wireId)
      circuit.removeWire(wireId)
      sim.deselect()
    }
  }

  function handleOpenSketch(id: string) {
    if (userTier() === 'pro' || userTier() === 'team') {
      setSketchEditorTarget(id)
    } else {
      setShowUpgradeModal(true)
    }
  }

  return (
    <div class="sim-layout">
      <Toolbar
        controller={controller}
        radius={radius}
        isDirty={isDirty}
        onSave={handleSave}
      />

      <ComponentSidebar userTier={userTier} onUpgradePrompt={() => setShowUpgradeModal(true)} />

      <div class="sim-canvas-cell">
        {/* Draft restore banner */}
        <Show when={showDraftBanner()}>
          <div class="draft-banner">
            <span>You have an unsaved draft. Restore it?</span>
            <button class="draft-btn-restore" onClick={handleRestoreDraft}>Restore</button>
            <button class="draft-btn-discard" onClick={() => void handleDiscardDraft()}>Discard</button>
          </div>
        </Show>

        <Scene
          onControllerReady={setController}
          onFrame={handleFrame}
          onCursorMove={handleCursorMove}
          isSimulating={sim.isSimulating}
          onSceneReady={setSceneApiSig}
          onComponentPlace={handleComponentPlace}
          onComponentSelect={handleComponentSelect}
          isOccupied={circuit.isOccupied}
          onWireCreate={handleWireCreate}
          onWireSelect={handleWireSelect}
        />
      </div>

      <Inspector onDeleteSelected={handleDeleteSelected} onOpenSketch={handleOpenSketch} />
      <StatusBar />

      {/* Modals + toasts */}
      <Show when={showSaveModal()}>
        <SaveModal
          onSave={handleSaveWithName}
          onCancel={() => setShowSaveModal(false)}
        />
      </Show>

      <Show when={showUpgradeModal()}>
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      </Show>

      <Show when={sketchEditorTarget()}>
        {(id) => <SketchEditor componentId={id()} onClose={() => setSketchEditorTarget(null)} />}
      </Show>

      <ToastContainer />
    </div>
  )
}
