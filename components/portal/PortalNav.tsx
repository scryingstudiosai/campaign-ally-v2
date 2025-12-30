'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalNavProps {
  campaignId: string;
  isSpectator?: boolean;
  characterName?: string;
}

export function PortalNav({ campaignId, isSpectator = false, characterName }: PortalNavProps) {
  const pathname = usePathname();

  const basePath = `/portal/${campaignId}`;

  const navItems = [
    {
      href: basePath,
      icon: User,
      label: 'Character',
      color: 'text-teal-400',
      bgColor: 'bg-teal-400/10',
      disabled: isSpectator,
    },
    {
      href: `${basePath}/inventory`,
      icon: Package,
      label: 'Inventory',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      disabled: isSpectator,
    },
    {
      href: `${basePath}/journal`,
      icon: BookOpen,
      label: 'Journal',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      disabled: false,
    },
    {
      href: `${basePath}/world`,
      icon: Globe,
      label: 'World',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      disabled: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 opacity-40 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/50">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 transition-all"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive
                    ? `${item.bgColor} ${item.color}`
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  isActive ? item.color : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
