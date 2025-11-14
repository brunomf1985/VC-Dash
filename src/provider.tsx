import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { FilterProvider } from "./hooks/useFilter";
import { AuthProvider } from "@/contexts/AuthContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <AuthProvider>
      <HeroUIProvider navigate={navigate} useHref={useHref} className="h-full">
        <FilterProvider>
          {children}
        </FilterProvider>
      </HeroUIProvider>
    </AuthProvider>
  );
}
