import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getUserProfileAdmin } from '@/lib/firebase/admin-services/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PinSettingsForm } from './pin-settings-form';

export default async function SettingsPage() {
  // Firebase Admin auth check
  const authUser = await getDashboardUser();

  if (!authUser || !authUser.emailVerified) {
    redirect('/login');
  }

  // Fetch user profile from Firestore
  const user = await getUserProfileAdmin(authUser.uid);
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-600 mt-2">
          Manage verification security and account controls.
        </p>
      </div>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Parent Verification PIN</CardTitle>
          <p className="text-sm text-zinc-500">
            Create a 4–6 digit PIN to authorize game verification. Share this PIN only with trusted guardians.
          </p>
        </CardHeader>
        <CardContent>
          <PinSettingsForm hasExistingPin={Boolean(user?.verificationPinHash)} />
        </CardContent>
      </Card>
    </div>
  );
}
