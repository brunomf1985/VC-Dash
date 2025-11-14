import { Sidebar } from "@/components/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/theme-toggle";
import { useFilter } from "@/hooks/useFilter";
import { FilterBar } from "@/components/FilterBar";

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const { dateFilter, setDateFilter, availableMonths, availableClients } = useFilter();

  return (
    <div className="relative flex h-screen bg-gray-50 dark:bg-[#0c0b0b]">
      <Sidebar />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-8 z-10">
        <AnimatedThemeToggler />
      </div>
      
      {/* Barra de Filtros Global */}
      <div className="absolute top-2 right-20">
        <div className="flex justify-between items-center"> 
          <FilterBar
            currentFilter={dateFilter}
            onFilterChange={setDateFilter}
            availableMonths={availableMonths}
            availableClients={availableClients}
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto pt-20 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}