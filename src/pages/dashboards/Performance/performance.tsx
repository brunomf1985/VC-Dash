import { useState } from 'react';
import { PageTransition } from "@/components/PageTransiotion";
import { useFilter } from '@/hooks/useFilter';
import AnalisePerformance from './analisePerformance';
import VisaoGeralPerformance from './visaogeralPerformance';
import FaturamentoPerformance from './faturamentoPerformance';
import EvolucaoPerformance from './evolucaoPerformance';

export default function Performance() {
    const { hasData, isLoadingApi } = useFilter();
    const tabs = ['Visão Geral', 'Faturamento', 'Evolução', 'Análise'];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando dados de performance...</p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (!hasData) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
                        <p className="text-sm text-gray-400">Faça login e selecione um cliente para carregar dados da API</p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
            <PageTransition>
                <section className="flex flex-col gap-2 py-8 md:py-3">
                    <div className="w-full grid grid-cols-4 bg-gray-100 dark:bg-[#141313] rounded-lg p-1">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`p-2 text-center rounded-md transition-colors duration-300
                                  ${activeTab === tab
                                        ? 'bg-white dark:bg-black text-black dark:text-white shadow'
                                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-[#252525]'
                                    }`
                                }
                            >
                                <p className="text-sm font-medium">{tab}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 h-96">
                        {activeTab === 'Visão Geral' && <VisaoGeralPerformance />}
                        {activeTab === 'Faturamento' && <FaturamentoPerformance/>}
                        {activeTab === 'Evolução' && <EvolucaoPerformance />}
                        {activeTab === 'Análise' && <AnalisePerformance />}
                    </div>
                </section>
            </PageTransition>
    );
}