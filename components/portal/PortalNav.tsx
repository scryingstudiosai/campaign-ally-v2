'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MessageSquare, Book, Globe, Moon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  campaignId: string;
  userId: string;
  isSpectator?: boolean;
}

export function PortalNav({ campaignId, userId, isSpectator = false }: Props) {
  const pathname = usePathname();
  const basePath = `/portal/${campaignId}`;
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  // Fetch unread count
  useEffect(() => {
    const fetchUnread = async () => {
      // Party messages not from me that are unread
      const { count: partyCount } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('channel', 'party')
        .eq('is_read', false)
        .neq('sender_id', userId);

      // DM whispers to me that are unread
      const { count: dmCount } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('channel', 'dm_private')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      setUnreadCount((partyCount || 0) + (dmCount || 0));
    };

    fetchUnread();

    // Subscribe to new messages
    const channel = supabase
      .channel(`nav-unread-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const msg = payload.new as Record<string, unknown>;
          if (msg.sender_id !== userId) {
            if (msg.channel === 'party' || msg.recipient_id === userId) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, userId, supabase]);

  // Clear unread when visiting messages page
  useEffect(() => {
    if (pathname.includes('/messages')) {
      setUnreadCount(0);
    }
  }, [pathname]);

  const navItems = [
    { href: basePath, icon: User, label: 'Character', disabled: isSpectator },
    { href: `${basePath}/inventory`, icon: Package, label: 'Inventory', disabled: isSpectator },
    { href: `${basePath}/party`, icon: Users, label: 'Party', disabled: false },
    { href: `${basePath}/messages`, icon: MessageSquare, label: 'Messages', badge: unreadCount > 0 ? unreadCount : undefined, disabled: false },
    { href: `${basePath}/journal`, icon: Book, label: 'Journal', disabled: false },
    { href: `${basePath}/world`, icon: Globe, label: 'World', disabled: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 px-2 pt-2 pb-6 md:pb-2 z-30">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1 opacity-40 cursor-not-allowed"
              >
                <div className="relative">
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
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative",
                isActive
                  ? "text-teal-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
