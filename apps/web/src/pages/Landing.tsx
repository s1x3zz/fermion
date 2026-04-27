import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import './landing.css'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Feature {
  title: string
  desc: string
}

interface Plan {
  name: string
  price: string
  originalPrice?: string
  period: string
  features: string[]
  featured: boolean
  cta: string
}

const FEATURES: Feature[] = [
  {
    title: 'Real-time MNA solver',
    desc: 'Voltages and currents update instantly as you build. No manual "run" step — the circuit solves on every edit.',
  },
  {
    title: 'Arduino emulation',
    desc: 'Run actual Arduino sketches inside the simulator. ATmega328P emulation via avr8js, cycle-accurate.',
  },
  {
    title: 'Export to KiCad',
    desc: 'Export schematics and PCB layouts to KiCad + Gerber format. Ready for fabrication. Pro feature.',
  },
]

const PLANS: Plan[] = [
  {
    name: 'No login',
    price: '$0',
    period: '/mo',
    features: ['Basic components', '1 project', 'No graphs'],
    featured: false,
    cta: 'Try now',
  },
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    features: ['General components', '5 projects', 'No graphs'],
    featured: false,
    cta: 'Sign up free',
  },
  {
    name: 'Pro',
    price: '$12',
    originalPrice: '$15',
    period: '/mo',
    features: ['All components', 'Unlimited projects', 'Graphs + tables', 'Export Gerber / KiCad'],
    featured: true,
    cta: 'Start Pro',
  },
  {
    name: 'Team / Education',
    price: '$5',
    period: '/mo',
    features: ['20 projects', 'Custom libraries', 'Graphs + tables', 'Team management'],
    featured: false,
    cta: 'Contact us',
  },
]

// ── Subcomponents ──────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav class="nav">
      <div class="nav-inner l-inner">
        <a href="/" class="nav-logo">
          <span class="logo-white">fer</span><span class="logo-blue">mion</span>
        </a>
        <ul class="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="#">Blog</a></li>
        </ul>
        <div class="nav-actions">
          <a href="#" class="btn btn-outline btn-sm">Log in</a>
          <a href="#" class="btn btn-primary btn-sm">Start free</a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section class="hero">
      <div class="l-inner">
        <div class="hero-badge">
          <span class="badge-dot" />
          <span>3D circuit simulation, in your browser</span>
        </div>
        <h1 class="hero-title">
          Build circuits.<br />
          <span class="accent">See them live.</span>
        </h1>
        <p class="hero-sub">
          Fermion is a real-time 3D electronic circuit simulator. No install,
          no setup — just drag, connect, and simulate.
        </p>
        <div class="hero-actions">
          <A href="/sim" class="btn btn-primary">Open simulator</A>
          <a href="#features" class="btn btn-outline">View examples</a>
        </div>
      </div>
    </section>
  )
}

function PreviewFrame() {
  let frameRef!: HTMLDivElement
  const [glowOpacity, setGlowOpacity] = createSignal(0)

  onMount(() => {
    const update = () => {
      const rect = frameRef.getBoundingClientRect()
      const vh = window.innerHeight
      const frameCenter = rect.top + rect.height / 2
      const dist = Math.abs(frameCenter - vh / 2)
      // Opacity peaks at 0.6 when frame centre aligns with viewport centre
      const raw = Math.max(0, 1 - dist / (vh * 0.9))
      setGlowOpacity(parseFloat((raw * 0.6).toFixed(3)))
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    onCleanup(() => window.removeEventListener('scroll', update))
  })

  return (
    <section class="preview-wrap">
      <div class="l-inner">
        <div
          ref={frameRef}
          class="preview-frame"
          style={{
            'box-shadow': `0 24px 80px 16px rgba(59, 139, 255, ${glowOpacity()})`,
          }}
        >
          <div class="preview-inner">
            <span class="preview-label">Simulator canvas — live preview coming soon</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section class="section" id="features">
      <div class="l-inner">
        <p class="section-label">Features</p>
        <h2 class="section-title">Everything you need to simulate</h2>
        <p class="section-sub">From resistors to microcontrollers — all in a single browser tab.</p>
        <div class="features-grid">
          <For each={FEATURES}>
            {(f) => (
              <div class="feature-card">
                <div class="feature-icon">
                  <div class="feature-icon-dot" />
                </div>
                <h3 class="feature-title">{f.title}</h3>
                <p class="feature-desc">{f.desc}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section class="section" id="pricing">
      <div class="l-inner">
        <div class="pricing-header">
          <p class="section-label">Pricing</p>
          <h2 class="section-title">Simple, transparent pricing</h2>
          <p class="section-sub">Start for free. Upgrade when you need more power.</p>
        </div>
        <div class="pricing-grid">
          <For each={PLANS}>
            {(plan) => (
              <div class={`pricing-card${plan.featured ? ' featured' : ''}`}>
                <Show when={plan.featured}>
                  <span class="featured-badge">Most popular</span>
                </Show>
                <p class="plan-name">{plan.name}</p>
                <div class="price-row">
                  <Show when={plan.originalPrice}>
                    <span class="price-old">{plan.originalPrice}</span>
                  </Show>
                  <span class="price-amount">{plan.price}</span>
                  <span class="price-period">{plan.period}</span>
                </div>
                <hr class="plan-divider" />
                <ul class="plan-features">
                  <For each={plan.features}>
                    {(feat) => <li>{feat}</li>}
                  </For>
                </ul>
                <div class="plan-cta">
                  <a
                    href="#"
                    class={`btn ${plan.featured ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer class="footer">
      <div class="footer-inner l-inner">
        <span class="footer-copy">© 2026 Fermion · fermion.io</span>
        <nav class="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Docs</a>
        </nav>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PreviewFrame />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
