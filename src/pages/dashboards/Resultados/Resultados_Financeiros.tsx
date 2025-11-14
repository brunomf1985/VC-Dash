import { useMemo } from "react";
import { Percent, Target, TrendingDown, TrendingUp } from "lucide-react";

import { PageTransition } from "@/components/PageTransiotion";
import Cards from "@/components/Cards";
import { AnaliseCompletaCard } from "@/components/AnaliseCompletaCard";
import { AnaliseNaoOperacional } from "@/components/AnaliseNaoOperacional";
import { useFilter } from "@/hooks/useFilter";

const useUltimoMesInfo = (data: any) => {
    return useMemo(() => {
        if (!data || !data.faturamento) {
            return { latestKey: 'N/A', latestName: 'N/A' };
        }

        const faturamentoData = data.faturamento.find(
            (item: any) => item.nome.trim() === "TOTAL VENDAS"
        );

        if (!faturamentoData) {
            return { latestKey: 'N/A', latestName: 'N/A' };
        }

        // Buscar todas as chaves que existem nos dados filtrados
        const chavesComDados: { key: string, date: Date, value: number }[] = [];
        
        for (const key in faturamentoData) {
            if (key.startsWith('saldo_') && key !== 'saldo_total') {
                const parts = key.split('_');
                if (parts.length === 3) {
                    const mesAbrev = parts[1];
                    const ano = parseInt(parts[2]);
                    const valor = Number(faturamentoData[key] || 0);
                    
                    if (faturamentoData[key] !== undefined) {
                        const mesesMap: { [key: string]: number } = {
                            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
                        };
                        
                        if (mesesMap[mesAbrev] !== undefined) {
                            const date = new Date(ano, mesesMap[mesAbrev], 1);
                            chavesComDados.push({ key, date, value: valor });
                        }
                    }
                }
            }
        }

        // Ordenar por data (mais recente primeiro)
        chavesComDados.sort((a, b) => b.date.getTime() - a.date.getTime());

        let latestKey = 'N/A';
        let latestName = 'N/A';

        if (chavesComDados.length > 0) {
            const latest = chavesComDados[0];
            latestKey = latest.key;
            const nomeDoMes = latest.date.toLocaleString('pt-BR', { month: 'long' });
            latestName = `${nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1)}`;
        }

        return { latestKey, latestName };

    }, [data]);
};

const useMelhorResultado = (data: any) => {
    return useMemo(() => {
        if (!data || !data.evolucao_resultados_valor) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        const resultadoData = data.evolucao_resultados_valor.find(
            (item: any) => item.nome.trim() === "RESULTADO FINAL"
        );

        if (!resultadoData) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        let melhorValor = -Infinity;
        let melhorNome = 'N/A';

        // Buscar nos dados filtrados em vez de procurar desde hoje
        for (const key in resultadoData) {
            if (key.startsWith('saldo_') && key !== 'saldo_total' && resultadoData[key] !== undefined) {
                const parts = key.split('_');
                if (parts.length === 3) {
                    const mesAbrev = parts[1];
                    const ano = parseInt(parts[2]);
                    const valorAtual = Number(resultadoData[key]);
                    
                    if (valorAtual > melhorValor) {
                        melhorValor = valorAtual;
                        
                        const mesesMap: { [key: string]: number } = {
                            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
                        };
                        
                        if (mesesMap[mesAbrev] !== undefined) {
                            const date = new Date(ano, mesesMap[mesAbrev], 1);
                            const nomeDoMes = date.toLocaleString('pt-BR', { month: 'long' });
                            melhorNome = `${nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1)}`;
                        }
                    }
                }
            }
        }

        if (melhorValor === -Infinity) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        return {
            valor: melhorValor,
            nome: melhorNome,
            isPositive: melhorValor >= 0
        };
    }, [data]);
};

