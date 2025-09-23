import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default function DefaultLayout({ children }: { children: React.ReactNode; }) {
    return (
        <div className="relative flex h-screen bg-gray-50 dark:bg-[#0c0b0b]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Navbar />
                {children}
            </main>
        </div>
    );
}