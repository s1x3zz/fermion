export type ThemeId = 'spatial' | 'arctic' | 'nebula' | 'enterprise'
export type AccentColor = 'blue' | 'green' | 'red' | 'orange' | 'violet'
export type ThemeTier = 'free' | 'pro' | 'enterprise'
export type AnimationStyle = 'glow' | 'crystal' | 'cosmic' | 'data'

export interface ParticleConfig {
  count: number
  speed: number
  connectionRadius: number
  particleRadius: number
}

export interface Theme {
  id: ThemeId
  name: string
  description: string
  tier: ThemeTier
  animationStyle: AnimationStyle
  fontHeading: string
  fontBody: string
  previewColors: [string, string, string]
}

export const THEMES: Theme[] = [
  {
    id: 'spatial',
    name: 'Spatial',
    description: 'Quantum physics lab · Deep space',
    tier: 'free',
    animationStyle: 'glow',
    fontHeading: 'DM Serif Display',
    fontBody: 'Space Grotesk',
    previewColors: ['#0a0a0f', '#3b8bff', '#f0f0f8'],
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'White singularity · Frozen precision',
    tier: 'pro',
    animationStyle: 'crystal',
    fontHeading: 'Instrument Serif',
    fontBody: 'Space Grotesk',
    previewColors: ['#f8faff', '#0044cc', '#0a0a1a'],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Cosmic explosion · Birth of a star',
    tier: 'pro',
    animationStyle: 'cosmic',
    fontHeading: 'Playfair Display',
    fontBody: 'Space Grotesk',
    previewColors: ['#08000f', '#ff2d78', '#fff0ff'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Mission control · Liquid gold precision',
    tier: 'enterprise',
    animationStyle: 'data',
    fontHeading: 'Playfair Display',
    fontBody: 'Space Grotesk',
    previewColors: ['#080a08', '#d4a017', '#e8d88a'],
  },
]

export const ACCENT_COLORS: Record<AccentColor, { color: string; label: string }> = {
  blue:   { color: '#3b8bff', label: 'Blue' },
  green:  { color: '#00d084', label: 'Green' },
  red:    { color: '#ff3b5c', label: 'Red' },
  orange: { color: '#ff8c00', label: 'Orange' },
  violet: { color: '#a855f7', label: 'Violet' },
}

export const THEME_TIER_ACCESS: Record<ThemeId, ThemeTier> = {
  spatial:    'free',
  arctic:     'pro',
  nebula:     'pro',
  enterprise: 'enterprise',
}
