export type ThemeId = 'spatial' | 'arctic' | 'nebula' | 'enterprise';
export type AccentColor = 'blue' | 'green' | 'red' | 'orange' | 'violet';
export type ThemeTier = 'free' | 'pro' | 'enterprise';
export type AnimationStyle = 'glow' | 'crystal' | 'cosmic' | 'data';
export interface ParticleConfig {
    count: number;
    speed: number;
    connectionRadius: number;
    particleRadius: number;
}
export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    tier: ThemeTier;
    animationStyle: AnimationStyle;
    fontHeading: string;
    fontBody: string;
    previewColors: [string, string, string];
}
export declare const THEMES: Theme[];
export declare const ACCENT_COLORS: Record<AccentColor, {
    color: string;
    label: string;
}>;
export declare const THEME_TIER_ACCESS: Record<ThemeId, ThemeTier>;
//# sourceMappingURL=theme.d.ts.map