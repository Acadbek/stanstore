'use client';

import {
  useActionState,
  useState,
  useEffect,
  useCallback,
  useRef,
  type RefObject,
} from 'react';
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
import {
  Loader2,
  Trash2,
  AtSign,
  Link2,
  Globe,
  Palette,
  Check,
  RectangleHorizontal,
  MousePointerClick,
  LayoutGrid,
  Eye,
  Plus,
  GalleryHorizontal,
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updateProfile, updateAvatar, deleteAvatar } from '../actions';
import { Profile, User } from '@/lib/db/schema';
import {
  themes,
  getTheme,
  getThemeCategories,
  applyThemeToProfile,
  type ThemeConfig,
} from '@/lib/themes';
import useSWR, { mutate } from 'swr';
import { Suspense } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';
import Link from 'next/link';

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

const PROFILE_FORM_ID = 'profile-config-form';

const borderRadiusOptions = [
  { id: 'none', label: 'None', css: '0px' },
  { id: 'sm', label: 'Small', css: '2px' },
  { id: 'md', label: 'Medium', css: '6px' },
  { id: 'lg', label: 'Large', css: '8px' },
  { id: 'xl', label: 'XL', css: '16px' },
] as const;

const btnRadiusOptions = [
  { id: 'none', label: 'None', css: '0px' },
  { id: 'sm', label: 'Small', css: '2px' },
  { id: 'md', label: 'Medium', css: '6px' },
  { id: 'lg', label: 'Large', css: '8px' },
  { id: 'full', label: 'Full', css: '9999px' },
] as const;

const getRadiusCss = (id: string) =>
  borderRadiusOptions.find((r) => r.id === id)?.css ?? '6px';
const getBtnRadiusCss = (id: string) =>
  btnRadiusOptions.find((r) => r.id === id)?.css ?? '6px';

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

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else resolve(new Blob());
    }, 'image/jpeg');
  });
}

