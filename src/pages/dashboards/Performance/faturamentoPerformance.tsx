import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useMemo } from 'react';
import { RegistroFinanceiro } from '@/pages/types';
import data from '../../exemplo.json'
import { Card } from '@heroui/card';
import { PageTransition } from '@/components/PageTransiotion';
import TopProdutosCard from '@/components/TopProdutosCard';
import FaturamentoPorSecao from '@/components/FaturamentoPorSeçãoCard';
import { CustomTooltip } from '@/components/CustomTooltip';

export default function FaturamentoPerformance() {

    const lineChartData = useMemo(() => {
        const faturamentoDados = data.faturamento.find(
            (item) => item.nome.trim().toUpperCase() === "TOTAL VENDAS"
        );

        const valorContribuicao = data.evolucao_resultados_valor.find(
            (item) => item.nome.trim().toUpperCase() === "MARGEM DE CONTRIBUIÇÃO"
        );

        if (!faturamentoDados) {
            return [];
        }

        const mesesProcessados = [];
        const hoje = new Date();


        for (let i = 11; i >= 0; i--) {
            const dataDoPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const ano = dataDoPeriodo.getFullYear();

            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const mesAbrevCapitalizado = mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);

            const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
            const nomeDoMesCapitalizado = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);

            const chaveDoMes = `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;

            const valorFaturamento = Number((faturamentoDados as any)[chaveDoMes] || 0);
            const margemcontribuicao = Number((valorContribuicao as any)[chaveDoMes] || 0)


            mesesProcessados.push({
                name: `${mesAbrevCapitalizado} ${ano}`,
                tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
                'Faturamento': parseFloat(valorFaturamento.toFixed(2)),
                'Margem de Contribuição': parseFloat(margemcontribuicao.toFixed(2),)
            });
        }

        return mesesProcessados.filter(mes => mes.Faturamento > 0 || mes['Margem de Contribuição'] > 0);

    }, [data]);

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
                    <FaturamentoPorSecao vendas={data.vendas_por_secao} />
                    <TopProdutosCard vendas={data.vendas_por_produto} />
                </div>
            </PageTransition>
        </>
    )
}