import { useMemo } from "react";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingDown,
    TrendingUp,
    History
} from "lucide-react";
import {
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Area,
    ComposedChart,
} from "recharts";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";

import data from "../../exemplo.json";

import { RegistroFinanceiro } from "@/pages/types";
import { PageTransition } from "@/components/PageTransiotion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CustomTooltip } from "@/components/CustomTooltip";
import { useWatchTheme } from "@/hooks/WatchTheme";
import { NameType } from "recharts/types/component/DefaultTooltipContent";


export default function VisaoGeralResultados() {

    const { isDarkMode } = useWatchTheme();

    const useLatestMonthInfo = (data: any) => {
        return useMemo(() => {
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


    const { latestKey, latestName, prevKey, prevName } = useLatestMonthInfo(data);

    const custosComerciais = useMemo(() => {
        const custosComerciaisData = data.comparativo_cmv_vs_comerciais.find(
            (item) => item.nome.trim() === "DESP. COMERCIAIS ÷ CMV (%)"
        );
        const valor = Number((custosComerciaisData as any)[latestKey] || 0);
        const meta = 10;
        return {
            valor: valor,
            descricao: `${valor.toFixed(2)}% em ${latestName}`,
            isPositive: valor <= meta
        };
    }, [data, latestKey, latestName]);

    const lucroBruto = useMemo(() => {
        const lucroBrutoData = data.evolucao_resultados_percentual.find(
            (item) => item.nome.trim() === "MARGEM DE CONTRIBUIÇÃO"
        );
        const valor = Number((lucroBrutoData as any)[latestKey] || 0);
        const meta = 25; // Meta: Lucro acima de 25%
        return {
            valor: valor,
            descricao: `${valor.toFixed(2)}% em ${latestName}`,
            isPositive: valor >= meta 
        };
    }, [data, latestKey, latestName]);

    const crescimento = useMemo(() => {
        const faturamentoData = data.faturamento.find(
            (item) => item.nome.trim() === "TOTAL VENDAS"
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
    }, [data, latestKey, prevKey, prevName]);

    const eficiencia = useMemo(() => {
        const realizadoData = data.comparativo_faturamento_projetado_vs_realizado.find(
            (item) => item.nome.trim() === "FATURAMENTO REALIZADO"
        );
        const projetadoData = data.comparativo_faturamento_projetado_vs_realizado.find(
            (item) => item.nome.trim() === "FATURAMENTO PROJETADO"
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
    }, [data, latestKey, latestName]);

    const evolucaoResultadosData = useMemo(() => {
        // 1. Buscar as fontes de dados
        const entradasData = data.recebimentos.find(
            (item) => item.nome.trim() === "TOTAL RECEBIMENTOS"
        );
        const custosVariaveisData = data.evolucao_resultados_valor.find(
            (item) => item.nome.trim() === "CUSTOS VARIÁVEIS"
        );
        const custosFixosData = data.evolucao_resultados_valor.find(
            (item) => item.nome.trim() === "CUSTOS FIXOS OPERACIONAIS"
        );

        if (!entradasData || !custosVariaveisData || !custosFixosData) {
            return [];
        }

        const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
            const mesAbrev = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = data.getFullYear();
            return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
        };

        const mesesProcessados = [];
        const hoje = new Date();

        for (let i = 11; i >= 0; i--) {
            const dataDoPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const ano = dataDoPeriodo.getFullYear();

            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const mesAbrevCapitalizado = mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);

            const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
            const nomeDoMesCapitalizado = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);

            const chaveDoMes = criarChaveDoMes(dataDoPeriodo);

            const valorEntradas = Number((entradasData as any)[chaveDoMes] || 0);
            const valorCustoVariavel = Number((custosVariaveisData as any)[chaveDoMes] || 0);
            const valorCustoFixo = Number((custosFixosData as any)[chaveDoMes] || 0);

            const valorSaidas = valorCustoVariavel + valorCustoFixo;
            const valorResultado = valorEntradas - valorSaidas;

            let valorMargem = 0;
            if (valorEntradas > 0) {
                valorMargem = (valorResultado / valorEntradas) * 100;
            }

            if (valorEntradas > 0 || valorSaidas > 0) {
                mesesProcessados.push({
                    name: `${mesAbrevCapitalizado} ${ano}`,
                    tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
                    'Entradas': parseFloat(valorEntradas.toFixed(2)),
                    'Resultado': parseFloat(valorResultado.toFixed(2)),
                    'Margem': parseFloat(valorMargem.toFixed(2)),
                });
            }
        }

        return mesesProcessados;

    }, [data]);

    const chartTooltipFormatter = (value: ValueType, name: NameType) => {
        if (name === 'Margem') {
            if (typeof value === 'number') {
                return `${value.toFixed(2)}%`;
            }
            return value;
        }

        if (typeof value === 'number') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
                currency: 'BRL'
            }).format(value);
        }

        return value;
    };

    return (
        <PageTransition>
            <div className="w-full mt-6">

                {/* Grid para os 4 KPIs (Usando o novo KpiCard) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card
                        className="p-4 bg-[#d8f1e0] dark:bg-gradient-to-br from-[#004216] to-[#186431]
                                    transition-all duration-150 
                                    hover:-translate-y-1
                                    shadow-none
                                    hover:shadow-md
                                    default: hover:shadow-gray-400
                                    dark:hover:shadow-green-500/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-default-500">
                                    Custos Comerciais
                                </p>
                            </div>
                            <div
                                className={
                                    "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"
                                }
                            >
                                <ArrowDownCircle className={"text-green-500"} size={20} />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker
                                className={"text-2xl font-bold text-black dark:text-white"}
                                decimalPlaces={2}
                                value={custosComerciais.valor}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">
                                %
                            </span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className="flex">
                                {custosComerciais.isPositive ? (
                                    <TrendingUp
                                        className={
                                            custosComerciais.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                ) : (
                                    <TrendingDown
                                        className={
                                            custosComerciais.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card
                        className="p-4 bg-[#e0e5fa] dark:bg-gradient-to-br from-[#01026e] to-[#4344aa]
                                    transition-all duration-150 
                                    hover:-translate-y-1
                                    shadow-none
                                    hover:shadow-md
                                    default: hover:shadow-gray-400
                                    dark:hover:shadow-blue-500/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-default-500">
                                    Lucro bruto Operacional
                                </p>
                            </div>
                            <div
                                className={"bg-blue-100 dark:bg-orange-500/20 p-2 rounded-lg"}
                            >
                                <ArrowUpCircle className={"text-blue-500"} size={20} />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker
                                className={"text-2xl font-bold text-black dark:text-white"}
                                decimalPlaces={2}
                                value={lucroBruto.valor}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">
                                %
                            </span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className="flex">
                                {lucroBruto.isPositive ? (
                                    <TrendingUp
                                        className={
                                            lucroBruto.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                ) : (
                                    <TrendingDown
                                        className={
                                            lucroBruto.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card
                        className="p-4 bg-[#f7e8fd] dark:bg-gradient-to-br from-[#3d016e] to-[#7343aa]
                                    transition-all duration-150 
                                    hover:-translate-y-1 
                                    shadow-none
                                    hover:shadow-md
                                    default: hover:shadow-gray-400
                                    dark:hover:shadow-purple-500/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-default-500">
                                    Crescimento
                                </p>
                            </div>
                            <div
                                className={"bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg"}
                            >
                                <TrendingUp className={"text-purple-500"} size={20} />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker
                                className={"text-2xl font-bold text-black dark:text-white"}
                                decimalPlaces={2}
                                value={crescimento.valor}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">
                                %
                            </span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className="flex">
                                {crescimento.isPositive ? (
                                    <TrendingUp
                                        className={
                                            crescimento.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                ) : (
                                    <TrendingDown
                                        className={
                                            crescimento.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                    <Card
                        className="p-4 bg-[#ffeee0] dark:bg-gradient-to-br from-[#612c00] to-[#8d4e1b]
                                    transition-all duration-150 
                                    hover:-translate-y-1
                                    shadow-none
                                    hover:shadow-md
                                    default: hover:shadow-gray-400
                                    dark:hover:shadow-orange-500/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-default-500">
                                    Eficiência operacional
                                </p>
                            </div>
                            <div
                                className={"bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg"}
                            >
                                <History className={"text-orange-500"} size={20} />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker
                                className={"text-2xl font-bold text-black dark:text-white"}
                                decimalPlaces={2}
                                value={eficiencia.valor}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">
                                %
                            </span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className="flex">
                                {eficiencia.isPositive ? (
                                    <TrendingUp
                                        className={
                                            eficiencia.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                ) : (
                                    <TrendingDown
                                        className={
                                            eficiencia.isPositive
                                                ? `text-success mr-1`
                                                : `text-danger mr-1`
                                        }
                                        size={14}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                </div>
                    <Card className="p-4 bg-white dark:bg-[#141313] mt-4" style={{ height: "400px" }}>
                        <CardHeader className='grid gap-1'>
                            <p className="text-base font-semibold">Evolução dos Resultados</p>
                            <p className="text-xs text-gray-500">Entradas, Resultado e Margem (%) mensal</p>
                        </CardHeader>
                        <CardBody>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={evolucaoResultadosData}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                    />
                                    <XAxis dataKey="name" stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} />

                                    {/* Eixo Y da Esquerda (para R$) */}
                                    <YAxis
                                        yAxisId="left"
                                        stroke={isDarkMode ? "#e0e0e0" : "#333"}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`}
                                    />
                                    {/* Eixo Y da Direita (para %) */}
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke={isDarkMode ? "#e0e0e0" : "#aaa"}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value: number) => `${value}%`}
                                    />

                                    <Tooltip
                                        cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)' }}
                                        // Usando o novo formatador
                                        content={<CustomTooltip valueFormatter={chartTooltipFormatter} />}
                                    />
                                    <Legend />

                                    {/* Área 1: Entradas (associada ao eixo da esquerda) */}
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="Entradas"
                                        name="Entradas"
                                        stroke="#3b82f6"
                                        fill="url(#colorEntradas)"
                                        strokeWidth={2}
                                    />
                                    {/* Área 2: Resultado (associada ao eixo da esquerda) */}
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="Resultado"
                                        name="Resultado"
                                        stroke="#22c55e"
                                        fill="url(#colorResultado)"
                                        strokeWidth={2}
                                    />
                                    {/* Linha 3: Margem (associada ao eixo da direita) */}
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="Margem"
                                        name="Margem"
                                        stroke="#f97316" // Laranja
                                        strokeWidth={2.5}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
            </div>
        </PageTransition >
    );
}