const useResultadoAcumulado = (data: any) => {
    return useMemo(() => {
        if (!data || !data.evolucao_resultados_valor) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        const resultadoData = data.evolucao_resultados_valor.find(
            (item: any) => item.nome.trim() === "RESULTADO FINAL"
        );

        if (!resultadoData) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        const totalAcumulado = Number(resultadoData.saldo_total || 0);
        const periodo = data.periodo || "Período não informado";
        const meta = 0;

        return {
            valor: totalAcumulado,
            nome: `Acumulado (${periodo})`,
            isPositive: totalAcumulado >= meta
        };
    }, [data]);
};

const useMargemOperacionalMedia = (data: any) => {
    return useMemo(() => {
        if (!data || !data.evolucao_resultados_percentual) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        const kpiData = data.evolucao_resultados_percentual.find(
            (item: any) => item.nome.trim() === "MARGEM DE CONTRIBUIÇÃO"
        );
        if (!kpiData) {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }
        const valor = Number(kpiData.media || 0);
        return {
            valor: valor,
            nome: `Média de ${data.periodo}`,
            isPositive: valor >= 0
        };
    }, [data]);
};

const useEficienciaUltimoMes = (data: any, latestKey: string, latestName: string) => {
    return useMemo(() => {
        // Verificar se o campo comparativo existe para este cliente
        if (!data || !data.comparativo_faturamento_projetado_vs_realizado) {
            console.log('Campo comparativo_faturamento_projetado_vs_realizado não disponível para este cliente');
            return { valor: 0, nome: 'Dados indisponíveis', isPositive: false };
        }

        const realizadoData = data.comparativo_faturamento_projetado_vs_realizado.find(
            (item: any) => item.nome.trim() === "FATURAMENTO REALIZADO"
        );
        const projetadoData = data.comparativo_faturamento_projetado_vs_realizado.find(
            (item: any) => item.nome.trim() === "FATURAMENTO PROJETADO"
        );

        if (!realizadoData || !projetadoData || latestKey === 'N/A') {
            return { valor: 0, nome: 'N/A', isPositive: false };
        }

        const valorRealizado = Number((realizadoData as any)[latestKey] || 0);
        const valorProjetado = Number((projetadoData as any)[latestKey] || 0);

        let eficiencia = 0;
        if (valorProjetado > 0) {
            eficiencia = (valorRealizado * 100) / valorProjetado;
        }

        const meta = 30;
        return {
            valor: eficiencia,
            nome: `Eficiência em ${latestName}`,
            isPositive: eficiencia >= meta
        };
    }, [data, latestKey, latestName]);
};


