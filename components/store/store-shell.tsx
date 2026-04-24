'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Profile } from '@/lib/db/schema';
import type { ThemeConfig } from '@/lib/themes';
import { cn } from '@/lib/utils';

type SocialLinks = {
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  website?: string | null;
};

type StoreProfileCardProps = {
  profile: Profile;
  styles: ThemeConfig['styles'];
  sidebarAction?: ReactNode;
  linkProfile?: boolean;
};

type StorePageShellProps = StoreProfileCardProps & {
  children: ReactNode;
  rootClassName?: string;
  containerClassName?: string;
  gridClassName?: string;
  sidebarClassName?: string;
  contentClassName?: string;
};

const serifFont = 'Hedvig Serif, serif';
const sansFont = 'Hedvig Sans, Geist Sans, sans-serif';

function MaybeLink({
  children,
  className,
  enabled,
  href,
}: {
  children: ReactNode;
  className?: string;
  enabled?: boolean;
  href: string;
}) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function getProfileInitials(profile: Profile) {
  return (profile.displayName || profile.username || 'U')
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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

function StoreProfileCard({
  profile,
  styles,
  sidebarAction,
  linkProfile = false,
}: StoreProfileCardProps) {
  const socialLinks = profile.socialLinks as SocialLinks | null;
  const profileHref = `/${profile.username}`;
  const profileRing = styles.avatarRing || 'rgba(255, 255, 255, 0.88)';
  const socialItems: {
    url: string | null | undefined;
    icon: ReactNode;
  }[] = [
    {
      url: socialLinks?.twitter,
      icon: <TwitterIcon color={styles.socialIconColor} />,
    },
    {
      url: socialLinks?.instagram,
      icon: <InstagramIcon color={styles.socialIconColor} />,
    },
    {
      url: socialLinks?.youtube,
      icon: <YouTubeIcon color={styles.socialIconColor} />,
    },
    {
      url: socialLinks?.tiktok,
      icon: <TikTokIcon color={styles.socialIconColor} />,
    },
    {
      url: socialLinks?.website,
      icon: <GlobeIcon color={styles.socialIconColor} />,
    },
  ];
  const filteredSocials = socialItems.filter((item) => item.url);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-sm">
      <MaybeLink
        enabled={linkProfile}
        href={profileHref}
        className="inline-block"
      >
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
              background: styles.avatarFallback,
              color: styles.avatarFallbackText,
              fontFamily: serifFont,
            }}
          >
            {getProfileInitials(profile)}
          </AvatarFallback>
        </Avatar>
      </MaybeLink>

      <div className="mt-8 space-y-3">
        <h1
          className="text-4xl leading-none tracking-tight md:text-[3.2rem]"
          style={{ color: styles.headingColor, fontFamily: serifFont }}
        >
          <MaybeLink
            enabled={linkProfile}
            href={profileHref}
            className="no-underline"
          >
            {profile.displayName || profile.username}
          </MaybeLink>
        </h1>

        {profile.headline && (
          <p
            className="text-xs uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.18em]"
            style={{ color: styles.mutedColor, fontFamily: sansFont }}
          >
            {profile.headline}
          </p>
        )}
      </div>

      {profile.bio && (
        <p
          className="mt-6 max-w-md text-sm leading-7 md:text-[0.95rem]"
          style={{ color: styles.textColor, fontFamily: sansFont }}
        >
          {profile.bio}
        </p>
      )}

      {filteredSocials.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {filteredSocials.map((social, index) => (
            <a
              key={index}
              href={social.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center border transition-all duration-200"
              style={{
                color: styles.socialIconColor,
                borderColor: styles.cardBorder,
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.48)',
                boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
              }}
              onMouseEnter={(event) => {
                const element = event.currentTarget as HTMLElement;
                element.style.color = styles.socialIconHover;
                element.style.transform = 'translateY(-2px)';
                element.style.boxShadow = '0 16px 34px rgba(15, 23, 42, 0.10)';
              }}
              onMouseLeave={(event) => {
                const element = event.currentTarget as HTMLElement;
                element.style.color = styles.socialIconColor;
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '0 10px 28px rgba(15, 23, 42, 0.05)';
              }}
            >
              {social.icon}
            </a>
          ))}
        </div>
      )}

      {sidebarAction && <div className="mt-8">{sidebarAction}</div>}
    </div>
  );
}

export function StorePageShell({
  children,
  profile,
  styles,
  sidebarAction,
  linkProfile = false,
  rootClassName,
  containerClassName,
  gridClassName,
  sidebarClassName,
  contentClassName,
}: StorePageShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        rootClassName
      )}
      style={{ background: styles.pageBgGradient || styles.pageBg }}
    >
      <div
        className={cn(
          'mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-0 lg:px-10',
          containerClassName
        )}
      >
        <div
          className={cn(
            'grid w-full gap-10 lg:gap-14 xl:gap-20',
            gridClassName
          )}
        >
          <aside
            className={cn(
              'hidden lg:sticky lg:top-0 lg:flex lg:items-center lg:py-10',
              sidebarClassName
            )}
          >
            <StoreProfileCard
              profile={profile}
              styles={styles}
              sidebarAction={sidebarAction}
              linkProfile={linkProfile}
            />
          </aside>

          <div className={cn('min-w-0', contentClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
