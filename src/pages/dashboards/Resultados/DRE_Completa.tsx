import { useMemo } from "react";
import {
    BarChart3,
    CheckCircle,
    PieChart,
    Target,
    LucideIcon // Importante para a prop do ícone
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { useFilter } from '@/hooks/useFilter';
import { PageTransition } from "@/components/PageTransiotion";
import { DRECards } from "@/components/DRECards";
import { NumberTicker } from "@/components/ui/number-ticker";

// --- Interface (simplificada para os dados) ---
interface DreData {
    periodo: string;
    faturamento: any[];
    comparativo_cmv_vs_comerciais: any[];
    evolucao_resultados_valor: any[];
    evolucao_resultados_percentual: any[];
    custos_operacionais_percentual: any[];
}

// --- Helper para buscar dados com segurança ---
const findData = (array: any[], nome: string, key: string = 'saldo_total') => {
    if (!array || !Array.isArray(array)) return 0;
    const item = array.find((d) => d.nome?.trim().toUpperCase() === nome.toUpperCase());
    return Number(item?.[key] || 0);
};

// --- Hook com a lógica do DRE ---
const useDreData = (data: DreData) => {
    return useMemo(() => {
        // Verificar se os dados estão disponíveis
        if (!data) {
            return {
                receitaBruta: 0,
                custosOperacionais: 0,
                custosOpPercent: 0,
                lucroBruto: 0,
                lucroBrutoMargem: 0,
                periodo: 'Carregando...'
            };
        }

        const receitaBruta = findData(data.faturamento, "TOTAL VENDAS");
        const custosOperacionais = findData(data.evolucao_resultados_valor, "CUSTOS FIXOS OPERACIONAIS");
        const custosOpPercent = findData(data.evolucao_resultados_percentual, "CUSTOS FIXOS OPERACIONAIS");

        const lucroBruto = findData(data.evolucao_resultados_valor, "RESULTADO OPERACIONAL");   
        const lucroBrutoMargem = findData(data.evolucao_resultados_percentual, "RESULTADO OPERACIONAL");

        const pessoalPct = findData(data.custos_operacionais_percentual, "PESSOAL");

        return {
            receitaBruta,
            custosOperacionais,
            custosOpPercent,
            lucroBruto,
            lucroBrutoMargem,
            pessoalPct,
            ebitda: lucroBruto,
            ebitdaMargem: lucroBrutoMargem,
            periodo: data.periodo || 'Período não informado'
        };
    }, [data]);
};

// --- Hook para encontrar o melhor mês ---
const useMelhorMesPerformance = (data: DreData) => {
    return useMemo(() => {
        if (!data || !data.evolucao_resultados_percentual) {
            return { mes: 'N/A', margem: 0 };
        }

        const resultadoPctData = data.evolucao_resultados_percentual.find(
            (item: any) => item.nome.trim().toUpperCase() === "RESULTADO OPERACIONAL"
        );

        if (!resultadoPctData) {
            return { mes: 'N/A', margem: 0 };
        }

        let melhorMargem = -Infinity;
        let melhorMes = 'N/A';
        const hoje = new Date();

        for (let i = 0; i < 12; i++) {
            const dataDoPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = dataDoPeriodo.getFullYear();
            const chaveDoMes = `saldo_${mesAbrev}_${ano}`;

            const margemAtual = Number((resultadoPctData as any)[chaveDoMes] || 0);

            if (margemAtual > melhorMargem && resultadoPctData[chaveDoMes] !== undefined) {
                melhorMargem = margemAtual;
                const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
                melhorMes = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);
            }
        }

        return { mes: melhorMes, margem: melhorMargem };

    }, [data]);
};

