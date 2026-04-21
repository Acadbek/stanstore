import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { deleteGoogleCalendarConnection } from '@/lib/google-calendar';

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteGoogleCalendarConnection(user.id);
  return NextResponse.json({ success: true });
}
