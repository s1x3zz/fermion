import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { A, useSearchParams, useNavigate } from '@solidjs/router'
import { useAuthStore } from '../stores/authStore'
import { AuthModal } from '../components/AuthModal'
import './landing.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  'Real-time MNA solver',
  'Arduino emulation',
  '3D breadboard',
  'Drag & drop',
  'Export KiCad',
  'Web-based',
  'No install',
  'SPICE engine',
  'Offline PWA',
]

interface Plan {
  name: string
  price: string
  originalPrice?: string
  period: string
  features: string[]
  featured: boolean
  cta: string
  tag: string
}

const PLANS: Plan[] = [
  {
    name: 'No login',
    price: '$0',
    period: '/mo',
    features: ['Basic components', '1 project', 'No graphs'],
    featured: false,
    cta: 'Try now',
    tag: 'GUEST',
  },
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    features: ['General components', '5 projects', 'No graphs'],
    featured: false,
    cta: 'Sign up free',
    tag: 'STARTER',
  },
  {
    name: 'Pro',
    price: '$12',
    originalPrice: '$15',
    period: '/mo',
    features: ['All components', 'Unlimited projects', 'Graphs + tables', 'Export Gerber / KiCad'],
    featured: true,
    cta: 'Start Pro',
    tag: 'MOST POPULAR',
  },
  {
    name: 'Team / Education',
    price: '$5',
    period: '/mo',
    features: ['20 projects', 'Custom libraries', 'Graphs + tables', 'Team management'],
    featured: false,
    cta: 'Contact us',
    tag: 'TEAM',
  },
]

const TESTIMONIALS = [
  {
    quote:
      "The most elegant circuit simulator I've ever used. MNA solving in real-time is basically witchcraft.",
    author: 'Alex Chen',
    role: 'Senior Hardware Engineer · Google',
    initials: 'AC',
  },
  {
    quote:
      "Finally replaced LTspice for rapid prototyping. The 3D PCB view alone justifies the switch.",
    author: 'María García',
    role: 'RF Engineer · SpaceX',
    initials: 'MG',
  },
  {
    quote: 'My students went from zero to working simulations in a single session.',
    author: 'Prof. James Liu',
    role: 'EECS · MIT',
    initials: 'JL',
  },
]

const truncate = (s: string, max = 22) => (s.length > max ? s.slice(0, max - 1) + '…' : s)

// Highlighted Arduino code (safe static string — no user input)
const CODE_HTML =
  '<span class="ck">void</span> <span class="cf">setup</span>() {\n' +
  '  <span class="cf">pinMode</span>(<span class="cn">13</span>, <span class="cc">OUTPUT</span>);\n' +
  '}\n\n' +
  '<span class="ck">void</span> <span class="cf">loop</span>() {\n' +
  '  <span class="cf">digitalWrite</span>(<span class="cn">13</span>, <span class="cc">HIGH</span>);<span class="cursor">█</span>\n' +
  '  <span class="cf">delay</span>(<span class="cn">500</span>);\n' +
  '  <span class="cf">digitalWrite</span>(<span class="cn">13</span>, <span class="cc">LOW</span>);\n' +
  '  <span class="cf">delay</span>(<span class="cn">500</span>);\n' +
  '}'

// ── IntersectionObserver hook ─────────────────────────────────────────────────

function useRevealObserver() {
  onMount(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    onCleanup(() => io.disconnect())
  })
}

// ── PCB trace network canvas (hero background) ────────────────────────────────

