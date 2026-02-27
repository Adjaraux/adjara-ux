import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SpecialtyCelebrationModal } from '@/components/dashboard/specialty-celebration-modal';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealtimeRefresher } from '@/components/dashboard/realtime-refresher';

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <AppSidebar />
            </div>

            <main className="pl-0 md:pl-64 transition-all duration-300">
                <RealtimeRefresher />
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-6 h-6 text-slate-600" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 border-none w-64">
                                <AppSidebar />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationBell />
                    </div>
                </header>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <SpecialtyCelebrationModal />
        </div>
    );
}
