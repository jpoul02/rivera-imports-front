"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoRivera, SidebarNav, SidebarFooter } from "./Sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-sidebar px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-sidebar-accent hover:text-white"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border px-5 py-4">
            <SheetTitle asChild>
              <div>
                <LogoRivera />
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-4.75rem)] flex-col">
            <SidebarNav onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
      <LogoRivera compact />
      <span className="display-title text-base text-white">RIVERA IMPORTS</span>
    </header>
  );
}
