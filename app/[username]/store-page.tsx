'use client';

import { useEffect } from 'react';
import { Profile, Product } from '@/lib/db/schema';
import { StorePageShell } from '@/components/store/store-shell';
import Link from 'next/link';
import { getTheme } from '@/lib/themes';
import { resolveFrontStyle } from '@/lib/product-front-style';
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

function stripHtml(value: string | null | undefined) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type StoreData = {
  profile: Profile;
  products: Product[];
};

type StorePageProps = {
  data: StoreData;
  embedded?: boolean;
  sidebarAction?: React.ReactNode;
};

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
  const br = getRadius(profile.buttonBorderRadius);

  useEffect(() => {
    posthog.capture('store_visit', {
      username: profile.username,
      displayName: profile.displayName,
    });
  }, [profile.username, profile.displayName]);

  const formatPrice = (price: number | null) => {
    if (!price) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  const getButtonLabel = (product: Product) => {
    if (product.type === 'booking') return 'Book now';
    if (product.type === 'link') return 'Open link';
    if (!product.price) return 'Get it free';
    return 'Get this product';
  };

  const renderFrontOverride = (product: Product) => {
    const frontStyle = resolveFrontStyle(
      product.frontStyle,
      product.frontStylePrompt
    );

    if (!frontStyle) {
      return null;
    }

    const titleClass =
      frontStyle.titleFont === 'serif' ? 'font-serif' : 'font-semibold';
    const imageClass =
      frontStyle.imageShape === 'circle' ? 'rounded-full' : 'rounded-xl';
    const priceLabel = formatPrice(product.price);
    const descriptionText = stripHtml(product.description);
    const buttonLabel = getButtonLabel(product);

    if (frontStyle.preset === 'pill') {
      return (
        <div
          className="group flex items-center gap-3 border p-3 transition-all duration-200"
          style={{
            background: frontStyle.bgColor,
            borderColor: frontStyle.borderColor,
            borderRadius: 9999,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = s.cardHoverShadow;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = 'none';
          }}
        >
          {product.imageUrl ? (
            <div className={`h-12 w-12 shrink-0 overflow-hidden ${imageClass}`}>
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center ${imageClass}`}
              style={{ background: frontStyle.accentColor, color: '#fff' }}
            >
              {(product.title[0] || '').toUpperCase()}
            </div>
          )}
          <h3
            className={`min-w-0 flex-1 truncate text-base ${titleClass}`}
            style={{ color: frontStyle.textColor }}
          >
            {product.title}
          </h3>
          {frontStyle.arrow ? (
            <span
              className="shrink-0 text-lg"
              style={{ color: frontStyle.textColor }}
            >
              -&gt;
            </span>
          ) : (
            <span
              className="shrink-0 text-sm font-semibold"
              style={{ color: frontStyle.accentColor }}
            >
              {priceLabel}
            </span>
          )}
        </div>
      );
    }

    if (frontStyle.preset === 'editorial') {
      return (
        <div
          className="group border p-4 transition-all duration-200"
          style={{
            background: frontStyle.bgColor,
            borderColor: frontStyle.borderColor,
            borderRadius: '14px',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = s.cardHoverShadow;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = 'none';
          }}
        >
          <div className="flex gap-4">
            {product.imageUrl ? (
              <div
                className={`h-28 w-24 shrink-0 overflow-hidden ${imageClass}`}
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`flex h-28 w-24 shrink-0 items-center justify-center ${imageClass}`}
                style={{ background: frontStyle.accentColor, color: '#fff' }}
              >
                {(product.title[0] || '').toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3
                className={`text-xl leading-tight ${titleClass}`}
                style={{ color: frontStyle.textColor }}
              >
                {product.title}
              </h3>
              <p
                className="mt-1 line-clamp-3 text-sm"
                style={{ color: frontStyle.mutedColor }}
              >
                {descriptionText || 'Product description'}
              </p>
              <p
                className="mt-2 text-lg"
                style={{ color: frontStyle.accentColor }}
              >
                {priceLabel}
              </p>
            </div>
          </div>

          {frontStyle.buttonVariant !== 'none' && (
            <button
              type="button"
              className="mt-3 h-10 w-full text-sm font-semibold"
              style={{
                borderRadius: '10px',
                border: `1px solid ${frontStyle.accentColor}`,
                background:
                  frontStyle.buttonVariant === 'solid'
                    ? frontStyle.accentColor
                    : 'transparent',
                color:
                  frontStyle.buttonVariant === 'solid'
                    ? '#fff'
                    : frontStyle.accentColor,
              }}
            >
              {buttonLabel}
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        className="group border p-4 transition-all duration-200"
        style={{
          background: frontStyle.bgColor,
          borderColor: frontStyle.borderColor,
          borderRadius: r,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = s.cardHoverShadow;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = 'none';
        }}
      >
        <div className="flex items-start gap-3">
          {product.imageUrl ? (
            <div className={`h-14 w-14 shrink-0 overflow-hidden ${imageClass}`}>
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center ${imageClass}`}
              style={{ background: frontStyle.accentColor, color: '#fff' }}
            >
              {(product.title[0] || '').toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-sm ${titleClass}`}
              style={{ color: frontStyle.textColor }}
            >
              {product.title}
            </h3>
            <p
              className="mt-1 line-clamp-2 text-xs"
              style={{ color: frontStyle.mutedColor }}
            >
              {descriptionText || 'Product description'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wide text-gray-400">
            {product.type}
          </span>
          <span className="font-bold" style={{ color: frontStyle.accentColor }}>
            {priceLabel}
          </span>
        </div>

        {frontStyle.buttonVariant !== 'none' && (
          <button
            type="button"
            className="mt-3 h-10 w-full text-sm font-semibold"
            style={{
              borderRadius: br,
              border: `1px solid ${frontStyle.accentColor}`,
              background:
                frontStyle.buttonVariant === 'solid'
                  ? frontStyle.accentColor
                  : 'transparent',
              color:
                frontStyle.buttonVariant === 'solid'
                  ? '#fff'
                  : frontStyle.accentColor,
            }}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <StorePageShell
      profile={profile}
      styles={s}
      sidebarAction={sidebarAction}
      rootClassName={
        embedded
          ? 'h-full min-h-0 w-full overflow-y-auto md:overflow-hidden'
          : undefined
      }
      containerClassName={
        embedded ? 'mx-0 max-w-none h-full min-h-0 w-full px-0 py-0' : undefined
      }
      gridClassName={`md:grid-cols-[minmax(280px,38%)_minmax(0,62%)] md:gap-14 ${embedded ? 'px-6 py-6 md:h-full md:min-h-0 md:py-0 lg:px-8' : 'md:min-h-screen'}`}
      sidebarClassName={
        embedded
          ? 'md:sticky md:top-0 md:flex md:h-full md:items-center md:py-10'
          : 'md:sticky md:top-0 md:flex md:h-screen md:items-center md:py-10'
      }
      contentClassName={`pb-12 pt-6 md:pb-12 md:pt-20 lg:pb-16 lg:pt-24 ${embedded ? 'md:h-full md:min-h-0 md:overflow-y-auto hide-scrollbar md:pb-8 md:pt-10 lg:pb-10 lg:pt-12' : ''}`}
    >
      <section>
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
                      {renderFrontOverride(product) || (
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
                      )}
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
          style={{
            color: s.footerColor,
            fontFamily: 'Hedvig Sans, Geist Sans, sans-serif',
          }}
        >
          Powered by ACME
        </p>
      </section>
    </StorePageShell>
  );
}
