'use client';

import { useActionState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, Trash2, AtSign, Link2, Globe } from 'lucide-react';
import { updateSettings, updateAvatar, deleteAvatar } from './actions';
import { Profile, User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ProfileData = {
  user: User;
  profile: Profile | null;
};

type ActionState = {
  error?: string;
  success?: string;
};

function SocialLinkInput({
  platform,
  label,
  icon: Icon,
  placeholder,
  defaultValue,
}: {
  platform: string;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-36 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={platform} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      <Input
        id={platform}
        name={platform}
        placeholder={placeholder}
        defaultValue={defaultValue || ''}
        className="flex-1"
      />
    </div>
  );
}

function AvatarSection() {
  const { data } = useSWR<ProfileData>('/api/profile', fetcher);
  const profile = data?.profile;
  const user = data?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing('avatarUploader', {
    onClientUploadComplete: async (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) {
        await updateAvatar(url);
        mutate('/api/profile');
      }
    },
    onUploadError: (error) => {
      console.error(error);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await startUpload(Array.from(files));
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    await deleteAvatar();
    mutate('/api/profile');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>
          Upload a profile photo to personalize your page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.displayName || user?.name || ''} />
            <AvatarFallback className="text-lg">
              {(profile?.displayName || user?.name || user?.email || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
            {profile?.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleAvatarDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsForm({
  state,
  formAction,
  isPending,
}: {
  state: ActionState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
}) {
  const { data } = useSWR<ProfileData>('/api/profile', fetcher);
  const profile = data?.profile;
  const socialLinks = profile?.socialLinks as Record<string, string | null> | null;

  return (
    <form className="space-y-8" action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            This information will be displayed on your public page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username" className="mb-2 flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="your-username"
              defaultValue={profile?.username || ''}
              required
              pattern="^[a-zA-Z0-9_-]{3,30}$"
              title="Only letters, numbers, underscores, and hyphens. 3-30 characters."
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Your page URL: <span className="font-medium text-foreground">/{profile?.username || 'your-username'}</span>
            </p>
          </div>
          <div>
            <Label htmlFor="displayName" className="mb-2">
              Display Name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="John Doe"
              defaultValue={profile?.displayName || ''}
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="headline" className="mb-2">
              Headline
            </Label>
            <Input
              id="headline"
              name="headline"
              placeholder="Developer, Creator, Coach..."
              defaultValue={profile?.headline || ''}
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="bio" className="mb-2">
              Bio
            </Label>
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell people about yourself..."
              defaultValue={profile?.bio || ''}
              maxLength={1000}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">
              {(profile?.bio || '').length}/1000
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Social Links
          </CardTitle>
          <CardDescription>
            Add your social media profiles so visitors can connect with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SocialLinkInput
            platform="twitter"
            label="Twitter / X"
            icon={() => <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
            placeholder="https://x.com/username"
            defaultValue={socialLinks?.twitter || ''}
          />
          <SocialLinkInput
            platform="instagram"
            label="Instagram"
            icon={() => <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>}
            placeholder="https://instagram.com/username"
            defaultValue={socialLinks?.instagram || ''}
          />
          <SocialLinkInput
            platform="youtube"
            label="YouTube"
            icon={() => <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>}
            placeholder="https://youtube.com/@channel"
            defaultValue={socialLinks?.youtube || ''}
          />
          <SocialLinkInput
            platform="tiktok"
            label="TikTok"
            icon={() => <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11V9.02a6.34 6.34 0 0 0-.82-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.8a4.84 4.84 0 0 1-1-.11z"/></svg>}
            placeholder="https://tiktok.com/@username"
            defaultValue={socialLinks?.tiktok || ''}
          />
          <SocialLinkInput
            platform="website"
            label="Website"
            icon={Globe}
            placeholder="https://yourwebsite.com"
            defaultValue={socialLinks?.website || ''}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {state.error && (
          <p className="text-red-500 text-sm">{state.error}</p>
        )}
        {state.success && (
          <p className="text-green-500 text-sm">{state.success}</p>
        )}
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(async (prevState: ActionState, formData: FormData) => {
    return await updateSettings(prevState, formData);
  }, {});

  return (
    <section className="flex-1 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Settings
      </h1>
      <div className="space-y-6">
        <AvatarSection />
        <SettingsForm state={state} formAction={formAction} isPending={isPending} />
      </div>
    </section>
  );
}
