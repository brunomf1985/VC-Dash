import { useState } from 'react';
import { PageTransition } from "@/components/PageTransiotion";
import { useFilter } from '@/hooks/useFilter';
import VisaoGeralFluxo from './visaoGeralFluxo';
import TendenciaFluxo from './tendenciaFluxo';
import ProjecoesFluxo from './projecoesFLuxo';


export default function FluxoDeCaixa() {
    const { hasData, isLoadingApi, hasRequiredFields, missingFields } = useFilter();
    const tabs = ['Visão Geral', 'Tendência', 'Projeções',];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    console.log('=== FluxoDeCaixa Debug ===');
    console.log('hasData:', hasData);
    console.log('isLoadingApi:', isLoadingApi);
    console.log('hasRequiredFields:', hasRequiredFields);
    console.log('missingFields:', missingFields);

    // Validação de campos obrigatórios
    if (!hasRequiredFields) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">Campos obrigatórios não preenchidos</p>
                        <p className="text-sm text-gray-400">Para carregar Fluxo de Caixa, preencha cliente e período nos filtros</p>
                        {missingFields.length > 0 && (
                            <p className="text-xs text-gray-400 mt-2">Faltando: {missingFields.join(', ')}</p>
                        )}
                    </div>
                </div>
            </PageTransition>
        );
    }

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando fluxo de caixa...</p>
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
                        <p className="text-sm text-gray-400">Erro ao carregar dados da API</p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
            <PageTransition>
                <section className="flex flex-col gap-2 py-8 md:py-3">
                    <div className="w-full grid grid-cols-3 bg-gray-100 dark:bg-[#141313] rounded-lg p-1">
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
                        {activeTab === 'Visão Geral' && <VisaoGeralFluxo />}
                        {activeTab === 'Tendência' && <TendenciaFluxo />}
                        {activeTab === 'Projeções' && <ProjecoesFluxo />}
                    </div>
                </section>
            </PageTransition>
    );
}