import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getUserProfileAdmin } from '@/lib/firebase/admin-services/users';
import { getPlayersAdmin } from '@/lib/firebase/admin-services/players';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ProfilePage() {
  // Firebase Admin auth check
  const authUser = await getDashboardUser();

  if (!authUser || !authUser.emailVerified) {
    redirect('/login');
  }

  // Fetch full user profile from Firestore
  const user = await getUserProfileAdmin(authUser.uid);
  if (!user) {
    redirect('/login');
  }

  // Fetch user's players
  const players = await getPlayersAdmin(authUser.uid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Profile</h1>
        <p className="text-zinc-600 mt-2">
          View and manage your account information
        </p>
      </div>

      {/* Personal Information Card */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <p className="text-base text-zinc-900 mt-1">{user.firstName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <p className="text-base text-zinc-900 mt-1">{user.lastName}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-base text-zinc-900">{user.email}</p>
              {user.emailVerified ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Not Verified
                </Badge>
              )}
            </div>
          </div>

          {user.phone && (
            <div>
              <label className="text-sm font-medium text-zinc-700">Phone</label>
              <p className="text-base text-zinc-900 mt-1">{user.phone}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-zinc-700">Member Since</label>
            <p className="text-base text-zinc-900 mt-1">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Parent/Guardian Status</span>
            {user.isParentGuardian ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Verified Parent
              </Badge>
            ) : (
              <Badge variant="secondary">
                Not Verified
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Terms of Service</span>
            {user.agreedToTerms ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Accepted
              </Badge>
            ) : (
              <Badge variant="secondary">
                Not Accepted
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Privacy Policy</span>
            {user.agreedToPrivacy ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Accepted
              </Badge>
            ) : (
              <Badge variant="secondary">
                Not Accepted
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Verification PIN</span>
            {user.verificationPinHash ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Configured
              </Badge>
            ) : (
              <Badge variant="secondary">
                Not Set
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Athletes Summary Card */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Athletes</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-sm text-zinc-500">No athletes added yet</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700">
                You are managing {players.length} {players.length === 1 ? 'athlete' : 'athletes'}:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {players.map((player) => (
                  <li key={player.id} className="text-sm text-zinc-600">
                    {player.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
