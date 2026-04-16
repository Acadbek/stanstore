'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Profile, Product } from '@/lib/db/schema';
import { getTheme } from '@/lib/themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';
import type LocomotiveScroll from 'locomotive-scroll';

const radiusMap: Record<string, string> = {
  none: '0px',
  sm: '2px',
  md: '6px',
  lg: '8px',
  xl: '16px',
  full: '9999px',
};

const getRadius = (id?: string | null) => radiusMap[id || 'md'] || '6px';

type SocialLinks = {
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  website?: string | null;
};

type Props = {
  profile: Profile;
  product: Product;
};

function TwitterIcon({ color }: { color?: string }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={color ? { color } : undefined}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ color }: { color?: string }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={color ? { color } : undefined}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ color }: { color?: string }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={color ? { color } : undefined}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TikTokIcon({ color }: { color?: string }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={color ? { color } : undefined}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11V9.02a6.34 6.34 0 0 0-.82-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.8a4.84 4.84 0 0 1-1-.11z" />
    </svg>
  );
}

function GlobeIcon({ color }: { color?: string }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={color ? { color } : undefined}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export default function ProductDetailClient({ profile, product }: Props) {
  const theme = getTheme(profile.theme || 'default');
  const s = theme.styles;
  const cr = getRadius(profile.borderRadius);
  const br = getRadius(profile.buttonBorderRadius);
  const socialLinks = profile.socialLinks as SocialLinks | null;
  const serifFont = 'Hedvig Serif, serif';
  const sansFont = 'Hedvig Sans, Geist Sans, sans-serif';
  const profileRing = s.avatarRing || 'rgba(255, 255, 255, 0.88)';
  const smoothScrollRef = useRef<LocomotiveScroll | null>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  const socialItems: {
    url: string | null | undefined;
    icon: ReactNode;
  }[] = [
    { url: socialLinks?.twitter, icon: <TwitterIcon color={s.socialIconColor} /> },
    { url: socialLinks?.instagram, icon: <InstagramIcon color={s.socialIconColor} /> },
    { url: socialLinks?.youtube, icon: <YouTubeIcon color={s.socialIconColor} /> },
    { url: socialLinks?.tiktok, icon: <TikTokIcon color={s.socialIconColor} /> },
    { url: socialLinks?.website, icon: <GlobeIcon color={s.socialIconColor} /> },
  ];
  const filteredSocials = socialItems.filter((item) => item.url);

  useEffect(() => {
    posthog.capture('product_view', {
      productId: product.id,
      productTitle: product.title,
      productType: product.type,
      productPrice: product.price,
      username: profile.username,
    });
  }, [
    product.id,
    product.title,
    product.type,
    product.price,
    profile.username,
  ]);

  useEffect(() => {
    const root = descriptionRef.current;
    if (!root) return;

    const carousels = Array.from(
      root.querySelectorAll<HTMLElement>('[data-carousel]')
    );

    carousels.forEach((carousel) => {
      if (carousel.dataset.carouselReady === 'true') return;

      const items = Array.from(
        carousel.querySelectorAll<HTMLElement>('[data-carousel-item]')
      );
      const count = items.length;
      carousel.dataset.count = String(count);

      if (count <= 2) {
        carousel.classList.add('is-static');
        carousel.dataset.carouselReady = 'true';
        return;
      }

      carousel.classList.add('is-carousel');

      const parent = carousel.parentElement;
      if (!parent || parent.classList.contains('carousel-shell')) {
        carousel.dataset.carouselReady = 'true';
        return;
      }

      const shell = document.createElement('div');
      shell.className = 'carousel-shell';

      const prevButton = document.createElement('button');
      prevButton.type = 'button';
      prevButton.className = 'carousel-nav carousel-prev';
      prevButton.setAttribute('aria-label', 'Previous');
      prevButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
      prevButton.addEventListener('click', () => {
        carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
      });

      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'carousel-nav carousel-next';
      nextButton.setAttribute('aria-label', 'Next');
      nextButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      nextButton.addEventListener('click', () => {
        carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
      });

      parent.insertBefore(shell, carousel);
      shell.appendChild(prevButton);
      shell.appendChild(carousel);
      shell.appendChild(nextButton);

      carousel.dataset.carouselReady = 'true';
    });
  }, [product.description]);

  useEffect(() => {
    const root = descriptionRef.current;
    if (!root) return;

    const embeds = Array.from(
      root.querySelectorAll<HTMLElement>('[data-youtube-embed]')
    );

    embeds.forEach((el) => {
      if (el.dataset.ytReady === 'true') return;
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (!src) return;

      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';

      el.innerHTML = '';
      el.appendChild(iframe);
      el.dataset.ytReady = 'true';
    });
  }, [product.description]);

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  useEffect(() => {
    let cancelled = false;

    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    function destroySmoothScroll() {
      smoothScrollRef.current?.destroy();
      smoothScrollRef.current = null;
    }

    async function syncSmoothScroll() {
      destroySmoothScroll();

      if (reducedMotionQuery.matches || !desktopQuery.matches) {
        return;
      }

      const wrapper = contentScrollRef.current;
      const content = contentInnerRef.current;

      if (!wrapper || !content) {
        return;
      }

      const { default: LocomotiveScroll } = await import('locomotive-scroll');

      if (cancelled || reducedMotionQuery.matches || !desktopQuery.matches) {
        return;
      }

      smoothScrollRef.current = new LocomotiveScroll({
        lenisOptions: {
          wrapper,
          content,
          eventsTarget: window,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.58,
          wheelMultiplier: 1.16,
          touchMultiplier: 1,
          autoResize: true,
        },
        autoStart: true,
      });

      requestAnimationFrame(() => {
        smoothScrollRef.current?.resize();
      });
    }

    void syncSmoothScroll();

    const handleMediaChange = () => {
      void syncSmoothScroll();
    };

    desktopQuery.addEventListener('change', handleMediaChange);
    reducedMotionQuery.addEventListener('change', handleMediaChange);

    return () => {
      cancelled = true;
      desktopQuery.removeEventListener('change', handleMediaChange);
      reducedMotionQuery.removeEventListener('change', handleMediaChange);
      destroySmoothScroll();
    };
  }, []);

  return (
    <div
      className="min-h-screen transition-colors duration-300 lg:h-screen lg:overflow-hidden"
      style={{ background: s.pageBgGradient || s.pageBg }}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-0 lg:h-full lg:px-10">
        <div className="grid gap-10 lg:h-full lg:grid-cols-[minmax(280px,38%)_minmax(0,62%)] lg:gap-14 xl:gap-20">
          <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:py-10">
            <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-sm">
              <Link href={`/${profile.username}`} className="inline-block">
                <Avatar
                  className="h-28 w-28 md:h-32 md:w-32"
                  style={{ boxShadow: `0 0 0 8px ${profileRing}` }}
                >
                  <AvatarImage
                    src={profile.avatarUrl || undefined}
                    alt={profile.displayName || profile.username || ''}
                  />
                  <AvatarFallback
                    className="text-3xl"
                    style={{
                      background: s.avatarFallback,
                      color: s.avatarFallbackText,
                      fontFamily: serifFont,
                    }}
                  >
                    {(profile.displayName || profile.username || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="mt-8 space-y-3">
                <h1
                  className="text-4xl leading-none tracking-tight md:text-[3.2rem]"
                  style={{ color: s.headingColor, fontFamily: serifFont }}
                >
                  <Link href={`/${profile.username}`} className="no-underline">
                    {profile.displayName || profile.username}
                  </Link>
                </h1>

                {profile.headline && (
                  <p
                    className="text-xs uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.18em]"
                    style={{ color: s.mutedColor, fontFamily: sansFont }}
                  >
                    {profile.headline}
                  </p>
                )}
              </div>

              {profile.bio && (
                <p
                  className="mt-6 max-w-md text-sm leading-7 md:text-[0.95rem]"
                  style={{ color: s.textColor, fontFamily: sansFont }}
                >
                  {profile.bio}
                </p>
              )}

              {filteredSocials.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {filteredSocials.map((social, i) => (
                    <a
                      key={i}
                      href={social.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center border transition-all duration-200"
                      style={{
                        color: s.socialIconColor,
                        borderColor: s.cardBorder,
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.48)',
                        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = s.socialIconHover;
                        el.style.transform = 'translateY(-2px)';
                        el.style.boxShadow = '0 16px 34px rgba(15, 23, 42, 0.10)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = s.socialIconColor;
                        el.style.transform = 'translateY(0)';
                        el.style.boxShadow = '0 10px 28px rgba(15, 23, 42, 0.05)';
                      }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 lg:h-screen lg:overflow-hidden">
            <section
              ref={contentScrollRef}
              className="hide-scrollbar lg:-mr-6 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-6 xl:-mr-8 xl:pr-8"
            >
              <div
                ref={contentInnerRef}
                className="mx-auto max-w-md px-0 pb-12 pt-0 sm:max-w-xl lg:max-w-3xl lg:pb-16 lg:pt-12"
              >
              {product.imageUrl ? (
                <div
                  className="relative mb-8 overflow-hidden shadow-lg"
                  style={{
                    borderRadius: cr,
                    boxShadow: '0 18px 50px rgba(0,0,0,0.14)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.03) 26%, rgba(15,23,42,0.24) 100%)',
                    }}
                  />
                  <div className="absolute left-4 top-4 z-20">
                    <Link
                      href={`/${profile.username}`}
                      aria-label="Back to store"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200"
                      style={{
                        color: '#fff',
                        background: 'rgba(15, 23, 42, 0.26)',
                        borderColor: 'rgba(255,255,255,0.24)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
                  />
                </div>
              ) : (
                <div
                  className="relative mb-8 flex h-64 items-center justify-center overflow-hidden shadow-lg sm:h-80 lg:h-[26rem]"
                  style={{
                    background: s.productBadge,
                    borderRadius: cr,
                    boxShadow: '0 18px 50px rgba(0,0,0,0.14)',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 34%), radial-gradient(circle at bottom right, rgba(15,23,42,0.14), transparent 42%)',
                    }}
                  />
                  <div className="absolute left-4 top-4 z-10">
                    <Link
                      href={`/${profile.username}`}
                      aria-label="Back to store"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200"
                      style={{
                        color: s.headingColor,
                        background: 'rgba(255,255,255,0.58)',
                        borderColor: s.cardBorder,
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                  <span
                    className="relative z-[1] text-6xl font-bold"
                    style={{ color: s.productBadgeText }}
                  >
                    {product.title[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h1
                  className="text-2xl font-bold"
                  style={{ color: s.headingColor }}
                >
                  {product.title}
                </h1>

                {product.description && (
                  <div
                    ref={descriptionRef}
                    className="text-sm leading-relaxed product-content mb-4"
                    style={{ color: s.textColor }}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}

                <div className="flex items-center gap-3 pt-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: s.priceColor }}
                  >
                    {formatPrice(product.price)}
                  </span>
                  <span
                    className="text-xs font-medium uppercase px-2.5 py-1"
                    style={{
                      background: s.cardBg,
                      color: s.mutedColor,
                      border: `1px solid ${s.cardBorder}`,
                      borderRadius: br,
                    }}
                  >
                    {product.type}
                  </span>
                </div>
              </div>

              {product.productUrl ? (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 font-semibold text-base transition-all duration-200 no-underline"
                  style={{
                    background: s.buttonBg,
                    color: s.buttonText,
                    borderRadius: br,
                  }}
                  onClick={() => {
                    posthog.capture('product_get', {
                      productId: product.id,
                      productTitle: product.title,
                      productType: product.type,
                      productPrice: product.price,
                      username: profile.username,
                    });
                  }}
                >
                  Get this product
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Button
                  className="w-full py-3.5 text-base font-semibold"
                  style={{
                    background: s.buttonBg,
                    color: s.buttonText,
                    borderRadius: br,
                  }}
                  onClick={() => {
                    posthog.capture('product_get', {
                      productId: product.id,
                      productTitle: product.title,
                      productType: product.type,
                      productPrice: product.price,
                      username: profile.username,
                    });
                  }}
                >
                  Get this product
                </Button>
              )}

              <div
                className="flex items-center gap-3 mt-8 pt-6 lg:hidden"
                style={{ borderTop: `1px solid ${s.cardBorder}` }}
              >
                <Link href={`/${profile.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={profile.avatarUrl || undefined}
                      alt={profile.displayName || profile.username || ''}
                    />
                    <AvatarFallback
                      className="text-sm"
                      style={{
                        background: s.avatarFallback,
                        color: s.avatarFallbackText,
                      }}
                    >
                      {(profile.displayName || profile.username || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/${profile.username}`}
                    className="text-sm font-semibold no-underline"
                    style={{ color: s.headingColor }}
                  >
                    {profile.displayName || profile.username}
                  </Link>
                  {profile.headline && (
                    <p className="text-xs" style={{ color: s.mutedColor }}>
                      {profile.headline}
                    </p>
                  )}
                </div>
              </div>

              <p
                className="text-center text-xs mt-16"
                style={{ color: s.footerColor, fontFamily: sansFont }}
              >
                Powered by ACME
              </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
