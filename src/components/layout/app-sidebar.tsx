"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Brain,
  CalendarDays,
  Code,
  Flame,
  Tags,
  Target,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Daily", href: "/daily", icon: CalendarDays },
  { title: "Problems", href: "/problems", icon: Code },
  { title: "Streaks", href: "/streaks", icon: Flame },
  { title: "Topics", href: "/topics", icon: Tags },
  { title: "Review", href: "/review", icon: Brain },
  { title: "Goals", href: "/goals", icon: Target },
  { title: "Tutor", href: "/tutor", icon: MessageCircle },
];

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AppSidebar() {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    handleSync();
    const interval = setInterval(handleSync, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [handleSync]);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="px-2 text-xl font-heading hover:text-primary transition-colors">leetcode legends</Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          className="w-fit mx-auto px-3"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
