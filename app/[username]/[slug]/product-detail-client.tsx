'use client';

import { useEffect, useRef } from 'react';
import { Profile, Product } from '@/lib/db/schema';
import { getTheme } from '@/lib/themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import PageviewTracker from '@/components/analytics/pageview-tracker';

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
  const descriptionRef = useRef<HTMLDivElement>(null);

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

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: s.pageBgGradient || s.pageBg }}
    >
      <PageviewTracker profileId={profile.id} page="product" />
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href={`/${profile.username}`}
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors duration-200"
          style={{ color: s.mutedColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

        {/* Cover Image */}
        {product.imageUrl ? (
          <div
            className="overflow-hidden mb-6 shadow-lg"
            style={{
              borderRadius: cr,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            }}
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          </div>
        ) : (
          <div
            className="h-56 sm:h-72 mb-6 flex items-center justify-center shadow-lg"
            style={{ background: s.productBadge, borderRadius: cr }}
          >
            <span
              className="text-6xl font-bold"
              style={{ color: s.productBadgeText }}
            >
              {product.title[0]?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-4 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: s.headingColor }}>
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

        {/* CTA Button */}
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
          >
            Get this product
          </Button>
        )}

        {/* Creator Info */}
        <div
          className="flex items-center gap-3 mt-8 pt-6"
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

        {/* Footer */}
        <p
          className="text-center text-xs mt-16"
          style={{ color: s.footerColor }}
        >
          Powered by ACME
        </p>
      </div>
    </div>
  );
}
