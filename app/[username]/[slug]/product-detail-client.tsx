'use client';

import { useEffect, useRef, useState } from 'react';
import { Profile, Product } from '@/lib/db/schema';
import { getTheme } from '@/lib/themes';
import { StorePageShell } from '@/components/store/store-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

const radiusMap: Record<string, string> = {
  none: '0px',
  sm: '2px',
  md: '6px',
  lg: '8px',
  xl: '16px',
  full: '9999px',
};

const getRadius = (id?: string | null) => radiusMap[id || 'md'] || '6px';

type Props = {
  profile: Profile;
  product: Product;
};

export default function ProductDetailClient({ profile, product }: Props) {
  const theme = getTheme(profile.theme || 'default');
  const s = theme.styles;
  const cr = getRadius(profile.borderRadius);
  const br = getRadius(profile.buttonBorderRadius);
  const serifFont = 'Hedvig Serif, serif';
  const sansFont = 'Hedvig Sans, Geist Sans, sans-serif';
  const heroImageRef = useRef<HTMLImageElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(!product.imageUrl);

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
    setIsHeroImageLoaded(!product.imageUrl);
  }, [product.imageUrl]);

  useEffect(() => {
    if (!product.imageUrl) return;

    const image = heroImageRef.current;
    if (!image) return;

    if (image.complete) {
      setIsHeroImageLoaded(true);
    }
  }, [product.imageUrl]);

  useEffect(() => {
    const root = descriptionRef.current;
    if (!root) return;

    const embeds = Array.from(
      root.querySelectorAll<HTMLElement>('[data-youtube-embed]')
    );
    const cleanupFns: Array<() => void> = [];

    embeds.forEach((el) => {
      if (el.dataset.ytReady === 'true') return;
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (!src) return;

      el.classList.add('content-media-shell');
      el.dataset.loading = 'true';

      if (!el.querySelector(':scope > .content-media-loader')) {
        const loader = document.createElement('div');
        loader.className = 'content-media-loader';
        loader.setAttribute('aria-hidden', 'true');
        loader.innerHTML =
          '<div class="content-media-loader__spinner"></div><div class="content-media-loader__bar"><span></span></div>';
        el.appendChild(loader);
      }

      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.className = 'content-media-frame';

      const markLoaded = () => {
        el.dataset.loading = 'false';
      };

      iframe.addEventListener('load', markLoaded, { once: true });
      cleanupFns.push(() => iframe.removeEventListener('load', markLoaded));

      const timeoutId = window.setTimeout(markLoaded, 12000);
      cleanupFns.push(() => window.clearTimeout(timeoutId));

      el.appendChild(iframe);
      el.dataset.ytReady = 'true';
    });

    const images = Array.from(
      root.querySelectorAll<HTMLImageElement>('img')
    ).filter(
      (img) =>
        !img.closest('[data-youtube-embed]') &&
        !img.closest('[data-google-calendar-embed]')
    );

    images.forEach((img) => {
      let shell: HTMLElement | null = img.parentElement;

      if (!shell || !shell.classList.contains('content-media-shell')) {
        const wrapper = document.createElement('span');
        wrapper.className = 'content-media-shell';
        img.parentNode?.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        shell = wrapper;
      }

      shell.classList.add('content-media-shell--image');
      shell.dataset.loading = 'true';
      img.classList.add('content-media-image');

      if (!shell.querySelector(':scope > .content-media-loader')) {
        const loader = document.createElement('span');
        loader.className = 'content-media-loader';
        loader.setAttribute('aria-hidden', 'true');
        loader.innerHTML =
          '<span class="content-media-loader__spinner"></span><span class="content-media-loader__bar"><span></span></span>';
        shell.appendChild(loader);
      }

      const markLoaded = () => {
        shell!.dataset.loading = 'false';
      };

      if (img.complete) {
        markLoaded();
        return;
      }

      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
      cleanupFns.push(() => img.removeEventListener('load', markLoaded));
      cleanupFns.push(() => img.removeEventListener('error', markLoaded));
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [product.description]);

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <StorePageShell
      profile={profile}
      styles={s}
      linkProfile
      rootClassName="lg:h-screen lg:overflow-hidden"
      containerClassName="lg:h-full"
      gridClassName="lg:h-full lg:grid-cols-[minmax(280px,38%)_minmax(0,62%)]"
      sidebarClassName="lg:h-screen"
      contentClassName="lg:h-screen lg:overflow-hidden"
    >
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
              {!isHeroImageLoaded && (
                <div
                  className="content-media-loader content-media-loader--cover"
                  aria-hidden="true"
                >
                  <div className="content-media-loader__spinner"></div>
                  <div className="content-media-loader__bar">
                    <span></span>
                  </div>
                </div>
              )}
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
                ref={heroImageRef}
                src={product.imageUrl}
                alt={product.title}
                className={`h-64 w-full object-cover transition-opacity duration-300 sm:h-80 lg:h-[26rem] ${isHeroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsHeroImageLoaded(true)}
                onError={() => setIsHeroImageLoaded(true)}
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
    </StorePageShell>
  );
}
