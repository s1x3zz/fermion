import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useAuthStore } from '../stores/authStore';
import './auth-modal.css';
// Inline Google "G" SVG — no external asset needed
function GoogleIcon() {
    return (<svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>);
}
export function AuthModal(props) {
    const auth = useAuthStore();
    const [tab, setTab] = createSignal(props.initialTab ?? 'login');
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal(props.initialError ?? null);
    // Close on Escape
    onMount(() => {
        const onKey = (e) => { if (e.key === 'Escape')
            props.onClose(); };
        document.addEventListener('keydown', onKey);
        onCleanup(() => document.removeEventListener('keydown', onKey));
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (tab() === 'login') {
                await auth.signIn(email(), password());
            }
            else {
                await auth.signUp(email(), password());
            }
            props.onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogle = async () => {
        setLoading(true);
        setError(null);
        try {
            await auth.signInWithGoogle();
            // Page will redirect — no need to close modal
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setLoading(false);
        }
    };
    return (<Portal mount={document.body}>
      {/* Backdrop — click outside to close */}
      <div class="modal-backdrop" onClick={props.onClose}>
        {/* Stop propagation so clicks inside the box don't close it */}
        <div class="modal-box" onClick={(e) => e.stopPropagation()}>
          <button class="modal-close" onClick={props.onClose} aria-label="Close">✕</button>

          {/* Tabs */}
          <div class="modal-tabs">
            <button class={`modal-tab${tab() === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(null); }}>
              Log in
            </button>
            <button class={`modal-tab${tab() === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError(null); }}>
              Sign up
            </button>
          </div>

          {/* Error */}
          <Show when={error()}>
            <p class="auth-error">{error()}</p>
          </Show>

          {/* Form */}
          <form class="auth-form" onSubmit={handleSubmit}>
            <div class="auth-field">
              <label for="auth-email">Email</label>
              <input id="auth-email" type="email" class="auth-input" placeholder="you@example.com" required autocomplete="email" value={email()} onInput={(e) => setEmail(e.currentTarget.value)}/>
            </div>
            <div class="auth-field">
              <label for="auth-password">Password</label>
              <input id="auth-password" type="password" class="auth-input" placeholder={tab() === 'signup' ? 'Min. 8 characters' : '••••••••'} required autocomplete={tab() === 'login' ? 'current-password' : 'new-password'} value={password()} onInput={(e) => setPassword(e.currentTarget.value)}/>
            </div>

            <button type="submit" class="auth-submit" disabled={loading()}>
              <Show when={loading()}>
                <span class="auth-spinner"/>
              </Show>
              {tab() === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div class="auth-divider">or</div>

          {/* Google OAuth */}
          <button class="btn-google" onClick={handleGoogle} disabled={loading()}>
            <GoogleIcon />
            Continue with Google
          </button>

          <Show when={tab() === 'signup'}>
            <p class="auth-note">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </Show>
        </div>
      </div>
    </Portal>);
}
//# sourceMappingURL=AuthModal.jsx.map