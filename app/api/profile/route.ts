import { getUser } from '@/lib/db/queries';
import { getProfileByUserId } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  return Response.json({ user, profile });
}
