import { A } from '@solidjs/router'

export function Privacy() {
  return (
    <div style="min-height:100vh;background:#0a0a0f;color:#e8e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;width:100%;text-align:center;">
        <p style="font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin:0 0 16px;">Legal</p>
        <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:700;margin:0 0 12px;color:#f0f0f8;">Privacy Policy</h1>
        <p style="font-size:0.85rem;color:#6b7280;margin:0 0 36px;">Last updated: May 2026</p>
        <p style="font-size:1rem;line-height:1.75;color:#a0a0b8;margin:0 0 48px;">
          We are working on our full privacy policy.
          <br />
          Contact us at{' '}
          <a href="mailto:fermiondev.io@gmail.com" style="color:#3b8bff;text-decoration:none;">
            fermiondev.io@gmail.com
          </a>{' '}
          for any questions.
        </p>
        <A
          href="/"
          style="display:inline-flex;align-items:center;gap:6px;font-size:0.875rem;color:#6b7280;text-decoration:none;border:1px solid #1a1a2e;border-radius:8px;padding:10px 20px;transition:color 0.2s,border-color 0.2s;"
        >
          ← Back to home
        </A>
      </div>
    </div>
  )
}
