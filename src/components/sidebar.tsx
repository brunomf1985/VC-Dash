// src/components/sidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, Home, LayoutDashboard, BarChart2, GitCompareArrows, FileText, User, LogOut } from 'lucide-react';
import { useWatchTheme } from "@/hooks/WatchTheme";
import lightLogo from "@/imgs/vc-financas-logo.png";
import darkLogo from "@/imgs/vc-financas-logo-dark.png";
import { motion, } from "framer-motion";

const navItems = [
    { label: "Visão Geral", icon: Home, href: "/" },
    { label: "Dashboards", icon: LayoutDashboard, href: "/dashboards/visaofinanceira" },
    { label: "Análises", icon: BarChart2, href: "/analises" },
    { label: "Comparativos", icon: GitCompareArrows, href: "/comparativos" },
    { label: "Relatórios", icon: FileText, href: "/relatorios" },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isDarkMode } = useWatchTheme();

    return (
        <aside className={`relative h-screen bg-white dark:bg-black text-gray-800 dark:text-white flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <img
                            src={isDarkMode ? darkLogo : lightLogo}
                            alt="VC Finanças Logo"
                            className="h-8 w-auto"
                        />
                    </div>
                )}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <nav className="flex-1 p-2 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.href}
                        end={item.href === "/"}
                        className={({ isActive }) =>
                            `relative flex items-center p-2 rounded-lg transition-colors ${isActive
                                ? "text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            } ${isCollapsed ? "justify-center" : ""}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-bg"
                                        className="absolute inset-0 bg-emerald-500 rounded-lg z-0"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <div className="relative z-10 flex items-center">
                                    <item.icon size={20} />
                                    {!isCollapsed && (
                                        <span className="ml-4 font-semibold whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                <NavLink to="/Perfil/perfil" className={({ isActive }) => `flex items-center p-2 rounded-lg transition-colors ${isActive ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} ${isCollapsed ? 'justify-center' : ''}`}>
                    <User size={20} />
                    {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">Meu Perfil</span>}
                </NavLink>
                <NavLink to="/sair" className={`flex items-center p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 ${isCollapsed ? 'justify-center' : ''}`}>
                    <LogOut size={20} />
                    {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">Sair</span>}
                </NavLink>
            </div>
        </aside>
    );
}