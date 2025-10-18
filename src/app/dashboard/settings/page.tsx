import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PinSettingsForm } from './pin-settings-form';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationPinHash: true,
      email: true,
      firstName: true,
    },
  });

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
