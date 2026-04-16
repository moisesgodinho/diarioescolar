import { useState } from 'react';
import { Bell, HelpCircle, Menu, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { SidebarContent } from './Sidebar';

export function TopBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-200 lg:hidden">
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-xs p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navegação principal</SheetTitle>
                <SheetDescription>Abra uma área do sistema pelo menu lateral.</SheetDescription>
              </SheetHeader>
              <SidebarContent mobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar alunos, turmas, relatórios..."
              className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            <Button variant="ghost" size="icon" className="rounded-xl">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-200 pl-3 sm:pl-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-600 text-white">CS</AvatarFallback>
            </Avatar>
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-gray-900">Prof. Carlos Silva</p>
              <p className="text-xs text-gray-500">Professor</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
