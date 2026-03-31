'use server';

import { z } from 'zod';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { profiles } from '@/lib/db/schema';
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
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
});

export const updateProfile = validatedActionWithUser(
  updateProfileSchema,
  async (data, _, user) => {
    const { username, displayName, headline, bio, theme, borderRadius, buttonBorderRadius, productColumns, cardTemplate, instagram, twitter, youtube, tiktok, website } = data;

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

const updateThemeSchema = z.object({
  theme: z.string().min(1).max(30),
});

export const updateTheme = validatedActionWithUser(
  updateThemeSchema,
  async (data, _, user) => {
    const { theme } = data;

    const existingProfile = await getProfileByUserId(user.id);

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

    return { success: 'Theme updated.' };
  }
);
