'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Settings,
  Menu,
  UserCircle,
  Package,
  PanelLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  {
    href: '/dashboard/profile',
    icon: UserCircle,
    label: 'Profile',
    matchPrefix: true,
  },
  { href: '/dashboard/products', icon: Package, label: 'Products' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="flex min-h-[calc(100dvh-68px)] w-full">
      <aside
        className={`bg-white lg:bg-gray-50 border-r border-gray-200 lg:block lg:sticky lg:top-0 h-screen shrink-0 ${
          isSidebarOpen ? 'block' : 'hidden'
        } lg:relative absolute inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-14' : 'w-40'}`}
      >
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-medium">Settings</span>
          <Button variant="ghost" onClick={() => setIsSidebarOpen(false)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <div className="hidden lg:flex items-center h-12 pt-4 px-2">
          <div className="ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelLeft className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
        <nav className="h-full overflow-y-auto p-2 flex flex-col">
          {navItems.map((item) => {
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.href)
              : pathname === item.href;
            const button = (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`shadow-none my-0.5 w-full ${
                    isCollapsed ? 'justify-start px-0' : 'justify-start'
                  } ${isActive ? 'bg-gray-100' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-1">{item.label}</span>}
                </Button>
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>
      </aside>

      {!isSidebarOpen && (
        <button
          type="button"
          className="lg:hidden fixed bottom-4 right-4 z-50 h-12 w-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
