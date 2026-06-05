import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

/**
 * Mobile-first application frame.
 *
 * - Mobile: full-width content, sticky TopBar, fixed BottomNav.
 * - Desktop (lg+): persistent Sidebar on the left, BottomNav hidden.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar />

      <div className="flex min-h-dvh flex-1 flex-col">
        <TopBar />

        {/* pb-24 leaves room for the fixed bottom nav on mobile */}
        <main className="flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