function AvatarSection() {
  const { data } = useSWR<ProfileData>('/api/profile', fetcher);
  const profile = data?.profile;
  const user = data?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

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
      const file = files[0];
      const src = URL.createObjectURL(file);
      setCropImageSrc(src);
      setCropOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      e.target.value = '';
    }
  };

  const handleCropAndUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await startUpload([file]);
      setCropOpen(false);
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarDelete = async () => {
    await deleteAvatar();
    mutate('/api/profile');
  };

  const hasAvatar = !!profile?.avatarUrl;

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
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {hasAvatar ? (
              <>
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={profile?.avatarUrl || ''}
                          alt={profile?.displayName || user?.name || ''}
                        />
                        <AvatarFallback className="text-lg">
                          {(
                            profile?.displayName ||
                            user?.name ||
                            user?.email ||
                            'U'
                          )
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm p-2" showClose={false}>
                    <DialogTitle className="sr-only">
                      Profile photo preview
                    </DialogTitle>
                    <img
                      src={profile?.avatarUrl || ''}
                      alt={profile?.displayName || user?.name || ''}
                      className="w-full h-auto rounded-xl"
                    />
                  </DialogContent>
                </Dialog>

                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewOpen(true);
                    }}
                    className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvatarDelete();
                    }}
                    className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-red-50 hover:text-red-500 text-gray-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="group/avatar relative cursor-pointer"
              >
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-lg bg-muted">
                    {(profile?.displayName || user?.name || user?.email || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center gap-0.5">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-white" />
                      <span className="text-[10px] font-medium text-white">
                        Upload
                      </span>
                    </>
                  )}
                </div>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {hasAvatar
                ? 'Hover over your photo to preview or remove it.'
                : 'Click the avatar area above to upload a photo.'}
            </p>
          </div>
        </div>

        <Dialog
          open={cropOpen}
          onOpenChange={(open) => {
            if (!open) {
              URL.revokeObjectURL(cropImageSrc || '');
              setCropImageSrc(null);
            }
            setCropOpen(open);
          }}
        >
          <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
            <DialogTitle className="sr-only">Crop profile photo</DialogTitle>
            <div className="relative w-full h-[350px] bg-black">
              {cropImageSrc && (
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onCropComplete={(
                    _: { width: number; height: number; x: number; y: number },
                    pixels: {
                      width: number;
                      height: number;
                      x: number;
                      y: number;
                    }
                  ) => setCroppedAreaPixels(pixels)}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            <div className="flex items-center justify-between p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  URL.revokeObjectURL(cropImageSrc || '');
                  setCropImageSrc(null);
                  setCropOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!croppedAreaPixels || isUploading}
                onClick={handleCropAndUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Crop & Upload'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ThemePickerCard({
  theme,
  isSelected,
  onClick,
}: {
  theme: ThemeConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-xl border-2 p-1 transition-all text-left w-full ${isSelected
        ? 'border-orange-500 '
        : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      <div
        className="rounded-lg p-3 h-24 flex flex-col justify-between overflow-hidden"
        style={{ background: theme.preview.bg }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full shrink-0"
            style={{ background: theme.preview.accent }}
          />
          <div className="flex-1 space-y-1">
            <div
              className="h-2 rounded-full w-3/4"
              style={{ background: theme.preview.text, opacity: 0.7 }}
            />
            <div
              className="h-1.5 rounded-full w-1/2"
              style={{ background: theme.preview.text, opacity: 0.3 }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div
            className="h-5 rounded"
            style={{ background: theme.preview.card }}
          />
          <div
            className="h-5 rounded"
            style={{ background: theme.preview.card }}
          />
        </div>
      </div>

      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-gray-900 truncate">
          {theme.name}
        </p>
      </div>

      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

function RadiusPickerRow({
  selected,
  onSelect,
  accentColor,
  options,
}: {
  selected: string;
  onSelect: (id: string) => void;
  accentColor: string;
  options: readonly { id: string; label: string; css: string }[];
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${isActive
              ? 'border-orange-500  bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div
              className="w-8 h-8 border-2 border-current"
              style={{
                borderRadius: opt.css,
                background: isActive ? accentColor : 'transparent',
                borderColor: isActive ? accentColor : '#d1d5db',
              }}
            />
            <span className="text-[10px] font-medium text-gray-600">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProductCardStandard({
  title,
  price,
  type,
  s,
  cr,
}: {
  title: string;
  price: string;
  type: string;
  s: ThemeConfig['styles'];
  cr: string;
}) {
  return (
    <div
      className="border p-3 flex flex-col"
      style={{
        background: s.cardBg,
        borderColor: s.cardBorder,
        borderRadius: cr,
      }}
    >
      <div
        className="w-full h-16 mb-2 flex items-center justify-center"
        style={{ background: s.productBadge, borderRadius: cr }}
      >
        <span
          className="text-xl font-bold"
          style={{ color: s.productBadgeText }}
        >
          {title[0]}
        </span>
      </div>
      <p
        className="text-xs font-semibold truncate"
        style={{ color: s.headingColor }}
      >
        {title}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: s.mutedColor }}>
        {type}
      </p>
      <div
        className="flex items-center justify-between mt-auto pt-2"
        style={{ borderTop: `1px solid ${s.cardBorder}` }}
      >
        <span className="text-xs font-bold" style={{ color: s.priceColor }}>
          {price}
        </span>
      </div>
    </div>
  );
}

function ProductCardCompact({
  title,
  price,
  s,
  cr,
}: {
  title: string;
  price: string;
  s: ThemeConfig['styles'];
  cr: string;
}) {
  return (
    <div
      className="border p-2.5 flex items-center gap-3"
      style={{
        background: s.cardBg,
        borderColor: s.cardBorder,
        borderRadius: cr,
      }}
    >
      <div
        className="w-12 h-12 shrink-0 flex items-center justify-center"
        style={{ background: s.productBadge, borderRadius: cr }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: s.productBadgeText }}
        >
          {title[0]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-semibold truncate"
          style={{ color: s.headingColor }}
        >
          {title}
        </p>
        <p className="text-[11px] font-bold" style={{ color: s.priceColor }}>
          {price}
        </p>
      </div>
    </div>
  );
}

function ProductCardOverlay({
  title,
  price,
  type,
  s,
  cr,
}: {
  title: string;
  price: string;
  type: string;
  s: ThemeConfig['styles'];
  cr: string;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: s.productBadge, borderRadius: cr }}
    >
      <div className="h-28 flex items-center justify-center">
        <span
          className="text-3xl font-bold"
          style={{ color: s.productBadgeText }}
        >
          {title[0]}
        </span>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 p-2.5"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          borderRadius: `0 0 ${cr} ${cr}`,
        }}
      >
        <p className="text-[11px] font-semibold truncate text-white">{title}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-white/70">{type}</span>
          <span className="text-xs font-bold text-white">{price}</span>
        </div>
      </div>
    </div>
  );
}

function ProductCardMinimal({
  title,
  price,
  type,
  s,
  cr,
}: {
  title: string;
  price: string;
  type: string;
  s: ThemeConfig['styles'];
  cr: string;
}) {
  return (
    <div
      className="border p-3"
      style={{
        background: s.cardBg,
        borderColor: s.cardBorder,
        borderRadius: cr,
      }}
    >
      <p
        className="text-xs font-semibold truncate"
        style={{ color: s.headingColor }}
      >
        {title}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: s.mutedColor }}>
        {type}
      </p>
      <div className="mt-2" style={{ borderTop: `1px solid ${s.cardBorder}` }}>
        <span className="text-xs font-bold" style={{ color: s.priceColor }}>
          {price}
        </span>
      </div>
    </div>
  );
}

