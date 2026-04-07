import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Activity, Lock } from 'lucide-react';

const settingsItems = [
  {
    href: '/dashboard',
    icon: Users,
    title: 'Team',
    description: 'Manage team members and invitations',
  },
  {
    href: '/dashboard/general',
    icon: Shield,
    title: 'General',
    description: 'Update your account information',
  },
  {
    href: '/dashboard/activity',
    icon: Activity,
    title: 'Activity',
    description: 'View your recent activity log',
  },
  {
    href: '/dashboard/security',
    icon: Lock,
    title: 'Security',
    description: 'Password and account security settings',
  },
];

export default function SettingsPage() {
  return (
    <section className="flex-1 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Settings
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-start gap-4">
                <item.icon className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-medium text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
