import { redirect } from 'next/navigation';
import { EditProfileForm } from '@/components/edit-profile-form';
import { TopNav } from '@/components/top-nav';
import { getProfileByUserId } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export default async function EditProfilePage() {
  const auth = await getServerAuth();
  if (!auth) redirect('/auth');

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (!profile) redirect('/onboarding');

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <TopNav />
      <EditProfileForm initialBio={profile.bio || ''} />
    </main>
  );
}