function ProductCardsGrid({
  s,
  cr,
  columns,
  cardTemplate,
}: {
  s: ThemeConfig['styles'];
  cr: string;
  columns: number;
  cardTemplate: string;
}) {
  const items = [
    { title: 'E-book Template', price: '$29.00', type: 'Digital' },
    { title: 'Design Course', price: '$49.00', type: 'Course' },
    { title: 'Icon Pack', price: '$9.00', type: 'Digital' },
  ];

  const colClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-2'
        : columns === 4
          ? 'grid-cols-2 sm:grid-cols-4'
          : 'grid-cols-3';

  const CardComponent =
    cardTemplate === 'compact'
      ? ProductCardCompact
      : cardTemplate === 'overlay'
        ? ProductCardOverlay
        : cardTemplate === 'minimal'
          ? ProductCardMinimal
          : ProductCardStandard;

  return (
    <div className={`grid ${colClass} gap-3`}>
      {items.map((item) => (
        <CardComponent key={item.title} {...item} s={s} cr={cr} />
      ))}
    </div>
  );
}

function StorePreview({
  theme,
  cardRadius,
  btnRadius,
  profile,
  productColumns,
  cardTemplate,
}: {
  theme: ThemeConfig;
  cardRadius: string;
  btnRadius: string;
  profile: Profile | null | undefined;
  productColumns: number;
  cardTemplate: string;
}) {
  const s = theme.styles;
  const cr = getRadiusCss(cardRadius);
  const br = getBtnRadiusCss(btnRadius);

  return (
    <div className="h-full rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="h-full p-4 overflow-y-auto"
        style={{ background: s.pageBgGradient || s.pageBg }}
      >
        <div className="flex flex-col sm:flex-row gap-4 max-w-full">
          <div
            className="shrink-0 border p-4 flex flex-col items-center text-center sm:w-[140px]"
            style={{
              background: s.cardBg,
              borderColor: s.cardBorder,
              borderRadius: cr,
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center text-sm font-bold"
              style={{
                borderRadius: cr,
                background: s.avatarFallback,
                color: s.avatarFallbackText,
              }}
            >
              {(profile?.displayName || profile?.username || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <p
              className="text-sm font-bold mt-2"
              style={{ color: s.headingColor }}
            >
              {profile?.displayName || profile?.username || 'Your Name'}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: s.mutedColor }}>
              {profile?.headline || 'Creator'}
            </p>
            <div className="flex gap-1.5 mt-3">
              {['t', 'i', 'g'].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4"
                  style={{ color: s.socialIconColor, opacity: 0.6 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <ProductCardsGrid
              s={s}
              cr={cr}
              columns={productColumns}
              cardTemplate={cardTemplate}
            />

            <div className="flex gap-2 pt-2">
              <button
                className="px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  background: s.buttonBg,
                  color: s.buttonText,
                  borderRadius: br,
                }}
              >
                Buy Now
              </button>
              <button
                className="px-4 py-2 text-xs font-medium border transition-colors"
                style={{
                  background: 'transparent',
                  color: s.buttonBg,
                  borderColor: s.cardBorder,
                  borderRadius: br,
                }}
              >
                View Details
              </button>
            </div>

            <p
              className="text-center text-[10px] pt-2"
              style={{ color: s.footerColor }}
            >
              Powered by ACME
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  state,
  initialData,
  formAction,
  isPending,
  formRef,
  formId,
}: {
  state: ActionState;
  initialData?: ProfileData;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  formId: string;
}) {
  const profile = initialData?.profile;
  const socialLinks = profile?.socialLinks as Record<
    string,
    string | null
  > | null;

  return (
    <form id="profile-config-form" className="space-y-8" action={formAction}>
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
              Your page URL:{' '}
              <span className="font-medium text-foreground">
                /{profile?.username || 'your-username'}
              </span>
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
            icon={() => (
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            placeholder="https://x.com/username"
            defaultValue={socialLinks?.twitter || ''}
          />
          <SocialLinkInput
            platform="instagram"
            label="Instagram"
            icon={() => (
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            )}
            placeholder="https://instagram.com/username"
            defaultValue={socialLinks?.instagram || ''}
          />
          <SocialLinkInput
            platform="youtube"
            label="YouTube"
            icon={() => (
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            )}
            placeholder="https://youtube.com/@channel"
            defaultValue={socialLinks?.youtube || ''}
          />
          <SocialLinkInput
            platform="tiktok"
            label="TikTok"
            icon={() => (
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.11V9.02a6.34 6.34 0 0 0-.82-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.8a4.84 4.84 0 0 1-1-.11z" />
              </svg>
            )}
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
    </form>
  );
}

function ProfileFormWithData({
  selectedTheme,
  selectedRadius,
  selectedBtnRadius,
  productColumns,
  cardTemplate,
  state,
  formAction,
  isPending,
  formRef,
  formId,
}: {
  selectedTheme: string;
  selectedRadius: string;
  selectedBtnRadius: string;
  productColumns: number;
  cardTemplate: string;
  state: ActionState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  formId: string;
}) {
  const { data } = useSWR<ProfileData>('/api/profile', fetcher);

  const wrappedFormAction = useCallback(
    (formData: FormData) => {
      formData.append('theme', selectedTheme);
      formData.append('borderRadius', selectedRadius);
      formData.append('buttonBorderRadius', selectedBtnRadius);
      formData.append('productColumns', String(productColumns));
      formData.append('cardTemplate', cardTemplate);
      formAction(formData);
    },
    [
      formAction,
      selectedTheme,
      selectedRadius,
      selectedBtnRadius,
      productColumns,
      cardTemplate,
    ]
  );

  return (
    <ProfileForm
      state={state}
      initialData={data}
      formAction={wrappedFormAction}
      isPending={isPending}
      formRef={formRef}
      formId={formId}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex-1 lg:p-8 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-[180px] bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}

function ThemeCardWithPopover({
  theme,
  isSelected,
  selectedTheme,
  onSelect,
}: {
  theme: ThemeConfig;
  isSelected: boolean;
  selectedTheme: string;
  onSelect: (id: string) => void;
}) {
  const categories = getThemeCategories();
  const category = categories.find((c) => c.id === theme.category);
  const variants = category?.variants || [theme];
  const hasMultiple = variants.length > 1;

  if (!hasMultiple) {
    return (
      <ThemePickerCard
        theme={theme}
        isSelected={isSelected}
        onClick={() => onSelect(theme.id)}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer w-full">
          <ThemePickerCard
            theme={theme}
            isSelected={isSelected}
            onClick={() => { }}
          />
          <div className="absolute -top-1.5 -left-1.5 z-10 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {variants.length}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="top"
        align="center"
        sideOffset={8}
      >
        <p className="text-[10px] font-semibold text-gray-500 mb-1.5 px-1">
          {category?.label}
        </p>
        <div className="flex gap-1.5">
          {variants.map((v) => {
            const isThis = selectedTheme === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={`relative flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${isThis ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
              >
                <div className="flex gap-0.5">
                  <div
                    className="w-5 h-5 rounded"
                    style={{
                      background: v.preview.bg,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <div
                    className="w-5 h-5 rounded"
                    style={{
                      background: v.preview.card,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <div
                    className="w-5 h-5 rounded"
                    style={{ background: v.preview.accent }}
                  />
                  <div
                    className="w-5 h-5 rounded"
                    style={{ background: v.preview.text }}
                  />
                </div>
                <span
                  className={`text-[9px] leading-tight font-medium text-center w-14 truncate ${isThis ? 'text-orange-600' : 'text-gray-600'}`}
                >
                  {v.name}
                </span>
                {isThis && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="h-1.5 w-1.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getUniqueThemeCards(): ThemeConfig[] {
  const seen = new Set<string>();
  return themes.filter((t) => {
    if (seen.has(t.category)) return false;
    seen.add(t.category);
    return true;
  });
}

function ThemeConfigSection({
  selectedTheme,
  selectedRadius,
  selectedBtnRadius,
  productColumns,
  cardTemplate,
  onThemeChange,
  onRadiusChange,
  onBtnRadiusChange,
  onColumnsChange,
  onCardTemplateChange,
  profile,
}: {
  selectedTheme: string;
  selectedRadius: string;
  selectedBtnRadius: string;
  productColumns: number;
  cardTemplate: string;
  onThemeChange: (id: string) => void;
  onRadiusChange: (id: string) => void;
  onBtnRadiusChange: (id: string) => void;
  onColumnsChange: (n: number) => void;
  onCardTemplateChange: (id: string) => void;
  profile: Profile | null | undefined;
}) {
  const theme = getTheme(selectedTheme);
  const cards = getUniqueThemeCards();

  const columnOptions = [1, 2, 3, 4];

  const cardTemplates = [
    { id: 'standard', label: 'Standard' },
    { id: 'compact', label: 'Compact' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'minimal', label: 'Minimal' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize the look of your public storefront page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Store Theme
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map((t) => {
              const categories = getThemeCategories();
              const cat = categories.find((c) => c.id === t.category);
              const isCategorySelected = cat?.variants.some(
                (v) => v.id === selectedTheme
              );
              return (
                <ThemeCardWithPopover
                  key={t.id}
                  theme={t}
                  isSelected={isCategorySelected || false}
                  selectedTheme={selectedTheme}
                  onSelect={onThemeChange}
                />
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" />
            Product Columns
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {columnOptions.map((n) => {
              const isActive = productColumns === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onColumnsChange(n)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${isActive
                    ? 'border-orange-500  bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(n, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 border border-current"
                        style={{
                          width:
                            n === 1
                              ? '24px'
                              : n === 2
                                ? '12px'
                                : n === 3
                                  ? '8px'
                                  : '6px',
                          borderColor: isActive ? '#f97316' : '#d1d5db',
                          background: isActive ? '#f97316' : 'transparent',
                          opacity: isActive ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Card Template
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {cardTemplates.map((t) => {
              const isActive = cardTemplate === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onCardTemplateChange(t.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${isActive
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div
                    className="w-8 h-6 rounded border"
                    style={{
                      borderColor: isActive ? '#f97316' : '#d1d5db',
                      background: isActive ? '#fed7aa' : '#f9fafb',
                    }}
                  />
                  <span className="text-[10px] font-medium text-gray-600">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <RectangleHorizontal className="h-4 w-4" />
            Card Radius
          </h3>
          <RadiusPickerRow
            selected={selectedRadius}
            onSelect={onRadiusChange}
            accentColor={theme.styles.cardBorder}
            options={borderRadiusOptions}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Button Radius
          </h3>
          <RadiusPickerRow
            selected={selectedBtnRadius}
            onSelect={onBtnRadiusChange}
            accentColor={theme.styles.buttonBg}
            options={btnRadiusOptions}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfileConfigPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState: ActionState, formData: FormData) => {
      return await updateProfile(prevState, formData);
    },
    {}
  );
  const profileFormRef = useRef<HTMLFormElement>(null);

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<string | null>(null);
  const [selectedBtnRadius, setSelectedBtnRadius] = useState<string | null>(
    null
  );
  const [productColumns, setProductColumns] = useState<number>(3);
  const [cardTemplate, setCardTemplate] = useState<string>('standard');
  const [themeInitialized, setThemeInitialized] = useState(false);

  const { data } = useSWR<ProfileData>('/api/profile', fetcher);

  const handleThemeChange = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
    const themeProps = applyThemeToProfile(themeId);
    setSelectedRadius(themeProps.borderRadius);
    setSelectedBtnRadius(themeProps.buttonBorderRadius);
    setProductColumns(themeProps.productColumns);
    setCardTemplate(themeProps.cardTemplate);
  }, []);

  useEffect(() => {
    if (state.success) {
      mutate('/api/profile');
    }
  }, [state.success]);

  useEffect(() => {
    if (data?.profile && !themeInitialized) {
      setSelectedTheme(data.profile.theme || 'default');
      setSelectedRadius(data.profile.borderRadius || 'md');
      setSelectedBtnRadius(data.profile.buttonBorderRadius || 'md');
      setProductColumns(data.profile.productColumns || 3);
      setCardTemplate(data.profile.cardTemplate || 'standard');
      setThemeInitialized(true);
    }
  }, [data, themeInitialized]);

  const profile = data?.profile;

  const isReady =
    selectedTheme !== null &&
    selectedRadius !== null &&
    selectedBtnRadius !== null;

  return (
    <section className="flex-1">
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              form="profile-config-form"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
      <Suspense fallback={<ProfileSkeleton />}>
        <div className="space-y-6 px-4 py-6 lg:px-8">
          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {state.success}
            </div>
          )}

          <AvatarSection />

          {isReady && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ThemeConfigSection
                selectedTheme={selectedTheme}
                selectedRadius={selectedRadius}
                selectedBtnRadius={selectedBtnRadius}
                productColumns={productColumns}
                cardTemplate={cardTemplate}
                onThemeChange={handleThemeChange}
                onRadiusChange={setSelectedRadius}
                onBtnRadiusChange={setSelectedBtnRadius}
                onColumnsChange={setProductColumns}
                onCardTemplateChange={setCardTemplate}
                profile={profile}
              />
              <div className="lg:sticky lg:top-20 self-start lg:h-[calc(100vh-8rem)]">
                <StorePreview
                  theme={getTheme(selectedTheme)}
                  cardRadius={selectedRadius}
                  btnRadius={selectedBtnRadius}
                  productColumns={productColumns}
                  cardTemplate={cardTemplate}
                  profile={profile}
                />
              </div>
            </div>
          )}

          <ProfileFormWithData
            selectedTheme={selectedTheme || 'default'}
            selectedRadius={selectedRadius || 'md'}
            selectedBtnRadius={selectedBtnRadius || 'md'}
            productColumns={productColumns}
            cardTemplate={cardTemplate}
            state={state}
            formAction={formAction}
            isPending={isPending}
            formRef={profileFormRef}
            formId={PROFILE_FORM_ID}
          />
        </div>
      </Suspense>
    </section>
  );
}
