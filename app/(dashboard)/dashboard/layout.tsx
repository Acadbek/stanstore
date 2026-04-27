'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import {
  LayoutDashboard,
  Settings,
  Menu,
  UserCircle,
  Package,
  PanelLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTheme } from '@/lib/themes';
import type { Profile } from '@/lib/db/schema';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  {
    href: '/dashboard/profile',
    icon: UserCircle,
    label: 'Profile',
    matchPrefix: true,
  },
  { href: '/dashboard/products', icon: Package, label: 'Products' },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ProfileData = {
  profile: Profile | null;
};

function hexToRgba(hex: string, alpha: number): string | null {
  const cleaned = hex.trim().replace('#', '');
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace('#', '');
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(baseHex: string, blendHex: string, blendRatio: number): string | null {
  const base = hexToRgb(baseHex);
  const blend = hexToRgb(blendHex);
  if (!base || !blend) return null;
  const ratio = Math.max(0, Math.min(1, blendRatio));
  const inv = 1 - ratio;
  return rgbToHex(
    base.r * inv + blend.r * ratio,
    base.g * inv + blend.g * ratio,
    base.b * inv + blend.b * ratio
  );
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const linearize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foregroundHex: string, backgroundHex: string): number | null {
  const fgLum = relativeLuminance(foregroundHex);
  const bgLum = relativeLuminance(backgroundHex);
  if (fgLum === null || bgLum === null) return null;
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function isContrastSufficient(
  foregroundHex: string,
  backgroundHex: string,
  minRatio = 4.5
) {
  const ratio = contrastRatio(foregroundHex, backgroundHex);
  if (ratio === null) return false;
  return ratio >= minRatio;
}

function bestReadableText(
  backgroundHexes: string[],
  preferred?: string | null
): string {
  const candidates = [
    preferred || '',
    '#ffffff',
    '#0f172a',
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  let best = '#ffffff';
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = Math.min(
      ...backgroundHexes.map((bg) => contrastRatio(candidate, bg) ?? 0)
    );
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function deriveAccentHover(accentHex: string): string {
  const isLight = isLightHex(accentHex);
  if (isLight === null) {
    return mixHex(accentHex, '#0f172a', 0.14) || accentHex;
  }
  return isLight
    ? mixHex(accentHex, '#0f172a', 0.2) || accentHex
    : mixHex(accentHex, '#ffffff', 0.18) || accentHex;
}

function isLightHex(hex: string): boolean | null {
  const cleaned = hex.trim().replace('#', '');
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 160;
}

function readableTextOnSurface(
  surfaceHex: string,
  preferred?: string | null
) {
  return bestReadableText([surfaceHex], preferred);
}

function readableMutedOnSurface(
  surfaceHex: string,
  preferred: string | null | undefined,
  baseText: string
): string {
  const candidates = [
    preferred || '',
    mixHex(baseText, surfaceHex, 0.22) || '',
    mixHex(baseText, surfaceHex, 0.34) || '',
    mixHex(baseText, surfaceHex, 0.46) || '',
    mixHex(baseText, surfaceHex, 0.56) || '',
    baseText,
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  let best = baseText;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = contrastRatio(candidate, surfaceHex) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (bestScore < 3.7) {
    return baseText;
  }

  return best;
}

function getDashboardThemeVars(themeId?: string | null): CSSProperties {
  const theme = getTheme(themeId || 'default');
  const s = theme.styles;
  const accent = s.buttonBg || '#f97316';
  const derivedAccentHover = deriveAccentHover(accent);
  let accentHover = derivedAccentHover;
  let accentContrast = bestReadableText([accent, accentHover], s.buttonText);
  if (
    !isContrastSufficient(accentContrast, accent) ||
    !isContrastSufficient(accentContrast, accentHover)
  ) {
    accentHover = derivedAccentHover;
    accentContrast = bestReadableText([accent, accentHover], s.buttonText);
  }
  if (
    !isContrastSufficient(accentContrast, accent) ||
    !isContrastSufficient(accentContrast, accentHover)
  ) {
    accentHover = accent;
    accentContrast = bestReadableText([accent], s.buttonText);
  }
  if (!isContrastSufficient(accentContrast, accent)) {
    accentContrast = bestReadableText([accent], null);
  }
  const pageBg = s.pageBg || '#f8fafc';
  const foreground = readableTextOnSurface(pageBg, s.headingColor || '#111827');
  const pageMuted = readableMutedOnSurface(
    pageBg,
    s.mutedColor || '#6b7280',
    foreground
  );
  const pageIsLight = isLightHex(pageBg);
  const surface = s.cardBg || '#ffffff';
  const surfaceText = readableTextOnSurface(surface, s.headingColor || '#111827');
  const surfaceMuted = readableMutedOnSurface(
    surface,
    s.mutedColor || '#6b7280',
    surfaceText
  );
  const mutedForeground = surfaceMuted;
  const mutedSurface = hexToRgba(surface, 0.86) || '#f3f4f6';
  const sidebarBlendRatio = pageIsLight === false ? 0.56 : 0.48;
  const sidebarBg =
    mixHex(pageBg, surface, sidebarBlendRatio) ||
    hexToRgba(surface, 0.92) ||
    surface;
  const sidebarIsLight = isLightHex(sidebarBg);
  const sidebarText = readableTextOnSurface(sidebarBg, foreground);
  const sidebarIcon = readableMutedOnSurface(
    sidebarBg,
    sidebarIsLight === false ? '#cbd5e1' : '#475569',
    sidebarText
  );
  const sidebarLabel = readableMutedOnSurface(
    sidebarBg,
    sidebarIsLight === false ? '#e2e8f0' : '#334155',
    sidebarText
  );
  const sidebarHoverBgHex =
    mixHex(sidebarBg, accent, sidebarIsLight === false ? 0.18 : 0.12) ||
    (sidebarIsLight === false ? '#27374d' : '#f3f4f6');
  const sidebarActiveBgHex =
    mixHex(sidebarBg, accent, sidebarIsLight === false ? 0.28 : 0.2) ||
    (sidebarIsLight === false ? '#334155' : '#ffedd5');
  const sidebarHoverBg =
    hexToRgba(sidebarHoverBgHex, sidebarIsLight === false ? 0.94 : 0.96) ||
    sidebarHoverBgHex;
  const sidebarActiveBg =
    hexToRgba(sidebarActiveBgHex, sidebarIsLight === false ? 0.96 : 0.97) ||
    sidebarActiveBgHex;
  const sidebarIconActive = readableTextOnSurface(sidebarActiveBgHex, accent);
  const sidebarActiveRing = accent;
  const softAccent = hexToRgba(accent, 0.14) || '#ffedd5';

  return {
    ['--background' as string]: pageBg,
    ['--foreground' as string]: foreground,
    ['--card' as string]: surface,
    ['--card-foreground' as string]: surfaceText,
    ['--popover' as string]: surface,
    ['--popover-foreground' as string]: surfaceText,
    ['--primary' as string]: accent,
    ['--primary-foreground' as string]: accentContrast,
    ['--secondary' as string]: mutedSurface,
    ['--secondary-foreground' as string]: surfaceText,
    ['--muted' as string]: mutedSurface,
    ['--muted-foreground' as string]: mutedForeground,
    ['--accent' as string]: softAccent,
    ['--accent-foreground' as string]: surfaceText,
    ['--border' as string]: s.cardBorder || '#e5e7eb',
    ['--input' as string]: s.cardBorder || '#e5e7eb',
    ['--ring' as string]: accent,
    ['--color-background' as string]: pageBg,
    ['--color-foreground' as string]: foreground,
    ['--color-card' as string]: surface,
    ['--color-card-foreground' as string]: surfaceText,
    ['--color-popover' as string]: surface,
    ['--color-popover-foreground' as string]: surfaceText,
    ['--color-primary' as string]: accent,
    ['--color-primary-foreground' as string]: accentContrast,
    ['--color-secondary' as string]: mutedSurface,
    ['--color-secondary-foreground' as string]: surfaceText,
    ['--color-muted' as string]: mutedSurface,
    ['--color-muted-foreground' as string]: mutedForeground,
    ['--color-accent' as string]: softAccent,
    ['--color-accent-foreground' as string]: surfaceText,
    ['--color-border' as string]: s.cardBorder || '#e5e7eb',
    ['--color-input' as string]: s.cardBorder || '#e5e7eb',
    ['--color-ring' as string]: accent,
    ['--dashboard-bg' as string]: pageBg,
    ['--dashboard-bg-gradient' as string]:
      s.pageBgGradient || pageBg,
    ['--dashboard-page-text' as string]: foreground,
    ['--dashboard-surface' as string]: surface,
    ['--dashboard-surface-translucent' as string]:
      hexToRgba(surface, 0.9) || 'rgba(255,255,255,0.9)',
    ['--dashboard-surface-translucent-strong' as string]:
      hexToRgba(surface, 0.8) || 'rgba(255,255,255,0.8)',
    ['--dashboard-soft-bg' as string]: mutedSurface,
    ['--dashboard-border' as string]: s.cardBorder || '#e5e7eb',
    ['--dashboard-text' as string]: foreground,
    ['--dashboard-muted' as string]: pageMuted,
    ['--dashboard-surface-text' as string]: surfaceText,
    ['--dashboard-surface-muted' as string]: surfaceMuted,
    ['--dashboard-accent' as string]: accent,
    ['--dashboard-accent-hover' as string]: accentHover,
    ['--dashboard-accent-contrast' as string]: accentContrast,
    ['--dashboard-accent-soft' as string]: softAccent,
    ['--dashboard-accent-soft-border' as string]:
      hexToRgba(accent, 0.28) || '#fed7aa',
    ['--dashboard-sidebar-bg' as string]: sidebarBg,
    ['--dashboard-sidebar-border' as string]: s.cardBorder || '#e5e7eb',
    ['--dashboard-sidebar-icon' as string]: sidebarIcon,
    ['--dashboard-sidebar-label' as string]: sidebarLabel,
    ['--dashboard-sidebar-icon-active' as string]: sidebarIconActive,
    ['--dashboard-sidebar-active-ring' as string]: sidebarActiveRing,
    ['--dashboard-sidebar-hover-bg' as string]: sidebarHoverBg,
    ['--dashboard-sidebar-active-bg' as string]: sidebarActiveBg,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { data: profileData } = useSWR<ProfileData>('/api/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  const themeVars = useMemo(
    () => getDashboardThemeVars(profileData?.profile?.theme),
    [profileData?.profile?.theme]
  );

  return (
    <div
      className="dashboard-themed flex w-full min-h-dvh lg:h-dvh lg:overflow-hidden"
      style={themeVars}
    >
      <aside
        className={`dashboard-sidebar border-r border-gray-200 lg:block lg:h-full shrink-0 ${
          isSidebarOpen ? 'block' : 'hidden'
        } lg:relative absolute inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-14' : 'w-40'}`}
      >
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-medium">Settings</span>
          <Button
            variant="ghost"
            className="dashboard-sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <div className="hidden lg:flex items-center h-12 pt-4 px-2">
          <div className="ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="dashboard-sidebar-toggle h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelLeft className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
        <nav className="flex h-full min-h-0 flex-col overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.href)
              : pathname === item.href;
            const button = (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  data-active={isActive ? 'true' : 'false'}
                  className={`dashboard-sidebar-link shadow-none my-0.5 w-full ${
                    isCollapsed ? 'justify-center px-0' : 'justify-start'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="dashboard-sidebar-icon h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="dashboard-sidebar-label ml-1">{item.label}</span>
                  )}
                </Button>
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>
      </aside>

      {!isSidebarOpen && (
        <button
          type="button"
          className="lg:hidden fixed bottom-4 right-4 z-50 h-12 w-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <main className="flex-1 min-w-0 p-4 lg:p-0 lg:h-full lg:min-h-0 lg:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
