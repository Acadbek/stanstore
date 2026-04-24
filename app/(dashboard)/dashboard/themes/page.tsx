'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronLeft, ChevronRight, AtSign } from 'lucide-react';
import { themes, getTheme, applyThemeToProfile, type ThemeConfig } from '@/lib/themes';
import { updateProfile } from '../profile/actions';
import { Profile, Product } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ProfileData = {
  user: { name?: string | null; email?: string | null };
  profile: Profile | null;
};

const radiusMap: Record<string, string> = {
  none: '0px',
  sm: '2px',
  md: '6px',
  lg: '8px',
  xl: '16px',
  full: '9999px',
};

const getRadius = (id: string) => radiusMap[id] || '6px';
const serifFont = 'Hedvig Serif, serif';
const sansFont = 'Hedvig Sans, Geist Sans, sans-serif';

function MiniStorePreview({ theme, profile }: { theme: ThemeConfig; profile: Profile | null }) {
  const s = theme.styles;
  const cr = getRadius(s.borderRadius);
  const br = getRadius(s.buttonBorderRadius);
  const hf = s.headingFont === 'serif' ? serifFont : sansFont;
  const bf = s.bodyFont === 'serif' ? serifFont : sansFont;

  return (
    <div
      className="w-full h-full p-3 overflow-hidden"
      style={{ background: s.pageBgGradient || s.pageBg }}
    >
      <div className="flex flex-col items-center text-center mb-3">
        <div
          className="w-8 h-8 flex items-center justify-center text-[8px] font-bold mb-1"
          style={{
            borderRadius: '50%',
            background: s.avatarFallback,
            color: s.avatarFallbackText,
          }}
        >
          {(profile?.displayName || profile?.username || 'U')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <p
          className="text-[9px] font-bold leading-tight"
          style={{ color: s.headingColor, fontFamily: hf }}
        >
          {profile?.displayName || profile?.username || 'Your Name'}
        </p>
        {profile?.headline && (
          <p className="text-[6px] mt-0.5" style={{ color: s.mutedColor, fontFamily: bf }}>
            {profile.headline}
          </p>
        )}
      </div>

      <div className="space-y-1.5 mb-2">
        {s.cardTemplate === 'compact' ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 border p-1.5"
                style={{
                  background: s.cardBg,
                  borderColor: s.cardBorder,
                  borderRadius: cr,
                }}
              >
                <div
                  className="w-5 h-5 shrink-0 flex items-center justify-center text-[5px] font-bold"
                  style={{ background: s.productBadge, color: s.productBadgeText, borderRadius: cr }}
                >
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[6px] font-semibold truncate" style={{ color: s.headingColor }}>
                    Product {i}
                  </p>
                  <p className="text-[6px] font-bold" style={{ color: s.priceColor }}>
                    ${i * 29}
                  </p>
                </div>
              </div>
            ))}
          </>
        ) : s.cardTemplate === 'overlay' ? (
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{ background: s.productBadge, borderRadius: cr }}
              >
                <div className="h-10 flex items-center justify-center">
                  <span className="text-[10px] font-bold" style={{ color: s.productBadgeText }}>
                    P{i}
                  </span>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 p-1"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                >
                  <p className="text-[5px] font-semibold text-white truncate">Product {i}</p>
                  <p className="text-[5px] font-bold text-white">${i * 29}</p>
                </div>
              </div>
            ))}
          </div>
        ) : s.cardTemplate === 'minimal' ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border p-1.5"
                style={{
                  background: s.cardBg,
                  borderColor: s.cardBorder,
                  borderRadius: cr,
                }}
              >
                <p className="text-[6px] font-semibold truncate" style={{ color: s.headingColor }}>
                  Product {i}
                </p>
                <div className="mt-0.5" style={{ borderTop: `1px solid ${s.cardBorder}` }}>
                  <p className="text-[6px] font-bold" style={{ color: s.priceColor }}>
                    ${i * 29}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border p-1.5"
                style={{
                  background: s.cardBg,
                  borderColor: s.cardBorder,
                  borderRadius: cr,
                }}
              >
                <div
                  className="w-full h-6 mb-1 flex items-center justify-center"
                  style={{ background: s.productBadge, borderRadius: cr }}
                >
                  <span className="text-[7px] font-bold" style={{ color: s.productBadgeText }}>
                    P{i}
                  </span>
                </div>
                <p className="text-[6px] font-semibold truncate" style={{ color: s.headingColor }}>
                  Product {i}
                </p>
                <p className="text-[5px] font-bold" style={{ color: s.priceColor }}>
                  ${i * 29}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 justify-center mt-1">
        <button
          className="px-2 py-0.5 text-[6px] font-medium"
          style={{ background: s.buttonBg, color: s.buttonText, borderRadius: br }}
        >
          Get
        </button>
      </div>

      <p className="text-center text-[5px] mt-2" style={{ color: s.footerColor, fontFamily: bf }}>
        Powered by ACME
      </p>
    </div>
  );
}

