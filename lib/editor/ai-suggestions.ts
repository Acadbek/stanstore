import { z } from 'zod';

export const aiGoalSchema = z.enum([
  'rewrite',
  'shorten',
  'expand',
  'benefit',
  'cta',
  'bullets',
  'seo',
]);

export const aiToneSchema = z.enum([
  'friendly',
  'professional',
  'premium',
  'simple',
  'bold',
]);

export type AiGoal = z.infer<typeof aiGoalSchema>;
export type AiTone = z.infer<typeof aiToneSchema>;

export const aiSuggestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
  note: z.string(),
  badge: z.string().optional(),
});

export const aiSuggestionResponseSchema = z.object({
  source: z.enum(['ai', 'fallback']),
  suggestions: z.array(aiSuggestionSchema).length(7),
});

export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiSuggestionResponse = z.infer<typeof aiSuggestionResponseSchema>;

export type AiSuggestionRequest = {
  text: string;
  goal: AiGoal;
  tone: AiTone;
  instruction?: string;
};

export const aiGoalOptions = [
  { value: 'rewrite', label: 'Rewrite' },
  { value: 'shorten', label: 'Shorten' },
  { value: 'expand', label: 'Expand' },
  { value: 'benefit', label: 'Benefit' },
  { value: 'cta', label: 'CTA' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'seo', label: 'SEO' },
] as const satisfies ReadonlyArray<{
  value: AiGoal;
  label: string;
}>;

export const aiToneOptions = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'premium', label: 'Premium' },
  { value: 'simple', label: 'Simple' },
  { value: 'bold', label: 'Bold' },
] as const satisfies ReadonlyArray<{
  value: AiTone;
  label: string;
}>;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.!?:;,\s]+$/g, '').trim();
}

function sentenceCase(value: string) {
  const compact = collapseWhitespace(value);
  if (!compact) return compact;
  return compact.charAt(0).toUpperCase() + compact.slice(1);
}

function lowerFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function ensureSentence(value: string) {
  const trimmed = collapseWhitespace(value);
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function truncateWords(value: string, maxWords: number) {
  const words = collapseWhitespace(value).split(' ').filter(Boolean);
  if (!words.length) return '';
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function goalLabel(goal: AiGoal) {
  switch (goal) {
    case 'rewrite':
      return 'Rewrite';
    case 'shorten':
      return 'Short';
    case 'expand':
      return 'Expand';
    case 'benefit':
      return 'Benefit';
    case 'cta':
      return 'CTA';
    case 'bullets':
      return 'Bullets';
    case 'seo':
      return 'SEO';
  }
}

function toneLabel(tone: AiTone) {
  switch (tone) {
    case 'friendly':
      return 'Friendly';
    case 'professional':
      return 'Professional';
    case 'premium':
      return 'Premium';
    case 'simple':
      return 'Simple';
    case 'bold':
      return 'Bold';
  }
}

function buildToneLead(tone: AiTone) {
  switch (tone) {
    case 'friendly':
      return 'warm and easy to trust';
    case 'professional':
      return 'clear, polished, and professional';
    case 'premium':
      return 'refined and premium';
    case 'simple':
      return 'short, clear, and easy to scan';
    case 'bold':
      return 'direct, confident, and conversion-focused';
  }
}

function buildFocusText(text: string, goal: AiGoal, tone: AiTone) {
  const compact = collapseWhitespace(text);
  const baseSentence = ensureSentence(sentenceCase(stripTrailingPunctuation(compact)));

  switch (goal) {
    case 'shorten':
      return ensureSentence(truncateWords(compact, 14));
    case 'expand':
      return `${baseSentence} It gives customers more context, more confidence, and a clearer reason to buy.`;
    case 'benefit':
      return ensureSentence(
        `Perfect for customers who want ${lowerFirst(stripTrailingPunctuation(compact))}`
      );
    case 'cta':
      return `${baseSentence} Grab it now and make the next step easy.`;
    case 'bullets':
      return `- ${sentenceCase(stripTrailingPunctuation(compact))}\n- Easy to scan\n- Ready to use on a product page`;
    case 'seo':
      return `${baseSentence} It uses search-friendly wording that works well in product listings.`;
    case 'rewrite':
    default:
      return `${baseSentence} It reads ${buildToneLead(tone)}.`;
  }
}

function buildVoiceText(text: string, tone: AiTone) {
  const compact = collapseWhitespace(text);
  const baseSentence = ensureSentence(sentenceCase(stripTrailingPunctuation(compact)));

  switch (tone) {
    case 'friendly':
      return `${baseSentence} It feels warm, approachable, and easy to share.`;
    case 'professional':
      return `${baseSentence} It sounds clear, structured, and ready for a catalog or product page.`;
    case 'premium':
      return `${baseSentence} It feels polished, refined, and high-end.`;
    case 'simple':
      return `${baseSentence} It stays short, clear, and easy to read.`;
    case 'bold':
      return `${baseSentence} It sounds direct, confident, and built to convert.`;
  }
}

function buildBenefitText(text: string, tone: AiTone) {
  const compact = stripTrailingPunctuation(collapseWhitespace(text));

  switch (tone) {
    case 'friendly':
      return ensureSentence(`A friendly choice for customers who want ${lowerFirst(compact)}`);
    case 'professional':
      return ensureSentence(`A practical solution for customers who need ${lowerFirst(compact)}`);
    case 'premium':
      return ensureSentence(`A premium choice for customers who want ${lowerFirst(compact)}`);
    case 'simple':
      return ensureSentence(`An easy choice for customers who want ${lowerFirst(compact)}`);
    case 'bold':
      return ensureSentence(`A strong pick for customers who want ${lowerFirst(compact)}`);
  }
}

function buildCtaText(text: string, tone: AiTone) {
  const compact = ensureSentence(sentenceCase(stripTrailingPunctuation(collapseWhitespace(text))));

  switch (tone) {
    case 'friendly':
      return `${compact} Give it a try today.`;
    case 'professional':
      return `${compact} See how it fits your workflow.`;
    case 'premium':
      return `${compact} Upgrade to a more polished option today.`;
    case 'simple':
      return `${compact} Start now.`;
    case 'bold':
      return `${compact} Buy now and move faster.`;
  }
}

function buildBulletText(text: string) {
  const compact = sentenceCase(stripTrailingPunctuation(collapseWhitespace(text)));
  const lead = truncateWords(compact, 10) || compact;
  return `- ${ensureSentence(lead)}\n- Easy to scan\n- Ready for a product page`;
}

function buildSeoText(text: string, tone: AiTone) {
  const compact = ensureSentence(sentenceCase(stripTrailingPunctuation(collapseWhitespace(text))));

  switch (tone) {
    case 'friendly':
      return `${compact} It uses clear language that feels natural and easy to read.`;
    case 'professional':
      return `${compact} It uses search-friendly wording with a clear and trustworthy tone.`;
    case 'premium':
      return `${compact} It uses polished language with a high-end feel.`;
    case 'simple':
      return `${compact} It keeps the wording short and search-friendly.`;
    case 'bold':
      return `${compact} It uses strong wording that helps the listing stand out.`;
  }
}

export function buildFallbackAiSuggestions({
  text,
  goal,
  tone,
}: AiSuggestionRequest): AiSuggestion[] {
  const compact = collapseWhitespace(text);
  if (!compact) return [];

  return [
    {
      id: 'original',
      label: 'Original',
      text: compact,
      note: 'Keep the selected wording as-is.',
    },
    {
      id: 'focus',
      label: 'Focus',
      text: buildFocusText(compact, goal, tone),
      note: `Matches the selected goal: ${goalLabel(goal)}.`,
      badge: goalLabel(goal),
    },
    {
      id: 'voice',
      label: 'Voice',
      text: buildVoiceText(compact, tone),
      note: `Matches the selected tone: ${toneLabel(tone)}.`,
      badge: toneLabel(tone),
    },
    {
      id: 'benefit',
      label: 'Benefit',
      text: buildBenefitText(compact, tone),
      note: 'Starts with customer value.',
    },
    {
      id: 'cta',
      label: 'CTA',
      text: buildCtaText(compact, tone),
      note: 'Ends with a stronger next step.',
    },
    {
      id: 'bullets',
      label: 'Bullets',
      text: buildBulletText(compact),
      note: 'Easy to scan on product pages.',
    },
    {
      id: 'seo',
      label: 'SEO',
      text: buildSeoText(compact, tone),
      note: 'Search-friendly wording for listings.',
    },
  ];
}
