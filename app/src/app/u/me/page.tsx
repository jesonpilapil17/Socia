import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function MeRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  redirect(`/u/${user.username}`);
}
