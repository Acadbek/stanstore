'use client';

import { useEffect, useRef } from 'react';
import { Profile, Product } from '@/lib/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { getTheme } from '@/lib/themes';
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

type StoreData = {
  profile: Profile;
  products: Product[];
};

type StorePageProps = {
  data: StoreData;
  embedded?: boolean;
  sidebarAction?: React.ReactNode;
};

type SocialLinks = {
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  website?: string | null;
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

function ProductLink({
  product,
  username,
  children,
}: {
  product: Product;
  username: string | null;
  children: React.ReactNode;
}) {
  function handleClick() {
    posthog.capture('product_click', {
      productId: product.id,
      productTitle: product.title,
      productType: product.type,
      productPrice: product.price,
      username,
    });
  }

  if (product.type === 'link' && product.productUrl) {
    return (
      <a
        href={product.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={`/${username}/${product.slug}`}
      className="block"
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

export default function StorePage({
  data,
  embedded = false,
  sidebarAction,
}: StorePageProps) {
  const { profile, products } = data;
  const theme = getTheme(profile.theme || 'default');
  const s = theme.styles;
  const r = getRadius(profile.borderRadius);
  const socialLinks = profile.socialLinks as SocialLinks | null;
  const serifFont = 'Hedvig Serif, serif';
  const sansFont = 'Hedvig Sans, Geist Sans, sans-serif';
  const profileRing = s.avatarRing || 'rgba(255, 255, 255, 0.88)';
  const smoothScrollRef = useRef<LocomotiveScroll | null>(null);

  useEffect(() => {
    posthog.capture('store_visit', {
      username: profile.username,
      displayName: profile.displayName,
    });
  }, [profile.username, profile.displayName]);

  useEffect(() => {
    if (embedded) return;

    let cancelled = false;
  
    async function initSmoothScroll() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const { default: LocomotiveScroll } = await import('locomotive-scroll');

      if (cancelled || smoothScrollRef.current) {
        return;
      }

      smoothScrollRef.current = new LocomotiveScroll({
        lenisOptions: {
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.58,
          wheelMultiplier: 1.6,
          touchMultiplier: 1.5,
          autoResize: true,
        },
        autoStart: true,
      });

      requestAnimationFrame(() => {
        smoothScrollRef.current?.resize();
      });
    }

    initSmoothScroll();

    return () => {
      cancelled = true;
      smoothScrollRef.current?.destroy();
      smoothScrollRef.current = null;
    };
  }, [embedded]);

  const socialItems: {
    url: string | null | undefined;
    icon: React.ReactNode;
  }[] = [
    {
      url: socialLinks?.twitter,
      icon: <TwitterIcon color={s.socialIconColor} />,
    },
    {
      url: socialLinks?.instagram,
      icon: <InstagramIcon color={s.socialIconColor} />,
    },
    {
      url: socialLinks?.youtube,
      icon: <YouTubeIcon color={s.socialIconColor} />,
    },
    {
      url: socialLinks?.tiktok,
      icon: <TikTokIcon color={s.socialIconColor} />,
    },
    {
      url: socialLinks?.website,
      icon: <GlobeIcon color={s.socialIconColor} />,
    },
  ];

  const filteredSocials = socialItems.filter((item) => item.url);

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div
      className={`${embedded ? 'h-full min-h-0 w-full overflow-y-auto md:overflow-hidden' : 'min-h-screen'} transition-colors duration-300`}
      style={{ background: s.pageBgGradient || s.pageBg }}
    >
      <div
        className={
          embedded
            ? 'h-full min-h-0 w-full px-0 py-0'
            : 'mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-0 lg:px-10'
        }
      >
        <div
          className={`grid w-full gap-10 md:grid-cols-[minmax(280px,38%)_minmax(0,62%)] md:gap-14 xl:gap-20 ${embedded ? 'px-6 py-6 md:h-full md:min-h-0 md:py-0 lg:px-8' : 'md:min-h-screen'}`}
        >
          <aside className={`md:sticky md:top-0 md:flex md:items-center md:py-10 ${embedded ? 'md:h-full' : 'md:h-screen'}`}>
            <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-sm">
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

              <div className="mt-8 space-y-3">
                <h1
                  className="text-4xl leading-none tracking-tight md:text-[3.2rem]"
                  style={{ color: s.headingColor, fontFamily: serifFont }}
                >
                  {profile.displayName || profile.username}
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

              {sidebarAction && <div className="mt-8">{sidebarAction}</div>}
            </div>
          </aside>

          <section
            className={`min-w-0 pb-12 pt-6 md:pb-12 md:pt-20 lg:pb-16 lg:pt-24 ${embedded ? 'md:h-full md:min-h-0 md:overflow-y-auto hide-scrollbar md:pb-8 md:pt-10 lg:pb-10 lg:pt-12' : ''}`}
          >
            {products.length > 0 &&
              (() => {
                const cols = profile.productColumns || 3;
                const tmpl = profile.cardTemplate || 'standard';
                const colClass =
                  cols === 1
                    ? 'grid-cols-1'
                    : cols === 2
                        ? 'grid-cols-2'
                    : cols === 4
                        ? 'grid-cols-2 sm:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-3';

                if (tmpl === 'compact') {
                  return (
                    <div className={`grid ${colClass} gap-4 md:gap-5`}>
                      {products.map((product) => (
                        <ProductLink
                          key={product.id}
                          product={product}
                          username={profile.username}
                        >
                            <div
                              className="group flex items-center gap-3 border p-3 transition-all duration-200"
                              style={{
                                background: s.cardBg,
                                borderColor: s.cardBorder,
                                borderRadius: r,
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = s.cardHoverShadow;
                                el.style.borderColor = s.cardHoverBorder;
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = 'none';
                                el.style.borderColor = s.cardBorder;
                              }}
                            >
                              {product.imageUrl ? (
                                <div
                                  className="w-16 h-16 shrink-0 overflow-hidden"
                                  style={{ borderRadius: r }}
                                >
                                  <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-16 h-16 shrink-0 flex items-center justify-center"
                                  style={{
                                    background: s.productBadge,
                                    borderRadius: r,
                                  }}
                                >
                                  <span
                                    className="text-xl font-bold"
                                    style={{ color: s.productBadgeText }}
                                  >
                                    {(product.title[0] || '').toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="font-semibold text-sm mb-1 truncate"
                                  style={{ color: s.headingColor }}
                                >
                                  {product.title}
                                </h3>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: s.priceColor }}
                                >
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            </div>
                          </ProductLink>
                        ))}
                      </div>
                    );
                  }

                  if (tmpl === 'overlay') {
                    return (
                      <div className={`grid ${colClass} gap-4 md:gap-5`}>
                        {products.map((product) => (
                          <ProductLink
                            key={product.id}
                            product={product}
                            username={profile.username}
                          >
                            <div
                              className="group relative overflow-hidden transition-all duration-200"
                              style={{ borderRadius: r }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = s.cardHoverShadow;
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = 'none';
                              }}
                            >
                              <div className="h-44">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ background: s.productBadge }}
                                  >
                                    <span
                                      className="text-4xl font-bold"
                                      style={{ color: s.productBadgeText }}
                                    >
                                      {(product.title[0] || '').toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div
                                className="absolute inset-x-0 bottom-0 p-3"
                                style={{
                                  background:
                                    'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                                }}
                              >
                                <h3 className="font-semibold text-sm text-white truncate">
                                  {product.title}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-white/70">
                                    {product.type}
                                  </span>
                                  <span className="text-sm font-bold text-white">
                                    {formatPrice(product.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </ProductLink>
                        ))}
                      </div>
                    );
                  }

                  if (tmpl === 'minimal') {
                    return (
                      <div className={`grid ${colClass} gap-4 md:gap-5`}>
                        {products.map((product) => (
                          <ProductLink
                            key={product.id}
                            product={product}
                            username={profile.username}
                          >
                            <div
                              className="group border p-4 transition-all duration-200"
                              style={{
                                background: s.cardBg,
                                borderColor: s.cardBorder,
                                borderRadius: r,
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = s.cardHoverShadow;
                                el.style.borderColor = s.cardHoverBorder;
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.boxShadow = 'none';
                                el.style.borderColor = s.cardBorder;
                              }}
                            >
                              <h3
                                className="font-semibold text-sm mb-1 truncate"
                                style={{ color: s.headingColor }}
                              >
                                {product.title}
                              </h3>
                              {product.description && (
                                <p
                                  className="text-xs line-clamp-2 mb-2"
                                  style={{ color: s.mutedColor }}
                                >
                                  {product.description}
                                </p>
                              )}
                              <div
                                className="pt-2 mt-auto"
                                style={{ borderTop: `1px solid ${s.cardBorder}` }}
                              >
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: s.priceColor }}
                                >
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            </div>
                          </ProductLink>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className={`grid ${colClass} gap-4 md:gap-5`}>
                      {products.map((product) => (
                        <ProductLink
                          key={product.id}
                          product={product}
                          username={profile.username}
                        >
                          <div
                            className="group border p-4 transition-all duration-200 h-full flex flex-col"
                            style={{
                              background: s.cardBg,
                              borderColor: s.cardBorder,
                              borderRadius: r,
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.boxShadow = s.cardHoverShadow;
                              el.style.borderColor = s.cardHoverBorder;
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.boxShadow = 'none';
                              el.style.borderColor = s.cardBorder;
                            }}
                          >
                            {product.imageUrl ? (
                              <div
                                className="mb-4 h-32 w-full overflow-hidden"
                                style={{ background: s.pageBg, borderRadius: r }}
                              >
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="mb-4 flex h-32 w-full items-center justify-center"
                                style={{
                                  background: s.productBadge,
                                  borderRadius: r,
                                }}
                              >
                                <span
                                  className="text-3xl font-bold"
                                  style={{ color: s.productBadgeText }}
                                >
                                  {(product.title[0] || '').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-sm mb-1 truncate"
                                style={{ color: s.headingColor }}
                              >
                                {product.title}
                              </h3>
                              {product.description && (
                                <p
                                  className="mb-3 text-xs line-clamp-2"
                                  style={{ color: s.mutedColor }}
                                >
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div
                              className="mt-auto flex items-center justify-between pt-3"
                              style={{ borderTop: `1px solid ${s.cardBorder}` }}
                            >
                              <span
                                className="text-sm font-bold"
                                style={{ color: s.priceColor }}
                              >
                                {formatPrice(product.price)}
                              </span>
                              <span
                                className="text-xs font-medium"
                                style={{ color: s.mutedColor }}
                              >
                                {product.type}
                              </span>
                            </div>
                          </div>
                        </ProductLink>
                      ))}
                    </div>
                  );
                })()}

              {products.length === 0 && (
                <p
                  className="text-center text-sm py-8"
                  style={{ color: s.mutedColor }}
                >
                  No products yet.
                </p>
              )}

              <p
                className="mt-14 pb-8 pt-4 text-center text-xs md:mt-16 md:pb-10 md:pt-6"
                style={{ color: s.footerColor, fontFamily: sansFont }}
              >
                Powered by ACME
              </p>
          </section>
        </div>
      </div>
    </div>
  );
}
