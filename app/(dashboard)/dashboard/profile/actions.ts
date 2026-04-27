'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { profiles, products } from '@/lib/db/schema';
import { getUser, getProfileByUserId, getProfileByUsername } from '@/lib/db/queries';
import {
  validatedActionWithUser
} from '@/lib/auth/middleware';

const socialLinksSchema = z.object({
  instagram: z.string().url().or(z.literal('')).nullish(),
  twitter: z.string().url().or(z.literal('')).nullish(),
  youtube: z.string().url().or(z.literal('')).nullish(),
  tiktok: z.string().url().or(z.literal('')).nullish(),
  website: z.string().url().or(z.literal('')).nullish(),
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  displayName: z.string().max(100, 'Display name must be at most 100 characters').optional(),
  headline: z.string().max(200, 'Headline must be at most 200 characters').optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  theme: z.string().max(30).optional(),
  borderRadius: z.string().max(10).optional(),
  buttonBorderRadius: z.string().max(10).optional(),
  productColumns: z.coerce.number().min(1).max(4).optional(),
  cardTemplate: z.string().max(20).optional(),
  bulkFrontStyle: z
    .enum(['inherit', 'pill', 'cta', 'editorial', 'custom'])
    .optional(),
  bulkFrontStylePrompt: z.string().max(3000).optional(),
  perProductFrontStyles: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
});

function isMissingFrontStyleColumnsError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('front_style') ||
    message.includes('front style') ||
    message.includes('front_style_prompt') ||
    message.includes('front style prompt')
  );
}

async function ensureFrontStyleColumns() {
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style varchar(20) NOT NULL DEFAULT 'inherit'
  `);
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS front_style_prompt text
  `);
}

type PerProductStyle = 'pill' | 'cta' | 'editorial';

function parsePerProductFrontStyles(value?: string) {
  if (!value) return [] as { productId: number; style: PerProductStyle }[];

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return [];

    const entries: { productId: number; style: PerProductStyle }[] = [];
    for (const [key, rawStyle] of Object.entries(parsed)) {
      const productId = Number(key);
      if (!Number.isInteger(productId) || productId <= 0) continue;
      if (
        rawStyle !== 'pill' &&
        rawStyle !== 'cta' &&
        rawStyle !== 'editorial'
      )
        continue;
      entries.push({ productId, style: rawStyle });
    }
    return entries;
  } catch {
    return [];
  }
}

async function applyPerProductFrontStyles(
  userId: number,
  entries: { productId: number; style: PerProductStyle }[]
) {
  await Promise.all(
    entries.map(({ productId, style }) =>
      db
        .update(products)
        .set({
          frontStyle: style,
          frontStylePrompt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(products.userId, userId), eq(products.id, productId)))
    )
  );
}

export const updateProfile = validatedActionWithUser(
  updateProfileSchema,
  async (data, _, user) => {
    const {
      username,
      displayName,
      headline,
      bio,
      theme,
      borderRadius,
      buttonBorderRadius,
      productColumns,
      cardTemplate,
      bulkFrontStyle,
      bulkFrontStylePrompt,
      perProductFrontStyles,
      instagram,
      twitter,
      youtube,
      tiktok,
      website,
    } = data;

    const existingProfile = await getProfileByUserId(user.id);

    const usernameTaken = await getProfileByUsername(username);
    if (usernameTaken && usernameTaken.userId !== user.id) {
      return { error: 'Username is already taken' };
    }

    const normalizeUrl = (url?: string) => {
      if (!url || url.trim() === '') return null;
      return url.trim();
    };

    const socialLinks = {
      instagram: normalizeUrl(instagram),
      twitter: normalizeUrl(twitter),
      youtube: normalizeUrl(youtube),
      tiktok: normalizeUrl(tiktok),
      website: normalizeUrl(website),
    };

    if (existingProfile) {
      await db
        .update(profiles)
        .set({
          username,
          displayName: displayName || null,
          headline: headline || null,
          bio: bio || null,
          theme: theme || 'default',
          borderRadius: borderRadius || 'md',
          buttonBorderRadius: buttonBorderRadius || 'md',
          productColumns: productColumns || 3,
          cardTemplate: cardTemplate || 'standard',
          socialLinks,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, user.id));
    } else {
      await db.insert(profiles).values({
        userId: user.id,
        username,
        displayName: displayName || null,
        headline: headline || null,
        bio: bio || null,
        theme: theme || 'default',
        borderRadius: borderRadius || 'md',
        buttonBorderRadius: buttonBorderRadius || 'md',
        productColumns: productColumns || 3,
        cardTemplate: cardTemplate || 'standard',
        socialLinks,
      });
    }

    if (bulkFrontStyle) {
      try {
        await db
          .update(products)
          .set({
            frontStyle: bulkFrontStyle,
            frontStylePrompt:
              bulkFrontStyle === 'custom' ? bulkFrontStylePrompt || null : null,
            updatedAt: new Date(),
          })
          .where(eq(products.userId, user.id));
      } catch (error) {
        if (!isMissingFrontStyleColumnsError(error)) {
          throw error;
        }
        await ensureFrontStyleColumns();
        await db
          .update(products)
          .set({
            frontStyle: bulkFrontStyle,
            frontStylePrompt:
              bulkFrontStyle === 'custom' ? bulkFrontStylePrompt || null : null,
            updatedAt: new Date(),
          })
          .where(eq(products.userId, user.id));
      }
    }

    const perProductEntries = parsePerProductFrontStyles(perProductFrontStyles);
    if (perProductEntries.length > 0) {
      try {
        await applyPerProductFrontStyles(user.id, perProductEntries);
      } catch (error) {
        if (!isMissingFrontStyleColumnsError(error)) {
          throw error;
        }
        await ensureFrontStyleColumns();
        await applyPerProductFrontStyles(user.id, perProductEntries);
      }
    }

    const oldUsername = existingProfile?.username;
    if (oldUsername) {
      revalidatePath(`/${oldUsername}`);
      revalidatePath('/dashboard/profile');
    }
    revalidatePath(`/${username}`);
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/config');

    return { success: 'Profile updated successfully.' };
  }
);

