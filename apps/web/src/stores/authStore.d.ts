import type { User, Session } from '@supabase/supabase-js';
import type { Tier } from '../lib/api';
interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isGuest: boolean;
    tier: Tier;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    setGuest: (value: boolean) => void;
}
export declare function useAuthStore(): {
    user: import("solid-js").Accessor<User | null>;
    session: import("solid-js").Accessor<Session | null>;
    loading: import("solid-js").Accessor<boolean>;
    isGuest: import("solid-js").Accessor<boolean>;
    tier: import("solid-js").Accessor<Tier>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    setGuest: (value: boolean) => void;
};
/** Synchronous read of auth state — safe to call outside a reactive owner. */
export declare function getAuthSnapshot(): AuthState;
/** Returns true if the current user's tier meets or exceeds `minimum`. */
export declare function usesTier(minimum: Tier): boolean;
export {};
//# sourceMappingURL=authStore.d.ts.map