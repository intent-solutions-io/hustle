import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className='flex flex-col gap-4'>
      {/* Welcome Section */}
      <div>
        <h1 className='text-3xl font-bold text-zinc-900'>
          Dashboard
        </h1>
        <p className='text-zinc-600 mt-2'>
          Track your athletic development and monitor your progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-3'>
        {/* Total Games */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              Total Games
            </CardTitle>
            <Calendar className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>0</div>
            <p className='text-xs text-zinc-500 mt-1'>No games logged yet</p>
          </CardContent>
        </Card>

        {/* This Season */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              This Season
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>0</div>
            <p className='text-xs text-zinc-500 mt-1'>Start tracking to see trends</p>
          </CardContent>
        </Card>

        {/* Development Score */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              Development Score
            </CardTitle>
            <Target className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>--</div>
            <p className='text-xs text-zinc-500 mt-1'>Complete profile to unlock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className='border-zinc-200'>
        <CardHeader>
          <CardTitle className='text-lg'>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Link href='/dashboard/add-athlete'>
            <Button className='w-full justify-start gap-3 h-12 bg-zinc-900 hover:bg-zinc-800'>
              <User className='h-5 w-5' />
              <span className='font-medium'>Add Athlete</span>
            </Button>
          </Link>
          <Button className='w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600'>
            <PlusCircle className='h-5 w-5' />
            <span className='font-medium'>Log a Game</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
