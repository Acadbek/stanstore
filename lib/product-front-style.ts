export const FRONT_STYLE_IDS = ['pill', 'cta', 'editorial', 'custom'] as const;

export type FrontStyleId = (typeof FRONT_STYLE_IDS)[number];
export type FrontCardPreset = 'pill' | 'cta' | 'editorial';
export type InterpretedFrontStyle = {
  frontStyle: FrontStyleId;
  normalizedPrompt: string;
};

export type ResolvedFrontStyle = {
  preset: FrontCardPreset;
  bgColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  buttonVariant: 'solid' | 'outline' | 'none';
  imageShape: 'circle' | 'rounded';
  arrow: boolean;
  titleFont: 'sans' | 'serif';
};

const STYLE_PROMPT_PREFIX = '__STYLE_JSON__:';

function basePreset(preset: FrontCardPreset): ResolvedFrontStyle {
  if (preset === 'pill') {
    return {
      preset: 'pill',
      bgColor: '#ffffff',
      borderColor: '#dd6b5c',
      textColor: '#111827',
      mutedColor: '#6b7280',
      accentColor: '#c51f04',
      buttonVariant: 'none',
      imageShape: 'circle',
      arrow: false,
      titleFont: 'sans',
    };
  }

  if (preset === 'editorial') {
    return {
      preset: 'editorial',
      bgColor: '#e9e2dc',
      borderColor: '#cdbeb3',
      textColor: '#1f1b18',
      mutedColor: '#5a534d',
      accentColor: '#1f1b18',
      buttonVariant: 'outline',
      imageShape: 'rounded',
      arrow: false,
      titleFont: 'serif',
    };
  }

  return {
    preset: 'cta',
    bgColor: '#ffffff',
    borderColor: '#dd6b5c',
    textColor: '#111827',
    mutedColor: '#6b7280',
    accentColor: '#c51f04',
    buttonVariant: 'solid',
    imageShape: 'rounded',
    arrow: false,
    titleFont: 'sans',
  };
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function extractStyleSignals(text: string) {
  const wantsArrow = includesAny(text, [
    'arrow',
    'chevron',
    'go right',
    'right arrow',
    'arrow on the right',
  ]);
  const wantsNoButton = includesAny(text, [
    'no button',
    'without button',
    'remove button',
    'remove btn',
    'no btn',
    'without btn',
  ]);
  const wantsLeftImageRow = includesAny(text, [
    'image on the left',
    'img on the left',
    'left image',
    'left img',
    'heading after image',
    'title after image',
    'just heading',
    'only heading',
  ]);
  const wantsEditorial = includesAny(text, [
    'editorial',
    'magazine',
    'course card',
    'grid card',
    'beige',
  ]);
  const wantsPill = includesAny(text, [
    'pill',
    'simple row',
    'single line',
    'small row',
  ]);

  return {
    wantsArrow,
    wantsNoButton,
    wantsLeftImageRow,
    wantsEditorial,
    wantsPill,
  };
}

function getAccentColor(text: string) {
  if (includesAny(text, ['blue', 'ocean', 'navy'])) return '#2563eb';
  if (includesAny(text, ['green', 'mint', 'emerald'])) return '#059669';
  if (includesAny(text, ['purple', 'violet'])) return '#7c3aed';
  if (includesAny(text, ['pink', 'rose'])) return '#db2777';
  if (includesAny(text, ['orange', 'amber'])) return '#ea580c';
  if (includesAny(text, ['black', 'dark'])) return '#111827';
  return '#c51f04';
}

function resolveCustomStyle(prompt: string): ResolvedFrontStyle {
  const encodedStyle = extractEncodedStyle(prompt);
  if (encodedStyle) {
    return encodedStyle.style;
  }

  const text = prompt.toLowerCase().trim();
  const { wantsArrow, wantsNoButton, wantsLeftImageRow, wantsEditorial, wantsPill } =
    extractStyleSignals(text);

  let preset: FrontCardPreset = 'cta';
  if (wantsPill) {
    preset = 'pill';
  } else if (wantsEditorial) {
    preset = 'editorial';
  } else if (wantsLeftImageRow || (wantsArrow && wantsNoButton)) {
    // Natural-language shortcut for "image left + title + arrow right" style.
    preset = 'pill';
  }

  const resolved = basePreset(preset);
  const accent = getAccentColor(text);

  resolved.accentColor = accent;
  resolved.arrow = wantsArrow;

  if (includesAny(text, ['outline', 'line button'])) {
    resolved.buttonVariant = 'outline';
  } else if (wantsNoButton) {
    resolved.buttonVariant = 'none';
  } else if (resolved.preset !== 'pill') {
    resolved.buttonVariant = 'solid';
  }

  if (includesAny(text, ['circle image', 'round avatar', 'circle'])) {
    resolved.imageShape = 'circle';
  }

  if (includesAny(text, ['serif', 'editorial', 'luxury'])) {
    resolved.titleFont = 'serif';
  }

  if (includesAny(text, ['beige', 'cream', 'sand', 'neutral'])) {
    resolved.bgColor = '#e9e2dc';
    resolved.borderColor = '#cdbeb3';
    resolved.textColor = '#1f1b18';
    resolved.mutedColor = '#5a534d';
  }

  if (includesAny(text, ['dark', 'black', 'night'])) {
    resolved.bgColor = '#171717';
    resolved.borderColor = '#2f2f2f';
    resolved.textColor = '#f5f5f5';
    resolved.mutedColor = '#a3a3a3';
  }

  return resolved;
}

type EncodedPromptPayload = {
  style: ResolvedFrontStyle;
  prompt?: string;
};

function parseEncodedPrompt(prompt: string): EncodedPromptPayload | null {
  if (!prompt.startsWith(STYLE_PROMPT_PREFIX)) return null;
  const raw = prompt.slice(STYLE_PROMPT_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(raw) as EncodedPromptPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    const style = parsed.style;
    if (!style || typeof style !== 'object') return null;
    if (!['pill', 'cta', 'editorial'].includes(style.preset)) return null;
    if (!['solid', 'outline', 'none'].includes(style.buttonVariant)) return null;
    if (!['circle', 'rounded'].includes(style.imageShape)) return null;
    if (!['sans', 'serif'].includes(style.titleFont)) return null;

    return {
      style: {
        preset: style.preset,
        bgColor: style.bgColor,
        borderColor: style.borderColor,
        textColor: style.textColor,
        mutedColor: style.mutedColor,
        accentColor: style.accentColor,
        buttonVariant: style.buttonVariant,
        imageShape: style.imageShape,
        arrow: !!style.arrow,
        titleFont: style.titleFont,
      },
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    };
  } catch {
    return null;
  }
}

function extractEncodedStyle(prompt: string) {
  return parseEncodedPrompt(prompt);
}

export function encodeCustomStylePrompt(
  prompt: string,
  style: ResolvedFrontStyle
) {
  return `${STYLE_PROMPT_PREFIX}${JSON.stringify({
    style,
    prompt,
  })}`;
}

export function getDisplayFrontStylePrompt(prompt: string | null | undefined) {
  const text = prompt || '';
  const encoded = parseEncodedPrompt(text);
  if (!encoded) return text;
  return encoded.prompt || '';
}

export function interpretFrontStylePrompt(prompt: string): InterpretedFrontStyle {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    return { frontStyle: 'custom', normalizedPrompt: '' };
  }

  const text = normalizedPrompt.toLowerCase();
  const { wantsArrow, wantsNoButton, wantsLeftImageRow, wantsEditorial, wantsPill } =
    extractStyleSignals(text);

  let frontStyle: FrontStyleId = 'custom';
  if (wantsPill || wantsLeftImageRow || (wantsArrow && wantsNoButton)) {
    frontStyle = 'pill';
  } else if (wantsEditorial) {
    frontStyle = 'editorial';
  } else if (includesAny(text, ['cta', 'button', 'call to action'])) {
    frontStyle = 'cta';
  }

  return { frontStyle, normalizedPrompt };
}

export function isFrontStyleId(value: string | null | undefined): value is FrontStyleId {
  return FRONT_STYLE_IDS.includes(value as FrontStyleId);
}

export function resolveFrontStyle(
  frontStyle: string | null | undefined,
  prompt: string | null | undefined
): ResolvedFrontStyle | null {
  if (!frontStyle || frontStyle === 'inherit') return null;
  if (frontStyle === 'custom') return resolveCustomStyle(prompt || '');
  if (frontStyle === 'pill' || frontStyle === 'cta' || frontStyle === 'editorial') {
    return basePreset(frontStyle);
  }
  return null;
}
