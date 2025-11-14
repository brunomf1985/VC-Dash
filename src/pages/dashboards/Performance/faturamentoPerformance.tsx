import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useMemo } from 'react';
import { RegistroFinanceiro } from '@/pages/types';
import { Card } from '@heroui/card';
import { PageTransition } from '@/components/PageTransiotion';
import TopProdutosCard from '@/components/TopProdutosCard';
import FaturamentoPorSecao from '@/components/FaturamentoPorSeçãoCard';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useFilter } from '@/hooks/useFilter';

export default function FaturamentoPerformance() {
    const { filteredData, hasData, isLoadingApi } = useFilter();

    // Debug para entender o problema
    console.log('=== FaturamentoPerformance Debug ===');
    console.log('hasData:', hasData);
    console.log('isLoadingApi:', isLoadingApi);
    console.log('filteredData:', filteredData);

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando dados de faturamento...</p>
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

    // Envolver tudo em try-catch para capturar erros
    try {

    // 1. Lógica para encontrar a última data com dados cadastrados
    const dataBaseUltimoMes = useMemo(() => {
        const faturamentoData = filteredData?.faturamento?.find(
            (item: RegistroFinanceiro) => item.nome?.trim().toUpperCase() === "TOTAL VENDAS"
        );

        if (!faturamentoData) return new Date();

        const mesesMap: { [key: string]: number } = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };

        let ultimaDataEncontrada: Date | null = null;

        for (const key in faturamentoData) {
            if (key.startsWith('saldo_')) {
                const parts = key.split('_');
                const valor = Number((faturamentoData as any)[key] || 0);

                if (parts.length === 3 && valor > 0) {
                    const mesAbrev = parts[1];
                    const ano = parseInt(parts[2], 10);
                    const mesIndex = mesesMap[mesAbrev];

                    if (mesIndex !== undefined && !isNaN(ano)) {
                        const dataAtual = new Date(ano, mesIndex, 1);
                        if (!ultimaDataEncontrada || dataAtual > ultimaDataEncontrada) {
                            ultimaDataEncontrada = dataAtual;
                        }
                    }
                }
            }
        }

        return ultimaDataEncontrada || new Date();
    }, [filteredData]);

    const lineChartData = useMemo(() => {
        const faturamentoDados = filteredData?.faturamento?.find(
            (item: RegistroFinanceiro) => item.nome?.trim().toUpperCase() === "TOTAL VENDAS"
        );

        const valorContribuicao = filteredData?.evolucao_resultados_valor?.find(
            (item: RegistroFinanceiro) => item.nome?.trim().toUpperCase() === "MARGEM DE CONTRIBUIÇÃO"
        );

        if (!faturamentoDados) {
            console.log('faturamentoDados não encontrado');
            return [];
        }

        if (!valorContribuicao) {
            console.log('valorContribuicao não encontrado');
            return [];
        }

        const mesesProcessados = [];
        // 2. Substituímos 'new Date()' pela data encontrada na lógica acima
        const hoje = dataBaseUltimoMes;


        for (let i = 11; i >= 0; i--) {
            // O cálculo agora retrocede a partir do último mês com dados
            const dataDoPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const ano = dataDoPeriodo.getFullYear();

            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const mesAbrevCapitalizado = mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);

            const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
            const nomeDoMesCapitalizado = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);

            const chaveDoMes = `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;

            const valorFaturamento = Number((faturamentoDados as any)?.[chaveDoMes] || 0);
            const margemcontribuicao = Number((valorContribuicao as any)?.[chaveDoMes] || 0);


            mesesProcessados.push({
                name: `${mesAbrevCapitalizado} ${ano}`,
                tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
                'Faturamento': parseFloat(valorFaturamento.toFixed(2)),
                'Margem de Contribuição': parseFloat(margemcontribuicao.toFixed(2),)
            });
        }

        // Filtro mantido para limpar meses vazios caso a lógica de data falhe ou existam buracos no meio
        return mesesProcessados.filter(mes => mes.Faturamento > 0 || mes['Margem de Contribuição'] > 0);

    }, [filteredData, dataBaseUltimoMes]); // Adicionado dataBaseUltimoMes nas dependências

    const tooltipValueFormatter = (value: ValueType,) => {
        if (typeof value === 'number') {

            return new Intl.NumberFormat('pt-BR', {
                compactDisplay: 'long',
                style: 'currency',
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
                currency: 'BRL'
            }).format(value);
        }

        return value;
    };

    return (
        <>
            <PageTransition>
                <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Análise de Lucratividade Mensal</h3>
                    <p className="text-xs text-gray-500 mb-4">Comparativo entre Faturamento e Margem de Contribuição.</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} />

                            {/* Eixo Y da Esquerda para R$ */}
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickFormatter={(value) => `R$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`}
                            />

                            {/* Eixo Y da Direita para % */}
                            {/* Nota: O eixo Y diz "percent", mas os dados passados são valores absolutos. 
                                Se a intenção for mostrar porcentagem real, o dado 'Margem de Contribuição' 
                                precisaria ser calculado como % antes, ou o tickFormatter ajustado. 
                                Mantive como estava no original. */}
                            <YAxis
                                yAxisId="percent"
                                orientation="right"
                                stroke="#22c55e"
                                fontSize={12}
                                tickFormatter={(value) => `${value.toFixed(0)}%`}
                            />

                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={<CustomTooltip valueFormatter={tooltipValueFormatter}/>}
                            />

                            <Legend />

                            <Line type="monotone" dataKey="Faturamento" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Margem de Contribuição" stroke="#198754" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pb-4">
                    <FaturamentoPorSecao />
                    <TopProdutosCard />
                </div>
            </PageTransition>
        </>
    ) } catch (error) {
        console.error('Erro na renderização do FaturamentoPerformance:', error);
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Erro ao renderizar componente</p>
                    <p className="text-sm text-gray-400">Verifique o console para mais detalhes</p>
                </div>
            </div>
        );
    }
}