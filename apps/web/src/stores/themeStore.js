import { createSignal } from 'solid-js';
import { createStore } from 'zustand/vanilla';
import { THEME_TIER_ACCESS } from '@fermion/core';
const LS_THEME = 'fermion-theme';
const LS_ACCENT = 'fermion-accent';
const TIER_ORDER = ['guest', 'free', 'pro', 'ultimate'];
function tierMeets(userTier, required) {
    if (required === 'enterprise')
        return userTier === 'ultimate';
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(required);
}
function readSaved() {
    const theme = localStorage.getItem(LS_THEME) ?? 'spatial';
    const accent = localStorage.getItem(LS_ACCENT) ?? 'blue';
    return { theme, accent };
}
function applyToDOM(theme, accent) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'spatial') {
        document.documentElement.setAttribute('data-accent', accent);
    }
    else {
        document.documentElement.removeAttribute('data-accent');
    }
}
const saved = readSaved();
const _store = createStore()((set, get) => ({
    currentTheme: saved.theme,
    accentColor: saved.accent,
    applyTheme: (id, userTier = 'free') => {
        if (!get().canUseTheme(id, userTier))
            return;
        const accent = get().accentColor;
        applyToDOM(id, accent);
        localStorage.setItem(LS_THEME, id);
        set({ currentTheme: id });
    },
    setAccent: (color) => {
        localStorage.setItem(LS_ACCENT, color);
        const theme = get().currentTheme;
        if (theme === 'spatial') {
            document.documentElement.setAttribute('data-accent', color);
        }
        set({ accentColor: color });
    },
    canUseTheme: (id, userTier) => {
        const required = THEME_TIER_ACCESS[id];
        return tierMeets(userTier, required);
    },
}));
// ── SolidJS reactive signals (bridge) ─────────────────────────────────────────
const [currentTheme, setCurrentTheme] = createSignal(saved.theme);
const [accentColor, setAccentColor] = createSignal(saved.accent);
_store.subscribe((state) => {
    setCurrentTheme(state.currentTheme);
    setAccentColor(state.accentColor);
});
// Apply saved theme to DOM immediately
applyToDOM(saved.theme, saved.accent);
// ── Public hook ───────────────────────────────────────────────────────────────
const { applyTheme, setAccent, canUseTheme } = _store.getState();
export function useThemeStore() {
    return { currentTheme, accentColor, applyTheme, setAccent, canUseTheme };
}
export function getThemeSnapshot() {
    return _store.getState();
}
export function openThemePalette() {
    window.dispatchEvent(new CustomEvent('fermion:open-theme-palette'));
}
//# sourceMappingURL=themeStore.js.map