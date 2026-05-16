import type { ThemeId, AccentColor } from '@fermion/core';
import type { Tier } from '../lib/api';
interface ThemeState {
    currentTheme: ThemeId;
    accentColor: AccentColor;
    applyTheme: (id: ThemeId, userTier?: Tier) => void;
    setAccent: (color: AccentColor) => void;
    canUseTheme: (id: ThemeId, userTier: Tier) => boolean;
}
export declare function useThemeStore(): {
    currentTheme: import("solid-js").Accessor<ThemeId>;
    accentColor: import("solid-js").Accessor<AccentColor>;
    applyTheme: (id: ThemeId, userTier?: Tier) => void;
    setAccent: (color: AccentColor) => void;
    canUseTheme: (id: ThemeId, userTier: Tier) => boolean;
};
export declare function getThemeSnapshot(): ThemeState;
export declare function openThemePalette(): void;
export {};
//# sourceMappingURL=themeStore.d.ts.map