// --- Sub-componente InsightCard ---
interface InsightCardProps {
    title: string;
    Icon: LucideIcon;
    colorScheme: 'blue' | 'green' | 'purple' | 'orange';
    children: React.ReactNode;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, Icon, colorScheme, children }) => {
    const colors = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-950/50",
            iconBg: "bg-blue-100 dark:bg-blue-900",
            icon: "text-blue-600 dark:text-blue-400",
            title: "text-blue-900 dark:text-blue-200",
        },
        green: {
            bg: "bg-green-50 dark:bg-green-950/50",
            iconBg: "bg-green-100 dark:bg-green-900",
            icon: "text-green-600 dark:text-green-400",
            title: "text-green-900 dark:text-green-200",
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-950/50",
            iconBg: "bg-purple-100 dark:bg-purple-900",
            icon: "text-purple-600 dark:text-purple-400",
            title: "text-purple-900 dark:text-purple-200",
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-950/50",
            iconBg: "bg-orange-100 dark:bg-orange-900",
            icon: "text-orange-600 dark:text-orange-400",
            title: "text-orange-900 dark:text-orange-200",
        },
    };
    const C = colors[colorScheme];


    return (
        <div className={`flex items-start gap-4 p-4 rounded-lg ${C.bg}`}>
            <div className={`p-2 rounded-lg ${C.iconBg} flex-shrink-0`}>
                <Icon className={C.icon} size={20} />
            </div>
            <div>
                <p className={`font-semibold ${C.title}`}>{title}</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- HOOK MESTRE (COPIADO DO OUTRO ARQUIVO) ---
const useLatestMonthInfo = (data: any) => {
    return useMemo(() => {
        if (!data || !data.faturamento) {
            return { latestKey: 'N/A', latestName: 'N/A', latestDate: null, prevKey: 'N/A', prevName: 'N/A' };
        }
        
        const faturamentoData = data.faturamento.find(
            (item: any) => item.nome.trim() === "TOTAL VENDAS"
        );

        if (!faturamentoData) {
            return { latestKey: 'N/A', latestName: 'N/A', latestDate: null, prevKey: 'N/A', prevName: 'N/A' };
        }

        const hoje = new Date();
        let latestKey = 'N/A';
        let latestName = 'N/A';
        let latestDate: Date | null = null;
        let prevKey = 'N/A';
        let prevName = 'N/A';

        for (let i = 0; i < 12; i++) {
            const dataDoPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = dataDoPeriodo.getFullYear();
            const chaveDoMes = `saldo_${mesAbrev}_${ano}`;

            if (faturamentoData[chaveDoMes] !== undefined && faturamentoData[chaveDoMes] > 0) {
                latestKey = chaveDoMes;
                const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
                latestName = `${nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1)}`;
                latestDate = dataDoPeriodo;
                const dataMesAnterior = new Date(dataDoPeriodo.getFullYear(), dataDoPeriodo.getMonth() - 1, 1);
                const prevMesAbrev = dataMesAnterior.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                const prevAno = dataMesAnterior.getFullYear();
                prevKey = `saldo_${prevMesAbrev}_${prevAno}`;
                const nomeMesAnterior = dataMesAnterior.toLocaleString('pt-BR', { month: 'long' });
                prevName = `${nomeMesAnterior.charAt(0).toUpperCase() + nomeMesAnterior.slice(1)}`;
                break;
            }
        }
        return { latestKey, latestName, latestDate, prevKey, prevName };
    }, [data]);
};


export default function DRE_Completa() {
    const { filteredData, hasData, isLoadingApi } = useFilter();

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando DRE completa...</p>
                </div>
            </div>
        );
    }

    if (!hasData || !filteredData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
                    <p className="text-sm text-gray-400">Faça login e selecione um cliente para carregar dados da API</p>
                </div>
            </div>
        );
    }

    // Validar se os campos necessários para DRE existem
    const requiredFields = ['faturamento', 'evolucao_resultados_valor', 'evolucao_resultados_percentual'];
    const missingFields = requiredFields.filter(field => !filteredData[field]);
    
    if (missingFields.length > 0) {
        console.warn('Campos necessários para DRE não encontrados:', missingFields);
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Dados insuficientes para DRE</p>
                    <p className="text-sm text-gray-400">Alguns dados necessários não estão disponíveis para este cliente</p>
                    <p className="text-xs text-gray-400 mt-2">Campos faltando: {missingFields.join(', ')}</p>
                </div>
            </div>
        );
    }

  
    const dre = useDreData(filteredData as DreData);
    const melhorMes = useMelhorMesPerformance(filteredData as DreData);

    // --- HOOKS FALTANDO (COPIADOS DO OUTRO ARQUIVO) ---
    const { latestKey, latestName, prevKey, prevName } = useLatestMonthInfo(filteredData);

    const crescimento = useMemo(() => {
        const faturamentoData = filteredData.faturamento?.find(
            (item: any) => item.nome.trim() === "TOTAL VENDAS"
        );
        if (!faturamentoData) return { valor: 0, descricao: 'N/A', isPositive: false };
        const valorAtual = Number((faturamentoData as any)[latestKey] || 0);
        const valorAnterior = Number((faturamentoData as any)[prevKey] || 0);
        let crescimento = 0;
        if (valorAnterior > 0) {
            crescimento = ((valorAtual * 100) / valorAnterior) - 100;
        } else if (valorAtual > 0) {
            crescimento = 100;
        }
        return {
            valor: crescimento,
            descricao: `vs ${prevName}`,
            isPositive: crescimento >= 0
        };
    }, [filteredData, latestKey, prevKey, prevName]);

    const eficiencia = useMemo(() => {
        // Verificar se o campo comparativo existe para este cliente
        if (!filteredData.comparativo_faturamento_projetado_vs_realizado) {
            console.log('Campo comparativo_faturamento_projetado_vs_realizado não disponível para este cliente');
            return { valor: 0, descricao: 'Dados indisponíveis', isPositive: false };
        }

        const realizadoData = filteredData.comparativo_faturamento_projetado_vs_realizado.find(
            (item: any) => item.nome.trim() === "FATURAMENTO REALIZADO"
        );
        const projetadoData = filteredData.comparativo_faturamento_projetado_vs_realizado.find(
            (item: any) => item.nome.trim() === "FATURAMENTO PROJETADO"
        );
        
        if (!realizadoData || !projetadoData) return { valor: 0, descricao: 'N/A', isPositive: false };
        
        const valorRealizado = Number((realizadoData as any)[latestKey] || 0);
        const valorProjetado = Number((projetadoData as any)[latestKey] || 0);
        let eficiencia = 0;
        if (valorProjetado > 0) {
            eficiencia = (valorRealizado * 100) / valorProjetado;
        }
        const meta = 100;
        return {
            valor: eficiencia,
            descricao: `da meta em ${latestName}`,
            isPositive: eficiencia >= meta
        };
    }, [filteredData, latestKey, latestName]);
    // --- FIM DOS HOOKS FALTANDO ---


    return (
        <PageTransition>
            <div className="w-full mt-6 px-4 md:px-16 pb-4">
                <div className="mt-4">
                    <DRECards data={filteredData as DreData} />
                </div>
                {/* Bloco de Análise Textual */}
                <Card className="p-4 bg-white dark:bg-[#141313] mt-4">
                    <CardHeader className="p-0">
                        <h2 className="text-lg font-semibold">Resumo do Resultado Operacional 2025</h2>
                        <p className="text-sm text-gray-500">Análise textual dos resultados de {dre.periodo}</p>
                    </CardHeader>
                    <CardBody className="p-0 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <InsightCard title="Performance Geral" Icon={BarChart3} colorScheme="blue">
                            <p>
                                O escritório apresentou um desempenho operacional sólido no período, com receita bruta total de <strong>R$ <NumberTicker key={`receita-${dre.receitaBruta}`} value={dre.receitaBruta} /></strong>.
                                A margem bruta de <strong><NumberTicker key={`margem-${dre.lucroBrutoMargem}`} value={dre.lucroBrutoMargem} />%</strong> demonstra boa capacidade de geração de valor, mesmo com custos operacionais
                                representando <strong><NumberTicker key={`custos-${dre.custosOpPercent}`} value={dre.custosOpPercent} />%</strong> do faturamento.
                            </p>
                        </InsightCard>
                        <InsightCard title="Resultado Operacional" Icon={CheckCircle} colorScheme="green">
                            <p>
                                O EBITDA de <strong>R$ <NumberTicker key={`ebitda-${dre.ebitda}`} value={dre.ebitda || 0} /></strong> (margem de <strong><NumberTicker key={`ebitda-margem-${dre.ebitdaMargem}`} value={dre.ebitdaMargem || 0} />%</strong>) reflete uma operação eficiente.
                                {melhorMes.mes} foi o mês de melhor performance com margem operacional de <strong><NumberTicker key={`melhor-margem-${melhorMes.margem}`} value={melhorMes.margem} />%</strong>, demonstrando crescimento consistente ao longo do período.
                            </p>
                        </InsightCard>
                        <InsightCard title="Estrutura de Custos" Icon={PieChart} colorScheme="purple">
                            <p>
                                As despesas com pessoal (<strong><NumberTicker value={dre.pessoalPct || 0} />%</strong> da receita) representam o maior componente de custo.
                                Esta estrutura é típica de escritórios de advocacia, onde o capital humano é o principal ativo produtivo.
                            </p>
                        </InsightCard>
                        <InsightCard title="Eficiência Operacional" Icon={Target} colorScheme="orange">
                            <p>
                                A eficiência operacional de <strong><NumberTicker value={eficiencia.valor} />%</strong> indica excelente gestão dos recursos disponíveis.
                                O crescimento de <strong><NumberTicker value={crescimento.valor} />%</strong> em relação ao mês anterior demonstra trajetória ascendente e potencial para manutenção do crescimento nos próximos períodos.
                            </p>
                        </InsightCard>
                    </CardBody>
                </Card>
            </div>
        </PageTransition>
    );
}