export async function updateAvatar(avatarUrl: string) {
  const user = await getUser();
  if (!user) throw new Error('User not authenticated');

  const existingProfile = await getProfileByUserId(user.id);

  if (existingProfile) {
    await db
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({
      userId: user.id,
      username: user.email?.split('@')[0] || `user${user.id}`,
      avatarUrl,
    });
  }

  return { success: 'Avatar updated successfully.' };
}

export async function deleteAvatar() {
  const user = await getUser();
  if (!user) throw new Error('User not authenticated');

  await db
    .update(profiles)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));

  return { success: 'Avatar removed.' };
}

const updateProductFrontStylesSchema = z.object({
  enabled: z.enum(['true', 'false']),
  perProductFrontStyles: z.string().optional(),
});

export const updateProductFrontStyles = validatedActionWithUser(
  updateProductFrontStylesSchema,
  async (data, _, user) => {
    const { enabled, perProductFrontStyles } = data;
    const isEnabled = enabled === 'true';
    const entries = parsePerProductFrontStyles(perProductFrontStyles);

    const applyChanges = async () => {
      const defaultFrontStyle = isEnabled ? 'cta' : 'inherit';
      await db
        .update(products)
        .set({
          frontStyle: defaultFrontStyle,
          frontStylePrompt: null,
          updatedAt: new Date(),
        })
        .where(eq(products.userId, user.id));

      if (isEnabled && entries.length > 0) {
        await applyPerProductFrontStyles(user.id, entries);
      }
    };

    try {
      await applyChanges();
    } catch (error) {
      if (!isMissingFrontStyleColumnsError(error)) {
        throw error;
      }
      await ensureFrontStyleColumns();
      await applyChanges();
    }

    const existingProfile = await getProfileByUserId(user.id);
    const username =
      existingProfile?.username || user.email?.split('@')[0] || `user${user.id}`;

    const userProducts = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.userId, user.id));

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/config');
    revalidatePath('/dashboard/products');
    revalidatePath(`/${username}`);
    for (const product of userProducts) {
      revalidatePath(`/${username}/${product.slug}`);
    }

    return { success: 'Product front styles updated.' };
  }
);

const updateThemeSchema = z.object({
  theme: z.string().min(1).max(30),
});

export const updateTheme = validatedActionWithUser(
  updateThemeSchema,
  async (data, _, user) => {
    const { theme } = data;

    const existingProfile = await getProfileByUserId(user.id);
    const username =
      existingProfile?.username || user.email?.split('@')[0] || `user${user.id}`;

    if (existingProfile) {
      await db
        .update(profiles)
        .set({ theme, updatedAt: new Date() })
        .where(eq(profiles.userId, user.id));
    } else {
      await db.insert(profiles).values({
        userId: user.id,
        username: user.email?.split('@')[0] || `user${user.id}`,
        theme,
      });
    }

    const userProducts = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.userId, user.id));

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/profile/config');
    revalidatePath(`/${username}`);
    for (const product of userProducts) {
      revalidatePath(`/${username}/${product.slug}`);
    }

    return { success: 'Theme updated.' };
  }
);