function ParticleCanvas() {
  let canvas!: HTMLCanvasElement
  let animId = 0
  let mx = -9999, my = -9999
  let rmCleanup = () => {}

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    const nodes: { x: number; y: number; vx: number; vy: number }[] = []
    const pulses: { a: number; b: number; t: number; spd: number }[] = []
    let lastPulse = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    for (let i = 0; i < 40; i++)
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      })

    const onResize = () => resize()
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('mousemove', onMouse, { passive: true })
    rmCleanup = () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
    }

    function draw(time: number) {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const n of nodes) {
        n.x = (n.x + n.vx + W) % W
        n.y = (n.y + n.vy + H) % H
      }

      // Build connection list — 40 nodes → max 780 pairs, fast
      const conns: { i: number; j: number; d: number }[] = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const ni = nodes[i]!, nj = nodes[j]!
          const dx = ni.x - nj.x, dy = ni.y - nj.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 150) conns.push({ i, j, d })
        }
      }

      // Dim trace lines
      for (const c of conns) {
        const ni = nodes[c.i]!, nj = nodes[c.j]!
        ctx.beginPath()
        ctx.moveTo(ni.x, ni.y)
        ctx.lineTo(nj.x, nj.y)
        ctx.strokeStyle = `rgba(28,28,54,${((1 - c.d / 150) * 0.88).toFixed(3)})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Spawn a new pulse every 3s along a random connection
      if (time - lastPulse > 3000 && conns.length > 0) {
        lastPulse = time
        const c = conns[Math.floor(Math.random() * conns.length)]!
        pulses.push({ a: c.i, b: c.j, t: 0, spd: 0.007 + Math.random() * 0.005 })
      }

      // Animate pulses — bright trace line + traveling dot
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p]!
        pulse.t += pulse.spd
        if (pulse.t >= 1) { pulses.splice(p, 1); continue }
        const na = nodes[pulse.a]!, nb = nodes[pulse.b]!
        const dx = na.x - nb.x, dy = na.y - nb.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d >= 150) { pulses.splice(p, 1); continue }
        const fade = 1 - d / 150

        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `rgba(59,139,255,${(fade * 0.55).toFixed(3)})`
        ctx.lineWidth = 1.4
        ctx.stroke()

        const px = na.x + (nb.x - na.x) * pulse.t
        const py = na.y + (nb.y - na.y) * pulse.t
        ctx.beginPath()
        ctx.arc(px, py, 3.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,139,255,0.92)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,139,255,0.16)'
        ctx.fill()
      }

      // Nodes — glow on mouse proximity (<100px)
      for (const n of nodes) {
        const dx = n.x - mx, dy = n.y - my
        const proximity = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 100)
        const r = 1.8 + proximity * 2.8
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = proximity > 0.05
          ? `rgba(59,139,255,${(0.25 + proximity * 0.65).toFixed(3)})`
          : 'rgba(30,30,62,0.45)'
        ctx.fill()
        if (proximity > 0.28) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(59,139,255,${(proximity * 0.18).toFixed(3)})`
          ctx.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
  })

  onCleanup(() => {
    cancelAnimationFrame(animId)
    rmCleanup()
  })

  return <canvas ref={canvas} class="hero-canvas" />
}

// ── Dot-wave canvas (features section background) ─────────────────────────────

