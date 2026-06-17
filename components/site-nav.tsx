"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Convert" },
  { href: "/merge", label: "Merge PDFs" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <NavigationMenu className="mx-auto max-w-2xl px-4 py-3">
        <NavigationMenuList className="gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={cn(active && "bg-muted font-medium")}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
