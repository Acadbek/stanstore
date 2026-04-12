import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getUser } from '@/lib/db/queries';

function normalizeWhitespace(value: string) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function buildLocalContinuation(currentBlock: string, contextBefore: string) {
  const source = normalizeWhitespace(currentBlock || contextBefore);
  if (!source) return '';

  const lower = source.toLowerCase();

  if (lower.includes('perfect for') || lower.includes('ideal for')) {
    return 'and helps your customers get results faster.';
  }

  if (lower.includes('template')) {
    return 'with a ready-to-use structure you can customize in minutes.';
  }

  if (lower.includes('guide') || lower.includes('course')) {
    return 'with clear steps that make it easy to follow and apply.';
  }

  if (lower.includes('checklist')) {
    return 'so nothing important gets missed along the way.';
  }

  if (/[.!?]$/.test(source)) {
    return 'Designed to save time and keep things simple.';
  }

  return 'that saves time and makes the next step easier.';
}

const zai =
  process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY
    ? createOpenAI({
        baseURL: process.env.ZAI_BASE_URL,
        apiKey: process.env.ZAI_API_KEY,
      })
    : null;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contextBefore = '', currentBlock = '' } = await req.json();
  const trimmedContext = normalizeWhitespace(contextBefore);
  const trimmedBlock = normalizeWhitespace(currentBlock);
  const fallback = buildLocalContinuation(trimmedBlock, trimmedContext);

  if (!trimmedContext && !trimmedBlock) {
    return Response.json({ suggestion: '' });
  }

  if (!zai) {
    return Response.json({ suggestion: fallback, source: 'local' });
  }

  try {
    const aiRequest = generateText({
      model: zai('gpt-4o'),
      system:
        "You write short, natural product-description continuations. Continue the user's draft in the same language and tone. Return only the continuation text, with no quotes, labels, markdown, or explanation. Keep it concise: usually 8 to 24 words. Do not repeat the existing text verbatim.",
      prompt: `Continue this product description draft naturally.

Current paragraph tail:
${trimmedBlock || '(empty)'}

Full recent context:
${trimmedContext || '(empty)'}
`,
      maxOutputTokens: 48,
      temperature: 0.7,
    });

    const timeoutRequest = new Promise<{ text: string }>((resolve) => {
      setTimeout(() => resolve({ text: fallback }), 1500);
    });

    const { text } = await Promise.race([aiRequest, timeoutRequest]);

    const suggestion = normalizeWhitespace(text) || fallback;
    return Response.json({ suggestion, source: suggestion === fallback ? 'local' : 'ai' });
  } catch (error) {
    console.error('editor continue failed', error);
    return Response.json({ suggestion: fallback, source: 'local' });
  }
}
