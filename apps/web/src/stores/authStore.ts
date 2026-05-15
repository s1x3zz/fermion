import { createSignal } from 'solid-js'
import { createStore } from 'zustand/vanilla'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Tier } from '../lib/api'

// ── Zustand state + actions ───────────────────────────────────────────────────

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  tier: Tier
  // actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  setGuest: (value: boolean) => void
}

const _store = createStore<AuthState>()((set) => ({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  tier: 'guest',

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isGuest: false, tier: 'guest' })
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  },

  setGuest: (value) => set({ isGuest: value }),
}))

// ── SolidJS reactive signals (bridge) ─────────────────────────────────────────

const [user, setUser] = createSignal<User | null>(null)
const [session, setSession] = createSignal<Session | null>(null)
const [loading, setLoading] = createSignal(true)
const [isGuest, setIsGuestSignal] = createSignal(false)
const [tier, setTier] = createSignal<Tier>('guest')

_store.subscribe((state) => {
  setUser(state.user)
  setSession(state.session)
  setLoading(state.loading)
  setIsGuestSignal(state.isGuest)
  setTier(state.tier)
})

// ── Bootstrap: restore session + subscribe to auth events ─────────────────────

void (async () => {
  const { data } = await supabase.auth.getSession()
  _store.setState({
    session: data.session,
    user: data.session?.user ?? null,
    loading: false,
  })

  if (data.session?.user) {
    try {
      const profile = await api.getProfile()
      _store.setState({ tier: profile.tier })
    } catch {
      _store.setState({ tier: 'free' })
    }
  }
})()

supabase.auth.onAuthStateChange((_event, newSession) => {
  _store.setState({
    session: newSession,
    user: newSession?.user ?? null,
    loading: false,
  })

  if (newSession?.user) {
    void api.getProfile().then((p) => _store.setState({ tier: p.tier })).catch(() => {
      _store.setState({ tier: 'free' })
    })
  } else {
    _store.setState({ tier: 'guest' })
  }
})

// ── Public hook ───────────────────────────────────────────────────────────────

const { signIn, signUp, signOut, signInWithGoogle, setGuest } = _store.getState()

export function useAuthStore() {
  return { user, session, loading, isGuest, tier, signIn, signUp, signOut, signInWithGoogle, setGuest }
}

/** Synchronous read of auth state — safe to call outside a reactive owner. */
export function getAuthSnapshot() {
  return _store.getState()
}

const TIER_ORDER: Tier[] = ['guest', 'free', 'pro', 'team']

/** Returns true if the current user's tier meets or exceeds `minimum`. */
export function usesTier(minimum: Tier): boolean {
  return TIER_ORDER.indexOf(tier()) >= TIER_ORDER.indexOf(minimum)
}
