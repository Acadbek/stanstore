import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getUser } from '@/lib/db/queries';

const zai = createOpenAI({
  baseURL: process.env.ZAI_BASE_URL,
  apiKey: process.env.ZAI_API_KEY,
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: zai('gpt-4o'),
    system: `Siz mahsulotlar bo'yicha yordamchi AI siz. Siz foydalanuvchiga uning do'konidagi mahsulotlar haqida maslahat berishingiz, tavsif yozishga yordam berishingiz, narxlash strategiyasi taklif qilishingiz, marketing goyalari bera olishingiz mumkin.

Qoidalari:
- O'zbek va ingliz tillarida gaplashing (foydalanuvchi qaysi tilda so'rasa, shu tilda javob ber)
- Do'stona va professional bo'l
- Qisqa va aniq javob ber
- Agar savol mahsulotlar bilan bog'liq bo'lmasa ham, yordam berishga harakat qil`,
    messages,
  });

  return result.toTextStreamResponse();
}
