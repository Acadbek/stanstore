export type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
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
    borderRadius: string;
    buttonBorderRadius: string;
    productColumns: number;
    cardTemplate: string;
    headingFont: string;
    bodyFont: string;
  };
};

export type ThemeCategory = {
  id: string;
  label: string;
  defaultVariant: string;
  variants: ThemeConfig[];
};

export const themes: ThemeConfig[] = [
  {
    id: 'minimalist-business',
    name: 'Minimalist Business',
    description: 'Сдержанная структура для серьезных продуктов и сервисов',
    category: 'minimalist-business',
    categoryLabel: 'Минималистичный бизнес',
    preview: {
      bg: '#FAF9F6',
      accent: '#0056D2',
      text: '#333333',
      card: '#FFFFFF',
    },
    styles: {
      pageBg: '#F5F5F5',
      pageBgGradient: 'linear-gradient(to bottom, #F5F5F5, #FAF9F6)',
      headingColor: '#333333',
      textColor: '#4B5563',
      mutedColor: '#6B7280',
      avatarRing: '#FFFFFF',
      avatarFallback: '#EFF1F3',
      avatarFallbackText: '#0056D2',
      socialIconColor: '#B1B5BC',
      socialIconHover: '#0056D2',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      cardHoverShadow: '0 6px 20px rgba(0, 86, 210, 0.15)',
      cardHoverBorder: '#0056D2',
      priceColor: '#2F3541',
      linkColor: '#0056D2',
      linkHoverColor: '#155E3D',
      productBadge: 'linear-gradient(135deg, #0056D2, #155E3D)',
      productBadgeText: '#FFFFFF',
      footerColor: '#CED1D8',
      buttonBg: '#0056D2',
      buttonText: '#FFFFFF',
      borderRadius: 'sm',
      buttonBorderRadius: 'md',
      productColumns: 3,
      cardTemplate: 'standard',
      headingFont: 'sans',
      bodyFont: 'sans',
    },
  },
  {
    id: 'aesthetic-creator',
    name: 'Aesthetic Creator',
    description: 'Мягкая, фотогеничная палитра для дизайнеров и стилистов',
    category: 'aesthetic-creator',
    categoryLabel: 'Эстетичный создатель',
    preview: {
      bg: '#F1E9DA',
      accent: '#B85C38',
      text: '#4A3E3F',
      card: '#FFF8F0',
    },
    styles: {
      pageBg: '#EDDCC6',
      pageBgGradient: 'linear-gradient(to bottom, #EDDCC6, #F6EFD9)',
      headingColor: '#4A3E3F',
      textColor: '#5F514E',
      mutedColor: '#B7A599',
      avatarRing: '#FFFFFF',
      avatarFallback: '#FFF8F0',
      avatarFallbackText: '#B85C38',
      socialIconColor: '#D6AF98',
      socialIconHover: '#B85C38',
      cardBg: '#FFF8F0',
      cardBorder: '#EAD8C8',
      cardHoverShadow: '0 6px 20px rgba(184, 92, 56, 0.2)',
      cardHoverBorder: '#C04A3C',
      priceColor: '#4A3E3F',
      linkColor: '#C04A3C',
      linkHoverColor: '#B85C38',
      productBadge: 'linear-gradient(135deg, #B85C38, #C04A3C)',
      productBadgeText: '#FDFDFF',
      footerColor: '#EAD8C8',
      buttonBg: '#B85C38',
      buttonText: '#FDFDFF',
      borderRadius: 'lg',
      buttonBorderRadius: 'full',
      productColumns: 2,
      cardTemplate: 'compact',
      headingFont: 'serif',
      bodyFont: 'sans',
    },
  },
  {
    id: 'neo-digital',
    name: 'Neo-Digital',
    description: 'Яркая, чистая палитра для продуктов и цифровых сервисов',
    category: 'neo-digital',
    categoryLabel: 'Нео-Цифра',
    preview: {
      bg: '#FFFFFF',
      accent: '#14D8C5',
      text: '#112A46',
      card: '#F0F4F8',
    },
    styles: {
      pageBg: '#FFFFFF',
      pageBgGradient: 'linear-gradient(to bottom, #FFFFFF, #F0F4F8)',
      headingColor: '#112A46',
      textColor: '#39445B',
      mutedColor: '#9CA3AF',
      avatarRing: '#F0F4F8',
      avatarFallback: '#F0F4F8',
      avatarFallbackText: '#14D8C5',
      socialIconColor: '#D0E3F5',
      socialIconHover: '#112A46',
      cardBg: '#F0F4F8',
      cardBorder: '#E4E9F2',
      cardHoverShadow: '0 6px 20px rgba(20, 216, 197, 0.2)',
      cardHoverBorder: '#14D8C5',
      priceColor: '#112A46',
      linkColor: '#14D8C5',
      linkHoverColor: '#7E22CE',
      productBadge: 'linear-gradient(135deg, #14D8C5, #7E22CE)',
      productBadgeText: '#112A46',
      footerColor: '#D9E3F3',
      buttonBg: '#14D8C5',
      buttonText: '#112A46',
      borderRadius: 'md',
      buttonBorderRadius: 'lg',
      productColumns: 3,
      cardTemplate: 'standard',
      headingFont: 'sans',
      bodyFont: 'sans',
    },
  },
  {
    id: 'night-mode',
    name: 'Night Mode',
    description: 'Профессиональный тёмный режим для геймеров и крипто-команд',
    category: 'night-mode',
    categoryLabel: 'Ночной режим',
    preview: {
      bg: '#101827',
      accent: '#43D8FF',
      text: '#E0E0E0',
      card: '#1F2937',
    },
    styles: {
      pageBg: '#101827',
      pageBgGradient: 'linear-gradient(to bottom, #101827, #1E1E2F)',
      headingColor: '#E0E0E0',
      textColor: '#C7CEDB',
      mutedColor: '#8B93AB',
      avatarRing: '#1F2937',
      avatarFallback: '#1F2937',
      avatarFallbackText: '#43D8FF',
      socialIconColor: '#4F5A78',
      socialIconHover: '#43D8FF',
      cardBg: '#1F2937',
      cardBorder: '#2B2B3C',
      cardHoverShadow: '0 6px 20px rgba(67, 216, 255, 0.25)',
      cardHoverBorder: '#43D8FF',
      priceColor: '#E0E0E0',
      linkColor: '#43D8FF',
      linkHoverColor: '#9FE6FF',
      productBadge: 'linear-gradient(135deg, #43D8FF, #FF9F43)',
      productBadgeText: '#101827',
      footerColor: '#2B2B3C',
      buttonBg: '#43D8FF',
      buttonText: '#101827',
      borderRadius: 'lg',
      buttonBorderRadius: 'full',
      productColumns: 3,
      cardTemplate: 'overlay',
      headingFont: 'sans',
      bodyFont: 'sans',
    },
  },
  {
    id: 'premium-gloss',
    name: 'Premium Gloss',
    description: 'Чистая, дорогая палитра для коучинга и люкс-услуг',
    category: 'premium-gloss',
    categoryLabel: 'Премиум глянец',
    preview: {
      bg: '#FFFFFF',
      accent: '#D4AF37',
      text: '#1A1A1A',
      card: '#FFFFFF',
    },
    styles: {
      pageBg: '#FFFFFF',
      pageBgGradient: 'linear-gradient(to bottom, #FFFFFF, #F9F9F9)',
      headingColor: '#1A1A1A',
      textColor: '#2B2B2B',
      mutedColor: '#6B6B6B',
      avatarRing: '#FFFFFF',
      avatarFallback: '#FFFFFF',
      avatarFallbackText: '#D4AF37',
      socialIconColor: '#D4AF37',
      socialIconHover: '#1A1A1A',
      cardBg: '#FFFFFF',
      cardBorder: '#DDDDDD',
      cardHoverShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      cardHoverBorder: '#D4AF37',
      priceColor: '#1A1A1A',
      linkColor: '#1A1A1A',
      linkHoverColor: '#D4AF37',
      productBadge: 'linear-gradient(135deg, #000000, #D4AF37)',
      productBadgeText: '#FFFFFF',
      footerColor: '#DDDDDD',
      buttonBg: '#000000',
      buttonText: '#FFFFFF',
      borderRadius: 'md',
      buttonBorderRadius: 'sm',
      productColumns: 2,
      cardTemplate: 'minimal',
      headingFont: 'serif',
      bodyFont: 'serif',
    },
  },
];

export function getThemeCategories(): ThemeCategory[] {
  const map = new Map<string, ThemeConfig[]>();
  for (const t of themes) {
    const existing = map.get(t.category) || [];
    existing.push(t);
    map.set(t.category, existing);
  }
  return Array.from(map.entries()).map(([id, variants]) => ({
    id,
    label: variants[0].categoryLabel,
    defaultVariant: variants[0].id,
    variants,
  }));
}

export function getTheme(themeId: string): ThemeConfig {
  if (!themeId || themeId === 'default') return themes[0];
  return themes.find((t) => t.id === themeId) || themes[0];
}

export function applyThemeToProfile(themeId: string) {
  const theme = getTheme(themeId);
  return {
    theme: theme.id,
    borderRadius: theme.styles.borderRadius,
    buttonBorderRadius: theme.styles.buttonBorderRadius,
    productColumns: theme.styles.productColumns,
    cardTemplate: theme.styles.cardTemplate,
  };
}
