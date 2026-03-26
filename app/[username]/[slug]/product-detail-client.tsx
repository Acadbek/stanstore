'use client';

import { Profile, Product } from '@/lib/db/schema';
import { getTheme } from '@/lib/themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Props = {
  profile: Profile;
  product: Product;
};

export default function ProductDetailClient({ profile, product }: Props) {
  const theme = getTheme(profile.theme || 'default');
  const s = theme.styles;

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: s.pageBgGradient || s.pageBg }}
    >
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
            className="rounded-2xl overflow-hidden mb-6 shadow-lg"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          </div>
        ) : (
          <div
            className="rounded-2xl h-56 sm:h-72 mb-6 flex items-center justify-center shadow-lg"
            style={{ background: s.productBadge }}
          >
            <span className="text-6xl font-bold" style={{ color: s.productBadgeText }}>
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
              className="text-sm leading-relaxed product-content mb-4"
              style={{ color: s.textColor }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="flex items-center gap-3 pt-2">
            <span className="text-2xl font-bold" style={{ color: s.priceColor }}>
              {formatPrice(product.price)}
            </span>
            <span
              className="text-xs font-medium uppercase px-2.5 py-1 rounded-full"
              style={{ background: s.cardBg, color: s.mutedColor, border: `1px solid ${s.cardBorder}` }}
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
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 font-semibold text-base transition-all duration-200 no-underline"
            style={{
              background: s.buttonBg,
              color: s.buttonText,
            }}
          >
            Get this product
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <Button
            className="w-full rounded-xl py-3.5 text-base font-semibold"
            style={{
              background: s.buttonBg,
              color: s.buttonText,
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
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName || profile.username || ''} />
              <AvatarFallback className="text-sm" style={{ background: s.avatarFallback, color: s.avatarFallbackText }}>
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
              <p className="text-xs" style={{ color: s.mutedColor }}>{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-16" style={{ color: s.footerColor }}>
          Powered by ACME
        </p>
      </div>
    </div>
  );
}
