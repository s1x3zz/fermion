import { createSignal } from 'solid-js'
import { createStore } from 'zustand/vanilla'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ── Zustand state + actions ───────────────────────────────────────────────────

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isGuest: boolean
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
    set({ user: null, session: null, isGuest: false })
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
// Signals live at module scope — no owner needed, they persist for app lifetime.

const [user, setUser] = createSignal<User | null>(null)
const [session, setSession] = createSignal<Session | null>(null)
const [loading, setLoading] = createSignal(true)
const [isGuest, setIsGuestSignal] = createSignal(false)

// Keep SolidJS signals in sync with Zustand state
_store.subscribe((state) => {
  setUser(state.user)
  setSession(state.session)
  setLoading(state.loading)
  setIsGuestSignal(state.isGuest)
})

// ── Bootstrap: restore session + subscribe to auth events ─────────────────────

void (async () => {
  const { data } = await supabase.auth.getSession()
  _store.setState({
    session: data.session,
    user: data.session?.user ?? null,
    loading: false,
  })
})()

supabase.auth.onAuthStateChange((_event, newSession) => {
  _store.setState({
    session: newSession,
    user: newSession?.user ?? null,
    loading: false,
  })
})

// ── Public hook ───────────────────────────────────────────────────────────────

const { signIn, signUp, signOut, signInWithGoogle, setGuest } = _store.getState()

export function useAuthStore() {
  return { user, session, loading, isGuest, signIn, signUp, signOut, signInWithGoogle, setGuest }
}
