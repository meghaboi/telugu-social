import { redirect } from 'next/navigation';
import { getProfileByUserId } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';
import { OnboardingForm } from '@/components/onboarding-form';

export default async function OnboardingPage() {
  const auth = await getServerAuth();
  if (!auth) redirect('/auth');

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (profile) redirect('/forum');

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <OnboardingForm userId={auth.user.id} />
    </main>
  );
}
