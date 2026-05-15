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

// ── Particle canvas ───────────────────────────────────────────────────────────

function ParticleCanvas() {
  let canvas!: HTMLCanvasElement
  let animId = 0
  let removeResize = () => {}

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    const pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    removeResize = () => window.removeEventListener('resize', resize)

    for (let i = 0; i < 80; i++) {
      pts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.1 + 0.3,
        a: Math.random() * 0.38 + 0.06,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.x = (p.x + p.vx + canvas.width) % canvas.width
        p.y = (p.y + p.vy + canvas.height) % canvas.height
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59,139,255,${p.a})`
        ctx.fill()
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]!
          const b = pts[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(59,139,255,${0.055 * (1 - d / 110)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
  })

  onCleanup(() => {
    cancelAnimationFrame(animId)
    removeResize()
  })

  return <canvas ref={canvas} class="hero-canvas" />
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
    <section class="section" id="features">
      <div class="l-inner">
        <div class="section-head reveal">
          <p class="section-label">Features</p>
          <h2 class="section-title">Everything you need to simulate</h2>
          <p class="section-sub">From resistors to microcontrollers — all in a single browser tab.</p>
        </div>
        <div class="bento-grid">
          {/* A — large (2 cols, 2 rows): live 3D sim */}
          <div class="bento-card bento-a reveal" style="--dl:0.04s">
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
          <div class="bento-card bento-b reveal" style="--dl:0.11s">
            <p class="bento-tag">MICROCONTROLLER</p>
            <h3 class="bento-title">Arduino emulation</h3>
            <p class="bento-desc">Cycle-accurate ATmega328P via avr8js.</p>
            <CodeCard />
            <div class="bento-glow" />
          </div>
          {/* C — MNA solver */}
          <div class="bento-card bento-c reveal" style="--dl:0.17s">
            <p class="bento-tag">SOLVER</p>
            <h3 class="bento-title">MNA solver</h3>
            <p class="bento-desc">Live node voltages and branch currents.</p>
            <SolverMetrics />
            <div class="bento-glow" />
          </div>
          {/* D — Export */}
          <div class="bento-card bento-d reveal" style="--dl:0.23s">
            <span class="bento-badge bento-pro">PRO</span>
            <p class="bento-tag">EXPORT</p>
            <h3 class="bento-title">Export to KiCad</h3>
            <p class="bento-desc">Schematics + Gerber files, ready for fabrication.</p>
            <div class="bento-glow" />
          </div>
          {/* E — Offline */}
          <div class="bento-card bento-e reveal" style="--dl:0.29s">
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

// ── Demo ───────────────────────────────────────────────────────────────────────

function Demo() {
  let frameRef!: HTMLDivElement
  const [glow, setGlow] = createSignal(0)
  let rmScroll = () => {}

  onMount(() => {
    const update = () => {
      const r = frameRef.getBoundingClientRect()
      const mid = r.top + r.height / 2
      const raw = Math.max(0, 1 - Math.abs(mid - window.innerHeight / 2) / (window.innerHeight * 0.9))
      setGlow(parseFloat((raw * 0.42).toFixed(3)))
    }
    window.addEventListener('scroll', update, { passive: true })
    rmScroll = () => window.removeEventListener('scroll', update)
    update()
  })
  onCleanup(() => rmScroll())

  return (
    <section class="section">
      <div class="l-inner">
        <div class="section-head centered reveal">
          <p class="section-label">Interactive Demo</p>
          <h2 class="section-title">The simulator, live</h2>
          <p class="section-sub centered-sub">
            Every component renders in real-time 3D. Current flows as you build.
          </p>
        </div>
        <div
          ref={frameRef}
          class="browser-frame reveal"
          style={{ 'box-shadow': `0 0 80px 18px rgba(59,139,255,${glow()})` }}
        >
          <div class="browser-bar">
            <div class="browser-dots">
              <span />
              <span />
              <span />
            </div>
            <div class="browser-url">
              <span>fermion.io/sim</span>
            </div>
          </div>
          <div class="browser-body">
            <div class="sim-bg" />
            <div class="sim-stage">
              <div class="sim-node" style="top:33%;left:18%">
                <div class="sim-led-b" />
                <p class="sim-lbl">LED1</p>
              </div>
              <div class="sim-node" style="top:53%;left:46%">
                <div class="sim-res" />
                <p class="sim-lbl">R1=220Ω</p>
              </div>
              <div class="sim-node" style="top:33%;left:70%">
                <div class="sim-led-v" />
                <p class="sim-lbl">LED2</p>
              </div>
              <div class="sim-wire" style="top:33%;left:18%;width:52%" />
            </div>
            <div class="sim-panel">
              <p class="sim-panel-title">Inspector</p>
              <div class="sim-row">
                <span class="sk">Node A</span>
                <span class="sv">5.00 V</span>
              </div>
              <div class="sim-row">
                <span class="sk">Node B</span>
                <span class="sv">1.68 V</span>
              </div>
              <div class="sim-row">
                <span class="sk">I(R1)</span>
                <span class="sv">15.1 mA</span>
              </div>
              <div class="sim-row">
                <span class="sk">Status</span>
                <span class="sv sim-ok">CONVERGED</span>
              </div>
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
    <section class="section" id="pricing">
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
                style={`--dl:${i() * 0.08}s`}
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
              <div class="testi-card reveal" style={`--dl:${i() * 0.09}s`}>
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
