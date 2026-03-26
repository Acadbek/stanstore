export type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    text: string;
    card: string;
  };
  styles: {
    pageBg: string;
    pageBgGradient?: string;
    headingColor: string;
    textColor: string;
    mutedColor: string;
    avatarRing: string;
    avatarFallback: string;
    avatarFallbackText: string;
    socialIconColor: string;
    socialIconHover: string;
    cardBg: string;
    cardBorder: string;
    cardHoverShadow: string;
    cardHoverBorder: string;
    priceColor: string;
    linkColor: string;
    linkHoverColor: string;
    productBadge: string;
    productBadgeText: string;
    footerColor: string;
    buttonBg: string;
    buttonText: string;
  };
};

export const themes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Clean',
    description: 'Simple and clean white design',
    preview: { bg: '#ffffff', accent: '#f97316', text: '#111827', card: '#f9fafb' },
    styles: {
      pageBg: '#ffffff',
      pageBgGradient: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
      headingColor: '#111827',
      textColor: '#4b5563',
      mutedColor: '#9ca3af',
      avatarRing: '#ffffff',
      avatarFallback: '#fff7ed',
      avatarFallbackText: '#c2410c',
      socialIconColor: '#9ca3af',
      socialIconHover: '#374151',
      cardBg: '#ffffff',
      cardBorder: '#f3f4f6',
      cardHoverShadow: '0 4px 12px rgba(0,0,0,0.08)',
      cardHoverBorder: '#e5e7eb',
      priceColor: '#111827',
      linkColor: '#f97316',
      linkHoverColor: '#ea580c',
      productBadge: 'linear-gradient(135deg, #f97316, #fb923c)',
      productBadgeText: '#ffffff',
      footerColor: '#d1d5db',
      buttonBg: '#111827',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek dark mode design',
    preview: { bg: '#0f172a', accent: '#818cf8', text: '#e2e8f0', card: '#1e293b' },
    styles: {
      pageBg: '#0f172a',
      pageBgGradient: 'linear-gradient(to bottom, #0f172a, #1e293b)',
      headingColor: '#f1f5f9',
      textColor: '#94a3b8',
      mutedColor: '#475569',
      avatarRing: '#1e293b',
      avatarFallback: '#1e1b4b',
      avatarFallbackText: '#818cf8',
      socialIconColor: '#475569',
      socialIconHover: '#94a3b8',
      cardBg: '#1e293b',
      cardBorder: '#334155',
      cardHoverShadow: '0 4px 12px rgba(0,0,0,0.3)',
      cardHoverBorder: '#475569',
      priceColor: '#f1f5f9',
      linkColor: '#818cf8',
      linkHoverColor: '#a5b4fc',
      productBadge: 'linear-gradient(135deg, #818cf8, #a78bfa)',
      productBadgeText: '#ffffff',
      footerColor: '#334155',
      buttonBg: '#818cf8',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and purple tones',
    preview: { bg: '#fffbeb', accent: '#f59e0b', text: '#78350f', card: '#fef3c7' },
    styles: {
      pageBg: '#fffbeb',
      pageBgGradient: 'linear-gradient(to bottom, #fffbeb, #fef3c7)',
      headingColor: '#78350f',
      textColor: '#92400e',
      mutedColor: '#a16207',
      avatarRing: '#fef3c7',
      avatarFallback: '#fff7ed',
      avatarFallbackText: '#c2410c',
      socialIconColor: '#a16207',
      socialIconHover: '#78350f',
      cardBg: '#ffffff',
      cardBorder: '#fde68a',
      cardHoverShadow: '0 4px 12px rgba(245,158,11,0.15)',
      cardHoverBorder: '#fbbf24',
      priceColor: '#78350f',
      linkColor: '#d97706',
      linkHoverColor: '#b45309',
      productBadge: 'linear-gradient(135deg, #f59e0b, #d97706)',
      productBadgeText: '#ffffff',
      footerColor: '#fde68a',
      buttonBg: '#d97706',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blue tones',
    preview: { bg: '#eff6ff', accent: '#3b82f6', text: '#1e3a5f', card: '#dbeafe' },
    styles: {
      pageBg: '#eff6ff',
      pageBgGradient: 'linear-gradient(to bottom, #eff6ff, #dbeafe)',
      headingColor: '#1e3a8a',
      textColor: '#3b82f6',
      mutedColor: '#60a5fa',
      avatarRing: '#dbeafe',
      avatarFallback: '#dbeafe',
      avatarFallbackText: '#1d4ed8',
      socialIconColor: '#60a5fa',
      socialIconHover: '#1e3a8a',
      cardBg: '#ffffff',
      cardBorder: '#bfdbfe',
      cardHoverShadow: '0 4px 12px rgba(59,130,246,0.15)',
      cardHoverBorder: '#93c5fd',
      priceColor: '#1e3a8a',
      linkColor: '#2563eb',
      linkHoverColor: '#1d4ed8',
      productBadge: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      productBadgeText: '#ffffff',
      footerColor: '#93c5fd',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green vibes',
    preview: { bg: '#f0fdf4', accent: '#22c55e', text: '#14532d', card: '#dcfce7' },
    styles: {
      pageBg: '#f0fdf4',
      pageBgGradient: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)',
      headingColor: '#14532d',
      textColor: '#166534',
      mutedColor: '#22c55e',
      avatarRing: '#dcfce7',
      avatarFallback: '#dcfce7',
      avatarFallbackText: '#15803d',
      socialIconColor: '#22c55e',
      socialIconHover: '#14532d',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      cardHoverShadow: '0 4px 12px rgba(34,197,94,0.15)',
      cardHoverBorder: '#86efac',
      priceColor: '#14532d',
      linkColor: '#16a34a',
      linkHoverColor: '#15803d',
      productBadge: 'linear-gradient(135deg, #22c55e, #16a34a)',
      productBadgeText: '#ffffff',
      footerColor: '#86efac',
      buttonBg: '#16a34a',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Elegant pink and rose tones',
    preview: { bg: '#fff1f2', accent: '#f43f5e', text: '#881337', card: '#ffe4e6' },
    styles: {
      pageBg: '#fff1f2',
      pageBgGradient: 'linear-gradient(to bottom, #fff1f2, #ffe4e6)',
      headingColor: '#881337',
      textColor: '#9f1239',
      mutedColor: '#e11d48',
      avatarRing: '#ffe4e6',
      avatarFallback: '#ffe4e6',
      avatarFallbackText: '#be123c',
      socialIconColor: '#fb7185',
      socialIconHover: '#881337',
      cardBg: '#ffffff',
      cardBorder: '#fecdd3',
      cardHoverShadow: '0 4px 12px rgba(244,63,94,0.15)',
      cardHoverBorder: '#fda4af',
      priceColor: '#881337',
      linkColor: '#e11d48',
      linkHoverColor: '#be123c',
      productBadge: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      productBadgeText: '#ffffff',
      footerColor: '#fda4af',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple and violet tones',
    preview: { bg: '#faf5ff', accent: '#a855f7', text: '#581c87', card: '#f3e8ff' },
    styles: {
      pageBg: '#faf5ff',
      pageBgGradient: 'linear-gradient(to bottom, #faf5ff, #f3e8ff)',
      headingColor: '#581c87',
      textColor: '#7e22ce',
      mutedColor: '#a855f7',
      avatarRing: '#f3e8ff',
      avatarFallback: '#f3e8ff',
      avatarFallbackText: '#7c3aed',
      socialIconColor: '#c084fc',
      socialIconHover: '#581c87',
      cardBg: '#ffffff',
      cardBorder: '#e9d5ff',
      cardHoverShadow: '0 4px 12px rgba(168,85,247,0.15)',
      cardHoverBorder: '#d8b4fe',
      priceColor: '#581c87',
      linkColor: '#9333ea',
      linkHoverColor: '#7c3aed',
      productBadge: 'linear-gradient(135deg, #a855f7, #9333ea)',
      productBadgeText: '#ffffff',
      footerColor: '#d8b4fe',
      buttonBg: '#9333ea',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Black and white minimal',
    preview: { bg: '#fafafa', accent: '#171717', text: '#0a0a0a', card: '#e5e5e5' },
    styles: {
      pageBg: '#fafafa',
      pageBgGradient: 'linear-gradient(to bottom, #fafafa, #f5f5f5)',
      headingColor: '#0a0a0a',
      textColor: '#525252',
      mutedColor: '#a3a3a3',
      avatarRing: '#e5e5e5',
      avatarFallback: '#f5f5f5',
      avatarFallbackText: '#171717',
      socialIconColor: '#a3a3a3',
      socialIconHover: '#171717',
      cardBg: '#ffffff',
      cardBorder: '#e5e5e5',
      cardHoverShadow: '0 4px 12px rgba(0,0,0,0.1)',
      cardHoverBorder: '#d4d4d4',
      priceColor: '#0a0a0a',
      linkColor: '#171717',
      linkHoverColor: '#0a0a0a',
      productBadge: '#171717',
      productBadgeText: '#ffffff',
      footerColor: '#d4d4d4',
      buttonBg: '#0a0a0a',
      buttonText: '#ffffff',
    },
  },
];

export function getTheme(themeId: string): ThemeConfig {
  return themes.find((t) => t.id === themeId) || themes[0];
}
