import { 
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { AnimatedThemeToggler } from "@/components/ui/theme-toggle";
import { DataSourceIndicator } from "@/components/DataSourceIndicator";

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky" className=" bg-[#F8F9FA] dark:bg-[#0c0b0b] w-fit items-end ">

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <DataSourceIndicator />
          <AnimatedThemeToggler />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
