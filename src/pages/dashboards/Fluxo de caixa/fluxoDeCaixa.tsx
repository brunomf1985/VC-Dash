import { useState } from 'react';
import { PageTransition } from "@/components/PageTransiotion";
import VisaoGeralFluxo from './visaoGeralFluxo';
import TendenciaFluxo from './tendenciaFluxo';
import ProjecoesFluxo from './projecoesFLuxo';


export default function FluxoDeCaixa() {
    const tabs = ['Visão Geral', 'Tendência', 'Projeções',];
    const [activeTab, setActiveTab] = useState(tabs[0]);

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
                        {activeTab === 'Faturamento' && <TendenciaFluxo />}
                        {activeTab === 'Evolução' && <ProjecoesFluxo />}
                    </div>
                </section>
            </PageTransition>
    );
}