export default function Resultados_Financeiros() {
    const { filteredData, hasData, isLoadingApi, hasRequiredFields, missingFields } = useFilter();

    // Debug logs
    console.log('=== Resultados Financeiros Debug ===');
    console.log('hasData:', hasData);
    console.log('hasRequiredFields:', hasRequiredFields);
    console.log('missingFields:', missingFields);
    console.log('filteredData:', filteredData);

    // Validação de campos obrigatórios
    if (!hasRequiredFields) {
        console.log('Campos obrigatórios não preenchidos:', missingFields);
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Campos obrigatórios não preenchidos</p>
                    <p className="text-sm text-gray-400">
                        Preencha os campos: {missingFields.join(', ')}
                    </p>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoadingApi) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando dados...</p>
                </div>
            </div>
        );
    }

    // Validação de dados
    if (!hasData || !filteredData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
                    <p className="text-sm text-gray-400">Selecione um cliente e período para carregar dados</p>
                </div>
            </div>
        );
    }

    // Validação de campos específicos necessários para este componente
    const requiredFields = ['faturamento', 'evolucao_resultados_valor', 'evolucao_resultados_percentual'];
    const missingDataFields = requiredFields.filter(field => !filteredData[field]);
    
    if (missingDataFields.length > 0) {
        console.warn('Campos necessários para Resultados Financeiros não encontrados:', missingDataFields);
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Dados insuficientes</p>
                    <p className="text-sm text-gray-400">Alguns dados necessários não estão disponíveis para este cliente</p>
                    <p className="text-xs text-gray-400 mt-2">Campos faltando: {missingDataFields.join(', ')}</p>
                </div>
            </div>
        );
    }

    const { latestKey, latestName } = useUltimoMesInfo(filteredData);
    const MelhorResultado = useMelhorResultado(filteredData);
    const ResultadoAcumulado = useResultadoAcumulado(filteredData);
    const MargemMedia = useMargemOperacionalMedia(filteredData);
    const EficienciaUltimoMes = useEficienciaUltimoMes(filteredData, latestKey, latestName);

    return (
        <PageTransition>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <Cards
                    title="Melhor Resultado Mensal"
                    showSubTitle={false}
                    value={MelhorResultado.valor}
                    meta={0}
                    showMeta={false}
                    showDescription={true}
                    description={`Melhor resultado: ${MelhorResultado.nome}`}
                    isPositive={MelhorResultado.isPositive}
                    Icon={MelhorResultado.isPositive ? TrendingUp : TrendingDown}
                    prefix={'R$ '}
                    suffix=""
                    showProgress={false}
                    colors={{
                        card: "p-4 bg-[#f3f3ff] dark:bg-gradient-to-br from-[#1a1b4a] to-[#32348f]",
                        text: "text-sm text-blue-700 dark:text-blue-500",
                        icon: "text-blue-500",
                        shadowHoverClass: "dark:hover:shadow-blue-500/50",
                        progressColor: "bg-blue-300"
                    }}
                />

                <Cards
                    title="Resultado Acumulado no Ano"
                    showSubTitle={false}
                    value={ResultadoAcumulado.valor}
                    meta={0}
                    showMeta={false}
                    showDescription={true}
                    description={ResultadoAcumulado.nome}
                    isPositive={ResultadoAcumulado.isPositive}
                    Icon={ResultadoAcumulado.isPositive ? TrendingUp : TrendingDown}
                    prefix={'R$ '}
                    suffix=""
                    showProgress={false}
                    colors={{
                        card: "p-4 bg-[#f3fff5] dark:bg-gradient-to-br from-[#1c4a1a] to-[#358f32]",
                        text: "text-sm text-green-700 dark:text-green-500",
                        icon: "text-green-500",
                        shadowHoverClass: "dark:hover:shadow-green-500/50",
                        progressColor: "bg-green-300"
                    }}
                />

                <Cards
                    title="Margem Operacional Média"
                    value={MargemMedia.valor}
                    description={MargemMedia.nome}
                    showDescription={true}
                    isPositive={MargemMedia.isPositive}
                    Icon={Percent}
                    prefix=""
                    suffix="%"
                    showProgress={false}
                    meta={20}
                    showMeta={false}
                    showSubTitle={false}
                    colors={{
                        card: "p-4 bg-[#eee0fe] dark:bg-gradient-to-br from-[#25074d] to-[#520d8a]",
                        text: "text-sm text-purple-700 dark:text-purple-500",
                        icon: "text-purple-500",
                        shadowHoverClass: "dark:hover:shadow-purple-500/50",
                        progressColor: "bg-purple-300"
                    }}
                />

                <Cards
                    title="Eficiência (Último Mês)"
                    value={EficienciaUltimoMes.valor}
                    description={EficienciaUltimoMes.nome}
                    showDescription={true}
                    isPositive={EficienciaUltimoMes.isPositive}
                    Icon={Target}
                    prefix=""
                    suffix="%"
                    showProgress={false}
                    meta={100}
                    showMeta={false}
                    showSubTitle={false}
                    colors={{
                        card: "p-4 bg-[#fff7ed] dark:bg-gradient-to-br from-[#4d2203] to-[#7f3d02]",
                        text: "text-sm text-orange-700 dark:text-orange-500",
                        icon: "text-orange-500",
                        shadowHoverClass: "dark:hover:shadow-orange-500/50",
                        progressColor: "bg-orange-300"
                    }}
                />
            </div>

                <div className="mt-4">
                    <AnaliseCompletaCard data={filteredData} />
                </div>

                <div className="mt-4 pb-4">
                    <AnaliseNaoOperacional data={filteredData} />
                </div>
        </PageTransition>
    );
}