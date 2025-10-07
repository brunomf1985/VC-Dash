import { Sidebar } from "@/components/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/theme-toggle";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen bg-gray-50 dark:bg-[#0c0b0b]">
      <Sidebar />
      <div className="absolute top-4 right-8 z-10">
        <AnimatedThemeToggler />
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}