function DotWaveCanvas() {
  let canvas!: HTMLCanvasElement
  let animId = 0
  let rmResize = () => {}

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    const SPACING = 30

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize, { passive: true })
    rmResize = () => window.removeEventListener('resize', onResize)

    function draw(time: number) {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2
      const cols = Math.ceil(W / SPACING) + 2
      const rows = Math.ceil(H / SPACING) + 2
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING, y = r * SPACING
          const ddx = x - cx, ddy = y - cy
          const dist = Math.sqrt(ddx * ddx + ddy * ddy)
          const wave = Math.sin(dist * 0.042 - time * 0.0009) * 0.5 + 0.5
          ctx.beginPath()
          ctx.arc(x, y, 1.3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(59,139,255,${(0.12 + wave * 0.28).toFixed(3)})`
          ctx.fill()
        }
      }
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
  })

  onCleanup(() => {
    cancelAnimationFrame(animId)
    rmResize()
  })

  return <canvas ref={canvas} class="features-bg-canvas" />
}

// ── Sine-wave canvas (pricing section background) ─────────────────────────────

function PricingWaveCanvas() {
  let canvas!: HTMLCanvasElement
  let animId = 0
  let rmResize = () => {}

  const WAVES = [
    { freq: 0.0055, amp: 32, spd: 0.00025, yR: 0.3 },
    { freq: 0.0085, amp: 22, spd: 0.00042, yR: 0.55 },
    { freq: 0.004, amp: 44, spd: 0.00018, yR: 0.78 },
  ] as const

  onMount(() => {
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize, { passive: true })
    rmResize = () => window.removeEventListener('resize', onResize)

    function draw(time: number) {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      for (const w of WAVES) {
        const baseY = H * w.yR
        ctx.beginPath()
        ctx.moveTo(0, baseY + Math.sin(time * w.spd) * w.amp)
        for (let x = 2; x <= W; x += 3)
          ctx.lineTo(x, baseY + Math.sin(x * w.freq + time * w.spd) * w.amp)
        ctx.strokeStyle = 'rgba(59,139,255,0.05)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
  })

  onCleanup(() => {
    cancelAnimationFrame(animId)
    rmResize()
  })

  return <canvas ref={canvas} class="pricing-wave-canvas" />
}

// ── Bento card inners ─────────────────────────────────────────────────────────

function BreadboardViz() {
  // Static SVG with CSS animations for LED pulse + SMIL animated current dot
  return (
    <div class="bb-wrap">
      <svg viewBox="0 0 260 130" class="bb-svg" aria-hidden="true">
        {/* PCB substrate */}
        <rect x="8" y="8" width="244" height="114" rx="4" fill="#060e10" />
        <rect x="8" y="8" width="244" height="114" rx="4" fill="none" stroke="#1a2e1a" stroke-width="0.6" />
        {/* Hole rows - static rendered */}
        {[35, 55, 75, 95].map((cy) =>
          [28, 48, 68, 88, 108, 128, 148, 168, 188, 208, 228].map((cx) => (
            <circle cx={cx} cy={cy} r="2.4" fill="#101e10" stroke="#1e3a1e" stroke-width="0.4" />
          )),
        )}
        {/* Power rails */}
        <line x1="8" y1="105" x2="252" y2="105" stroke="#ff3333" stroke-width="1.2" opacity="0.22" />
        <line x1="8" y1="110" x2="252" y2="110" stroke="#3355ff" stroke-width="1.2" opacity="0.22" />
        {/* Resistor body */}
        <rect x="60" y="29" width="36" height="12" rx="3" fill="#1a1a0a" stroke="#4a4a1a" stroke-width="0.5" />
        <line x1="48" y1="35" x2="60" y2="35" stroke="#4a4a1a" stroke-width="0.8" />
        <line x1="96" y1="35" x2="108" y2="35" stroke="#4a4a1a" stroke-width="0.8" />
        {/* Color bands */}
        <line x1="68" y1="29" x2="68" y2="41" stroke="#d97706" stroke-width="2" />
        <line x1="75" y1="29" x2="75" y2="41" stroke="#333" stroke-width="2" />
        <line x1="82" y1="29" x2="82" y2="41" stroke="#d97706" stroke-width="2" />
        {/* Traces */}
        <polyline
          points="28,35 48,35"
          fill="none"
          stroke="#3b8bff"
          stroke-width="1"
          opacity="0.5"
        />
        <polyline
          points="96,35 148,35 148,55"
          fill="none"
          stroke="#3b8bff"
          stroke-width="1"
          opacity="0.5"
        />
        <polyline
          points="28,55 108,55 108,75 148,75"
          fill="none"
          stroke="#a78bfa"
          stroke-width="1"
          opacity="0.45"
        />
        {/* LED1 — blue, pulsing */}
        <circle cx="28" cy="55" r="6" fill="#3b8bff" class="bb-led-b" />
        <circle cx="28" cy="55" r="10" fill="none" stroke="#3b8bff" stroke-width="0.6" class="bb-ring-b" />
        {/* LED2 — violet, pulsing */}
        <circle cx="148" cy="75" r="6" fill="#a78bfa" class="bb-led-v" />
        <circle cx="148" cy="75" r="10" fill="none" stroke="#a78bfa" stroke-width="0.6" class="bb-ring-v" />
        {/* Animated current particle */}
        <circle r="2.8" fill="#3b8bff" opacity="0.85">
          <animateMotion dur="2.8s" repeatCount="indefinite" calcMode="linear"
            path="M 28 35 L 48 35 L 60 35 L 96 35 L 148 35 L 148 55" />
        </circle>
        <circle r="2.2" fill="#a78bfa" opacity="0.8">
          <animateMotion dur="3.2s" repeatCount="indefinite" calcMode="linear" begin="1.2s"
            path="M 28 55 L 108 55 L 108 75 L 148 75" />
        </circle>
      </svg>
      <div class="bb-caption">Live simulation · 60 fps</div>
    </div>
  )
}

function CodeCard() {
  return (
    <div class="code-wrap">
      <div class="code-bar">
        <span class="cb-r" />
        <span class="cb-y" />
        <span class="cb-g" />
        <span class="code-file">sketch.ino</span>
      </div>
      <pre class="code-pre">
        <code innerHTML={CODE_HTML} />
      </pre>
    </div>
  )
}

function SolverMetrics() {
  const [vA, setVA] = createSignal(4.92)
  const [iR, setIR] = createSignal(22.4)
  const [hz, setHz] = createSignal(1.0)
  let iv = 0

  onMount(() => {
    iv = window.setInterval(() => {
      setVA(parseFloat((4.8 + Math.random() * 0.28).toFixed(2)))
      setIR(parseFloat((20 + Math.random() * 5.2).toFixed(1)))
      setHz(parseFloat((0.96 + Math.random() * 0.09).toFixed(2)))
    }, 1900)
  })
  onCleanup(() => clearInterval(iv))

  return (
    <div class="solver-grid">
      <div class="solver-metric">
        <span class="sm-val">
          {vA()}
          <span class="sm-unit">V</span>
        </span>
        <span class="sm-key">Node A</span>
      </div>
      <div class="solver-metric">
        <span class="sm-val">
          {iR()}
          <span class="sm-unit">mA</span>
        </span>
        <span class="sm-key">I(R1)</span>
      </div>
      <div class="solver-metric">
        <span class="sm-val">
          {hz()}
          <span class="sm-unit">kHz</span>
        </span>
        <span class="sm-key">Freq</span>
      </div>
      <div class="solver-status">
        <span class="ss-dot" />
        CONVERGED
      </div>
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar(props: { onOpenModal: () => void }) {
  const auth = useAuthStore()
  return (
    <nav class="nav">
      <div class="nav-pill">
        <a href="/" class="nav-logo">
          <span class="logo-w">fer</span>
          <span class="logo-b">mion</span>
        </a>
        <ul class="nav-links">
          <li>
            <a href="#features">Simulations</a>
          </li>
          <li>
            <a href="#features">Components</a>
          </li>
          <li>
            <a href="#pricing">Pricing</a>
          </li>
          <li>
            <a href="#">Docs</a>
          </li>
        </ul>
        <div class="nav-ctas">
          <Show
            when={auth.user()}
            fallback={
              <>
                <button class="btn btn-ghost btn-sm" onClick={props.onOpenModal}>
                  Log in
                </button>
                <button class="btn btn-primary btn-sm" onClick={props.onOpenModal}>
                  Start free
                </button>
              </>
            }
          >
            <A href="/dashboard" class="btn btn-ghost btn-sm">
              Dashboard
            </A>
            <span class="nav-email">{truncate(auth.user()?.email ?? 'User')}</span>
            <button class="btn btn-outline btn-sm" onClick={() => void auth.signOut()}>
              Sign out
            </button>
          </Show>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero(props: { onOpenModal: () => void }) {
  const auth = useAuthStore()
  const navigate = useNavigate()

  return (
    <section class="hero">
      <ParticleCanvas />
      <div class="hero-glow" />
      <div class="hero-inner l-inner">
        <div class="hero-badge">
          <span class="badge-pulse" />
          3D circuit simulation, in your browser
        </div>
        <h1 class="hero-h1">
          Build circuits.
          <br />
          <span class="hero-grad">See them live.</span>
        </h1>
        <p class="hero-sub">
          Fermion is a real-time 3D electronic circuit simulator. No install, no setup
          — drag, connect, and simulate.
        </p>
        <div class="hero-btns">
          <button
            class="btn btn-primary btn-lg"
            onClick={() => (auth.user() ? navigate('/dashboard') : navigate('/sim?guest=true'))}
          >
            {auth.user() ? 'Go to Dashboard' : 'Open simulator'}
          </button>
          <Show when={!auth.user()}>
            <button class="btn btn-outline btn-lg" onClick={props.onOpenModal}>
              Sign up free
            </button>
          </Show>
        </div>
        <p class="hero-note">Free forever · No credit card required</p>
      </div>
    </section>
  )
}

// ── Marquee ────────────────────────────────────────────────────────────────────

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div class="marquee-wrap">
      <div class="marquee-track">
        <For each={doubled}>
          {(item) => (
            <span class="mq-item">
              <span class="mq-sep" aria-hidden="true">
                ⚡
              </span>
              {item}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

// ── Bento grid ─────────────────────────────────────────────────────────────────

function BentoGrid() {
  return (
    <section class="section section-features" id="features">
      <DotWaveCanvas />
      <div class="l-inner">
        <div class="section-head reveal">
          <p class="section-label">Features</p>
          <h2 class="section-title">Everything you need to simulate</h2>
          <p class="section-sub">From resistors to microcontrollers — all in a single browser tab.</p>
        </div>
        <div class="bento-grid">
          {/* A — large (2 cols, 2 rows): live 3D sim */}
          <div class="bento-card bento-a reveal" style="--dl:0s">
            <p class="bento-tag">CORE ENGINE</p>
            <h3 class="bento-title">Real-time 3D simulation</h3>
            <p class="bento-desc">
              Voltages and currents update every frame. No "run simulation" button needed.
            </p>
            <div class="bento-fill">
              <BreadboardViz />
            </div>
            <div class="bento-glow" />
          </div>
          {/* B — Arduino */}
          <div class="bento-card bento-b reveal" style="--dl:0.1s">
            <p class="bento-tag">MICROCONTROLLER</p>
            <h3 class="bento-title">Arduino emulation</h3>
            <p class="bento-desc">Cycle-accurate ATmega328P via avr8js.</p>
            <CodeCard />
            <div class="bento-glow" />
          </div>
          {/* C — MNA solver */}
          <div class="bento-card bento-c reveal" style="--dl:0.2s">
            <p class="bento-tag">SOLVER</p>
            <h3 class="bento-title">MNA solver</h3>
            <p class="bento-desc">Live node voltages and branch currents.</p>
            <SolverMetrics />
            <div class="bento-glow" />
          </div>
          {/* D — Export */}
          <div class="bento-card bento-d reveal" style="--dl:0.3s">
            <span class="bento-badge bento-pro">PRO</span>
            <p class="bento-tag">EXPORT</p>
            <h3 class="bento-title">Export to KiCad</h3>
            <p class="bento-desc">Schematics + Gerber files, ready for fabrication.</p>
            <div class="bento-glow" />
          </div>
          {/* E — Offline */}
          <div class="bento-card bento-e reveal" style="--dl:0.4s">
            <span class="bento-badge bento-pwa">PWA</span>
            <p class="bento-tag">OFFLINE</p>
            <h3 class="bento-title">Works offline</h3>
            <p class="bento-desc">IndexedDB cache via Dexie. No connection needed.</p>
            <div class="bento-glow" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Comparison Slider ──────────────────────────────────────────────────────────

function SchematicView() {
  return (
    <div class="cmp-schem-wrap">
      <svg viewBox="0 0 360 180" class="cmp-schem-svg" aria-hidden="true">
        <defs>
          <pattern id="sg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.7" fill="#12123a" />
          </pattern>
        </defs>
        <rect width="360" height="180" fill="#04040e" />
        <rect width="360" height="180" fill="url(#sg)" />

        {/* Static wire frame (dim) */}
        <polyline points="50,73 50,40 100,40 175,40 205,40 248,40 310,40 310,140 50,140 50,107"
          fill="none" stroke="#0e1430" stroke-width="2" />
        <polyline points="50,107 50,73" fill="none" stroke="#0e1430" stroke-width="2" />

        {/* Animated current — rendered BEFORE component symbols so they mask it */}
        <polyline
          class="schem-current"
          points="50,73 50,40 100,40 175,40 205,40 248,40 310,40 310,140 50,140 50,107"
          fill="none"
          stroke="#3b8bff"
          stroke-width="2"
          stroke-dasharray="10 16"
          opacity="0.9"
        />

        {/* Battery — two-cell symbol */}
        <line x1="35" y1="73" x2="65" y2="73" stroke="#3b8bff" stroke-width="3" />
        <line x1="41" y1="82" x2="59" y2="82" stroke="#3b8bff" stroke-width="1.6" />
        <line x1="35" y1="97" x2="65" y2="97" stroke="#3b8bff" stroke-width="3" />
        <line x1="41" y1="106" x2="59" y2="106" stroke="#3b8bff" stroke-width="1.6" />
        <text x="68" y="77" font-size="9" fill="#3b8bff">+</text>
        <text x="68" y="111" font-size="9" fill="#3b8bff">−</text>
        <text x="5" y="87" font-family="monospace" font-size="8" fill="#6060a0">V1</text>
        <text x="3" y="100" font-family="monospace" font-size="9" fill="#4a70c8">5V</text>

        {/* Resistor — rectangle body */}
        <rect x="100" y="32" width="75" height="16" rx="2"
          fill="#060614" stroke="#3b8bff" stroke-width="1.3" opacity="0.9" />
        <text x="114" y="63" font-family="monospace" font-size="8" fill="#3b8bff">R1</text>
        <text x="104" y="74" font-family="monospace" font-size="7.5" fill="#505090">330Ω</text>

        {/* LED — diode symbol (triangle + bar) */}
        <polygon points="205,24 205,56 248,40"
          fill="#060614" stroke="#3b8bff" stroke-width="1.3" stroke-linejoin="round" />
        <line x1="248" y1="24" x2="248" y2="56" stroke="#3b8bff" stroke-width="2.4" />
        <circle cx="248" cy="40" r="9" fill="rgba(59,139,255,0.1)" class="schem-led-glow" />
        <line x1="253" y1="28" x2="261" y2="20" stroke="#3b8bff" stroke-width="1" opacity="0.55" />
        <line x1="258" y1="35" x2="267" y2="29" stroke="#3b8bff" stroke-width="1" opacity="0.55" />
        <text x="216" y="68" font-family="monospace" font-size="8" fill="#3b8bff">LED</text>
        <text x="206" y="78" font-family="monospace" font-size="7.5" fill="#505090">Vf=1.8V</text>

        {/* Junction dots */}
        <circle cx="50" cy="40" r="3.5" fill="#3b8bff" opacity="0.65" />
        <circle cx="50" cy="140" r="3.5" fill="#3b8bff" opacity="0.65" />
        <circle cx="310" cy="40" r="3.5" fill="#3b8bff" opacity="0.65" />
        <circle cx="310" cy="140" r="3.5" fill="#3b8bff" opacity="0.65" />
      </svg>
    </div>
  )
}

function View3D() {
  return (
    <div class="cmp-3d-wrap">
      <div class="v3d-bg" />
      <div class="v3d-main">
        <div class="v3d-stage">
          {/* Battery */}
          <div class="v3d-comp">
            <div class="v3d-bat">
              <span class="v3d-bat-plus">+</span>
              <span class="v3d-bat-minus">−</span>
            </div>
            <p class="v3d-lbl">V1 · 5V</p>
          </div>
          {/* Wire: battery → resistor */}
          <div class="v3d-wire-seg">
            <span class="v3d-ptcl" />
            <span class="v3d-ptcl" style="animation-delay:0.83s" />
            <span class="v3d-ptcl" style="animation-delay:1.67s" />
          </div>
          {/* Resistor */}
          <div class="v3d-comp">
            <div class="v3d-res">
              <span class="v3d-band" style="background:#d97706" />
              <span class="v3d-band" style="background:#2a2a2a" />
              <span class="v3d-band" style="background:#d97706" />
            </div>
            <p class="v3d-lbl">R1 · 330Ω</p>
          </div>
          {/* Wire: resistor → LED */}
          <div class="v3d-wire-seg">
            <span class="v3d-ptcl" style="animation-delay:0.42s" />
            <span class="v3d-ptcl" style="animation-delay:1.25s" />
            <span class="v3d-ptcl" style="animation-delay:2.08s" />
          </div>
          {/* LED */}
          <div class="v3d-comp">
            <div class="v3d-led" />
            <p class="v3d-lbl">LED</p>
          </div>
        </div>
      </div>
      {/* Inspector panel */}
      <div class="v3d-panel">
        <p class="v3d-panel-title">Inspector</p>
        <div class="v3d-row">
          <span class="v3d-key">Node A</span>
          <span class="v3d-val">5.00 V</span>
        </div>
        <div class="v3d-row">
          <span class="v3d-key">I(R1)</span>
          <span class="v3d-val">9.7 mA</span>
        </div>
        <div class="v3d-row">
          <span class="v3d-key">Vf</span>
          <span class="v3d-val">1.8 V</span>
        </div>
        <div class="v3d-row">
          <span class="v3d-key">Status</span>
          <span class="v3d-val v3d-ok">CONVERGED</span>
        </div>
      </div>
    </div>
  )
}

function Demo() {
  const [pos, setPos] = createSignal(10)
  let containerRef!: HTMLDivElement
  let dragging = false
  let live = true

  const clamp = (v: number) => Math.max(2, Math.min(98, v))

  const getRelPos = (clientX: number) => {
    const rect = containerRef.getBoundingClientRect()
    return clamp(((clientX - rect.left) / rect.width) * 100)
  }

  const onMouseMove = (e: MouseEvent) => { if (dragging) setPos(getRelPos(e.clientX)) }
  const onMouseUp = () => { dragging = false }
  const onTouchMove = (e: TouchEvent) => {
    if (dragging && e.touches[0]) setPos(getRelPos(e.touches[0]!.clientX))
  }
  const onTouchEnd = () => { dragging = false }

  onMount(() => {
    // Intro animation: 10% → 50% over 1.5s (hints at interactivity)
    const t0 = performance.now()
    const tick = (now: number) => {
      if (!live) return
      const p = Math.min(1, (now - t0) / 1500)
      setPos(10 + 40 * (1 - Math.pow(1 - p, 3)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
  })

  onCleanup(() => {
    live = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })

  return (
    <section class="section">
      <div class="l-inner">
        <div class="section-head centered reveal">
          <p class="section-label">Interactive Demo</p>
          <h2 class="section-title">The simulator, live</h2>
          <p class="section-sub centered-sub">
            Drag the divider to compare the 2D schematic and 3D simulation views.
          </p>
        </div>
        <div ref={containerRef} class="cmp-wrap reveal">
          {/* Left panel — 2D schematic */}
          <div
            class="cmp-panel cmp-left"
            style={{ 'clip-path': `inset(0 ${(100 - pos()).toFixed(2)}% 0 0)` }}
          >
            <div class="cmp-label cmp-label-l">Schematic</div>
            <SchematicView />
          </div>
          {/* Right panel — 3D simulation */}
          <div
            class="cmp-panel cmp-right"
            style={{ 'clip-path': `inset(0 0 0 ${pos().toFixed(2)}%)` }}
          >
            <div class="cmp-label cmp-label-r">3D Simulation</div>
            <View3D />
          </div>
          {/* Divider */}
          <div class="cmp-divider" style={{ left: `${pos().toFixed(2)}%` }}>
            <div class="cmp-line" />
            <div
              class="cmp-handle"
              onMouseDown={() => { dragging = true }}
              onTouchStart={() => { dragging = true }}
            >
              ↔
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function Pricing(props: { onOpenModal: () => void }) {
  return (
    <section class="section section-pricing" id="pricing">
      <PricingWaveCanvas />
      <div class="l-inner">
        <div class="section-head reveal">
          <p class="section-label">Pricing</p>
          <h2 class="section-title">Simple, transparent pricing</h2>
          <p class="section-sub">Start for free. Upgrade when you need more power.</p>
        </div>
        <div class="pricing-grid">
          <For each={PLANS}>
            {(plan, i) => (
              <div
                class={`pricing-card reveal${plan.featured ? ' pricing-featured' : ''}`}
                style={`--dl:${i() * 0.15}s`}
              >
                <Show when={plan.featured}>
                  <div class="pricing-glow" />
                </Show>
                <p class="plan-tag">{plan.tag}</p>
                <p class="plan-name">{plan.name}</p>
                <div class="price-row">
                  <Show when={plan.originalPrice}>
                    <span class="price-old">{plan.originalPrice}</span>
                  </Show>
                  <span class="price-num">{plan.price}</span>
                  <span class="price-per">{plan.period}</span>
                </div>
                <hr class="plan-hr" />
                <ul class="plan-list">
                  <For each={plan.features}>{(f) => <li>{f}</li>}</For>
                </ul>
                <button
                  class={`btn plan-btn${plan.featured ? ' btn-primary' : ' btn-outline'}`}
                  onClick={props.onOpenModal}
                >
                  {plan.cta}
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ───────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section class="section">
      <div class="l-inner">
        <div class="section-head centered reveal">
          <p class="section-label">Testimonials</p>
          <h2 class="section-title">Trusted by engineers</h2>
        </div>
        <div class="testi-grid">
          <For each={TESTIMONIALS}>
            {(t, i) => (
              <div class="testi-card reveal" style={`--dl:${i() * 0.2}s`}>
                <p class="testi-q">"{t.quote}"</p>
                <div class="testi-author">
                  <div class="testi-av">{t.initials}</div>
                  <div>
                    <p class="testi-name">{t.author}</p>
                    <p class="testi-role">{t.role}</p>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

// ── CTA ────────────────────────────────────────────────────────────────────────

function CTA(props: { onOpenModal: () => void }) {
  const auth = useAuthStore()
  const navigate = useNavigate()
  return (
    <section class="cta-section">
      <div class="cta-glow" />
      <div class="l-inner cta-inner reveal">
        <p class="section-label">Get started</p>
        <h2 class="cta-title">Ready to simulate?</h2>
        <p class="cta-sub">Join thousands of engineers building faster with Fermion.</p>
        <button
          class="btn btn-primary btn-cta"
          onClick={() => (auth.user() ? navigate('/dashboard') : props.onOpenModal())}
        >
          {auth.user() ? 'Go to Dashboard' : 'Start building for free'}
        </button>
        <p class="cta-note">No credit card · Free forever · Open in seconds</p>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer class="footer">
      <div class="footer-inner l-inner">
        <div class="footer-brand">
          <a href="/" class="nav-logo">
            <span class="logo-w">fer</span>
            <span class="logo-b">mion</span>
          </a>
          <p class="footer-tag">Real-time 3D circuit simulation in your browser.</p>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <p class="fc-h">Product</p>
            <a href="#features">Simulations</a>
            <a href="#features">Components</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div class="footer-col">
            <p class="fc-h">Resources</p>
            <a href="#">Docs</a>
            <a href="#">Blog</a>
            <a href="#">Changelog</a>
          </div>
          <div class="footer-col">
            <p class="fc-h">Company</p>
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom l-inner">© 2026 Fermion · fermion.io</div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function Landing() {
  const [showModal, setShowModal] = createSignal(false)
  const [searchParams] = useSearchParams<{ login?: string; error?: string }>()

  useRevealObserver()

  onMount(() => {
    if (searchParams.login === '1') setShowModal(true)
  })

  const open = () => setShowModal(true)
  const close = () => setShowModal(false)

  return (
    <>
      <Navbar onOpenModal={open} />
      <main>
        <Hero onOpenModal={open} />
        <Marquee />
        <BentoGrid />
        <Demo />
        <Pricing onOpenModal={open} />
        <Testimonials />
        <CTA onOpenModal={open} />
      </main>
      <Footer />
      <Show when={showModal()}>
        <AuthModal
          onClose={close}
          {...(searchParams.error !== undefined ? { initialError: searchParams.error } : {})}
        />
      </Show>
    </>
  )
}
