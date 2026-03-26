import { getUser, getProductsByUserId } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await getProductsByUserId(user.id);
  return Response.json(products);
}
