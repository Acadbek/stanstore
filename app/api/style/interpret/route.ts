import { getUser } from '@/lib/db/queries';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import {
  FRONT_STYLE_IDS,
  encodeCustomStylePrompt,
  interpretFrontStylePrompt,
  type ResolvedFrontStyle,
  type FrontStyleId,
} from '@/lib/product-front-style';

type Payload = {
  prompt?: string;
};

function sanitizeInterpretation(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const frontStyle = record.frontStyle;
  const normalizedPrompt = record.normalizedPrompt;
  if (
    typeof frontStyle !== 'string' ||
    !FRONT_STYLE_IDS.includes(frontStyle as FrontStyleId) ||
    typeof normalizedPrompt !== 'string'
  ) {
    return null;
  }

  return {
    frontStyle: frontStyle as FrontStyleId,
    normalizedPrompt: normalizedPrompt.trim().slice(0, 3000),
  };
}

function sanitizeStyle(value: unknown): ResolvedFrontStyle | null {
  if (!value || typeof value !== 'object') return null;
  const style = value as Record<string, unknown>;
  const preset = style.preset;
  const buttonVariant = style.buttonVariant;
  const imageShape = style.imageShape;
  const titleFont = style.titleFont;
  if (!['pill', 'cta', 'editorial'].includes(String(preset))) return null;
  if (!['solid', 'outline', 'none'].includes(String(buttonVariant))) return null;
  if (!['circle', 'rounded'].includes(String(imageShape))) return null;
  if (!['sans', 'serif'].includes(String(titleFont))) return null;

  const fields = [
    'bgColor',
    'borderColor',
    'textColor',
    'mutedColor',
    'accentColor',
  ] as const;
  for (const key of fields) {
    if (typeof style[key] !== 'string') return null;
  }

  return {
    preset: preset as ResolvedFrontStyle['preset'],
    bgColor: style.bgColor as string,
    borderColor: style.borderColor as string,
    textColor: style.textColor as string,
    mutedColor: style.mutedColor as string,
    accentColor: style.accentColor as string,
    buttonVariant: buttonVariant as ResolvedFrontStyle['buttonVariant'],
    imageShape: imageShape as ResolvedFrontStyle['imageShape'],
    arrow: !!style.arrow,
    titleFont: titleFont as ResolvedFrontStyle['titleFont'],
  };
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Payload;
  const prompt = (body.prompt || '').trim();
  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const fallback = interpretFrontStylePrompt(prompt);

  const canUseAi = !!process.env.ZAI_API_KEY && !!process.env.ZAI_BASE_URL;
  if (!canUseAi) {
    return Response.json({ ...fallback, displayPrompt: prompt });
  }

  try {
    const model = createOpenAI({
      baseURL: process.env.ZAI_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
    })('gpt-4o');

    const { text } = await generateText({
      model,
      temperature: 0,
      system:
        'You convert storefront style requests into JSON. Return ONLY JSON.',
      prompt: [
        'Interpret this style request for a storefront product card.',
        'Output keys: frontStyle, normalizedPrompt, style.',
        'Allowed frontStyle: "pill", "cta", "editorial", "custom".',
        'style object keys:',
        'preset, bgColor, borderColor, textColor, mutedColor, accentColor, buttonVariant, imageShape, arrow, titleFont.',
        'Allowed style.preset: "pill" | "cta" | "editorial".',
        'Allowed style.buttonVariant: "solid" | "outline" | "none".',
        'Allowed style.imageShape: "circle" | "rounded".',
        'Allowed style.titleFont: "sans" | "serif".',
        'If prompt asks image left + title after image + remove button + arrow on right, use preset "pill", buttonVariant "none", arrow true.',
        `User request: ${prompt}`,
        'Respond with JSON only.',
      ].join('\n'),
    });

    const raw = JSON.parse(text) as Record<string, unknown>;
    const parsed = sanitizeInterpretation(raw);
    const style = sanitizeStyle(raw.style);

    if (parsed && style) {
      return Response.json({
        frontStyle: 'custom',
        normalizedPrompt: encodeCustomStylePrompt(prompt, style),
        displayPrompt: prompt,
      });
    }

    if (parsed) {
      return Response.json({
        ...parsed,
        displayPrompt: prompt,
      });
    }

    return Response.json({ ...fallback, displayPrompt: prompt });
  } catch {
    return Response.json({ ...fallback, displayPrompt: prompt });
  }
}
