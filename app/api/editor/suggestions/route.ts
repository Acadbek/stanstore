import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  aiGoalSchema,
  aiSuggestionResponseSchema,
  aiToneSchema,
  buildFallbackAiSuggestions,
} from '@/lib/editor/ai-suggestions';
import { getUser } from '@/lib/db/queries';

const requestSchema = z.object({
  text: z.string().min(1).max(2000),
  goal: aiGoalSchema,
  tone: aiToneSchema,
  instruction: z.string().max(300).optional(),
});

const hasAiConfig = Boolean(process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY);

const zai = hasAiConfig
  ? createOpenAI({
      baseURL: process.env.ZAI_BASE_URL!,
      apiKey: process.env.ZAI_API_KEY!,
    })
  : null;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const request = parsed.data;

  if (!zai) {
    return Response.json({
      source: 'fallback',
      suggestions: buildFallbackAiSuggestions(request),
    });
  }

  try {
    const result = await generateObject({
      model: zai('gpt-4o'),
      schema: aiSuggestionResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 900,
      system: `Siz mahsulot tavsifi yozishga yordam beradigan copywriting assistant siz.

Qoidalar:
- Foydalanuvchi kiritgan tilni saqlang. Agar matn aralash bo'lsa, dominant tilni davom ettiring.
- 7 ta foydalanishga tayyor suggestion qaytaring.
- Variantlar quyidagi rollarga mos bo'lsin:
  1. Original
  2. Focus - tanlangan goalga mos
  3. Voice - tanlangan tonega mos
  4. Benefit
  5. CTA
  6. Bullets
  7. SEO
- Har bir note juda qisqa va nima uchun foydali ekanini aytsin.
- Markdown, izoh yoki qo'shimcha prose yozmang.
- Javob faqat schema ga mos bo'lsin.`,
      prompt: `Selected text: ${request.text}
Goal: ${request.goal}
Tone: ${request.tone}
Brief: ${request.instruction?.trim() || 'none'}

Write concise suggestions that help the user improve or rewrite the selected text.`,
    });

    return Response.json({
      source: 'ai',
      suggestions: result.object.suggestions,
    });
  } catch {
    return Response.json({
      source: 'fallback',
      suggestions: buildFallbackAiSuggestions(request),
    });
  }
}