function PhoneThemeCard({
  theme,
  profile,
  isActive,
  onClick,
}: {
  theme: ThemeConfig;
  profile: Profile | null;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 w-[260px] sm:w-[280px] snap-center focus:outline-none`}
    >
      <div
        className={`relative mx-auto transition-all duration-300 ${
          isActive ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-50'
        }`}
        style={{ width: 260, height: 530 }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 40 }}
        >
          <div className="absolute inset-0" style={{ top: 50, bottom: 30, left: 10, right: 10 }}>
            <MiniStorePreview theme={theme} profile={profile} />
          </div>
        </div>
        <img
          src="/frame.png"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          draggable={false}
        />
      </div>
    </button>
  );
}

function ThemeCarousel({
  profile,
  onSelect,
}: {
  profile: Profile | null;
  onSelect: (theme: ThemeConfig) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = 260;
    const gap = 16;
    const scrollLeft = el.scrollLeft;
    const newIndex = Math.round(scrollLeft / (itemWidth + gap));
    if (newIndex >= 0 && newIndex < themes.length) {
      setActiveIndex(newIndex);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = 260;
    const gap = 16;
    el.scrollTo({ left: index * (itemWidth + gap), behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(themes[activeIndex]);
  }, [activeIndex, onSelect]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (isDragging.current) return;
      scrollToIndex(index);
    },
    [scrollToIndex]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startX = 0;
    const onDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = false;
      startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      if (Math.abs(x - startX) > 5) isDragging.current = true;
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const activeTheme = themes[activeIndex];

  return (
    <div className="flex flex-col items-center">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 py-4 scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {themes.map((theme, index) => (
          <PhoneThemeCard
            key={theme.id}
            theme={theme}
            profile={profile}
            isActive={index === activeIndex}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>

        <div className="flex items-center gap-1.5">
          {themes.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-6 h-2 bg-orange-500'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToIndex(Math.min(themes.length - 1, activeIndex + 1))}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="text-center mt-4 mb-2 px-6">
        <h3 className="text-lg font-bold text-gray-900">{activeTheme.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{activeTheme.description}</p>
      </div>

      <Button
        onClick={handleSelect}
        className="bg-orange-500 hover:bg-orange-600 text-white w-full max-w-xs mt-2 py-3 text-base font-semibold"
      >
        Use this theme
      </Button>
    </div>
  );
}

function ProfileSetupStep({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('displayName', displayName.trim());
      formData.append('theme', 'minimalist-business');
      formData.append('borderRadius', 'sm');
      formData.append('buttonBorderRadius', 'md');
      formData.append('productColumns', '3');
      formData.append('cardTemplate', 'standard');

      const result = await updateProfile({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        mutate('/api/profile');
        onSuccess();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-2">Profilingizni yarating</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Public sahifangiz uchun asosiy ma&apos;lumotlarni kiriting
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="mb-2 flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="username"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              pattern="^[a-zA-Z0-9_-]{3,30}$"
              title="Only letters, numbers, underscores, and hyphens. 3-30 characters."
            />
          </div>

          <div>
            <Label htmlFor="displayName" className="mb-2">
              Display Name
            </Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full py-3 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Davom etish'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'loading' | 'profile' | 'themes'>('loading');

  const { data: profileData } = useSWR<ProfileData>('/api/profile', fetcher);
  const { data: products } = useSWR<Product[]>('/api/products', fetcher);

  useEffect(() => {
    if (!profileData) return;
    if (products && products.length > 0) {
      router.push('/dashboard');
      return;
    }
    if (profileData.profile) {
      setStep('themes');
    } else {
      setStep('profile');
    }
  }, [profileData, products, router]);

  const handleThemeSelect = async (theme: ThemeConfig) => {
    setIsSaving(true);
    try {
      const themeProps = applyThemeToProfile(theme.id);
      const profile = profileData?.profile;

      const formData = new FormData();
      formData.append('username', profile?.username || profileData?.user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user');
      if (profile?.displayName) formData.append('displayName', profile.displayName);
      if (profile?.headline) formData.append('headline', profile.headline);
      if (profile?.bio) formData.append('bio', profile.bio);
      formData.append('theme', themeProps.theme);
      formData.append('borderRadius', themeProps.borderRadius);
      formData.append('buttonBorderRadius', themeProps.buttonBorderRadius);
      formData.append('productColumns', String(themeProps.productColumns));
      formData.append('cardTemplate', themeProps.cardTemplate);

      await updateProfile({}, formData);
      mutate('/api/profile');
      router.push('/dashboard/products?create=true');
    } catch {
      setIsSaving(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <section className="flex-1 lg:p-8">
        <ProfileSetupStep onSuccess={() => setStep('themes')} />
      </section>
    );
  }

  return (
    <section className="flex-1 lg:p-8">
      <div className="flex flex-col items-center pt-4 pb-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Theme tanlang</h1>
        <p className="text-sm text-gray-500 mb-6 text-center px-6">
          Public profilingiz uchun mos dizaynni tanlang
        </p>

        {isSaving ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-20">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving theme...
          </div>
        ) : (
          <ThemeCarousel
            profile={profileData?.profile || null}
            onSelect={handleThemeSelect}
          />
        )}
      </div>
    </section>
  );
}
