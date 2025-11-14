import { useMemo, } from 'react';
import { useFilter } from '@/hooks/useFilter';
import { Percent, ShoppingCart, DollarSign, BarChartHorizontal } from "lucide-react";
import { RegistroFinanceiro, RadarConfig } from '@/pages/types';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Progress } from '@heroui/progress';
import { TrendingDown, TrendingUp } from 'lucide-react';
import PerformanceSummary from '@/components/PerformanceSummary';
import { Card } from "@heroui/card";
import { PageTransition } from '@/components/PageTransiotion';
import { NumberTicker } from '@/components/ui/number-ticker';
import { CustomTooltip } from '@/components/CustomTooltip';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';



export default function VisaoGeralPerformance() {
    const { filteredData, hasData, isLoadingApi } = useFilter();

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando dados de performance...</p>
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

    const margemLucroData = useMemo(() => {
        const resultadoFinal = filteredData?.evolucao_resultados_percentual?.find((item: RegistroFinanceiro) => item.nome?.trim() === "RESULTADO FINAL");
        const media = resultadoFinal?.media ?? 0;
        const meta = 35;
        const diff = media - meta;
        return { valor: media, meta, isPositive: media >= meta, percentage: 0, period: "mês anterior", dif: diff };
    }, [filteredData]);

    const ticketMedioData = useMemo(() => {
        const ticketMedio = filteredData?.faturamento?.find((item: RegistroFinanceiro) => item.nome?.trim() === "TICKET MÉDIO");
        
        // Proteção para quando não há dados de ticket médio
        if (!ticketMedio) {
            console.warn('Dados de Ticket Médio não encontrados');
            return { valor: 0, meta: 5000, isPositive: false, dif: 0 };
        }
        
        const total = ticketMedio?.saldo_total ?? 0;
        const meta = 5000
        const diff = (total * 100 / meta) * 100
        return { valor: total, meta, isPositive: total >= meta, dif: diff };
    }, [filteredData]);

    const faturamentoMedioDiarioData = useMemo(() => {
        const faturamentoDiario = filteredData?.faturamento?.find((item: RegistroFinanceiro) => item.nome?.trim() === "MÉDIA DIÁRIA DE VENDAS");
        const media = faturamentoDiario?.media ?? 0;
        const meta = 50000;
        const diff = (media / meta) * 100;
        return { valor: media, meta, isPositive: media >= meta, dif: diff };
    }, [filteredData]);

    const custosComerciaisData = useMemo(() => {
        const custos = filteredData?.custos_operacionais_percentual?.find((item: RegistroFinanceiro) => item.nome?.trim() === "COMERCIAIS");
        const media = custos?.media ?? 0;
        const meta = 15.0;
        const diff = (media / meta) * 100;
        return { valor: media, meta, isPositive: media >= meta, dif: diff, };
    }, [filteredData]);




    // Configurações do grafico de linhas de ticket e cupons
    const evolutionChartData = useMemo(() => {
        const emissaoCupons: RegistroFinanceiro | undefined = filteredData?.faturamento?.find(
            (item: RegistroFinanceiro) => item.nome?.trim() === "EMISSÃO DE CUPONS"
        );

        const ticketMedioDados: RegistroFinanceiro | undefined = filteredData?.faturamento?.find(
            (item: RegistroFinanceiro) => item.nome?.trim() === "TICKET MÉDIO"
        );

        // Proteção: permitir gráfico mesmo sem um dos dados
        if (!emissaoCupons && !ticketMedioDados) {
            console.warn('Dados de Emissão de Cupons e Ticket Médio não encontrados');
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
            const quantCupons = Number((emissaoCupons as any)[chaveDoMes] || 0);
            const valorTicket = Number((ticketMedioDados as any)[chaveDoMes] || 0)

            mesesProcessados.push({
                name: `${mesAbrevCapitalizado} ${ano}`,
                tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
                'Emissão de Cupons': parseFloat(quantCupons.toFixed(2)),
                'Ticket Médio': parseFloat(valorTicket.toFixed(2),)
            });
        }

        return mesesProcessados.filter(mes => mes['Emissão de Cupons'] > 0 || mes['Ticket Médio'] > 0);

    }, [filteredData]); 

    const PONTUACAO_MAXIMA = 120;
    const FATOR_SUPERMETA = 1.5;

    const calcularPontuacao = (valorRealizado: number, valorMeta: number, tipoFormula: 'maiorMelhor' | 'menorMelhor'): number => {
        if (tipoFormula === 'maiorMelhor' && valorMeta === 0) {
            return valorRealizado > 0 ? PONTUACAO_MAXIMA : 0;
        }

        if (tipoFormula === 'menorMelhor' && valorMeta === 0) {
            return valorRealizado === 0 ? PONTUACAO_MAXIMA : 0;
        }

        if (valorMeta === 0) return 0;

        const superMeta = valorMeta * FATOR_SUPERMETA;
        let pontuacao = 0;

        if (tipoFormula === 'maiorMelhor') {
            if (valorRealizado <= 0) {
                pontuacao = 0;
            } else if (valorRealizado < valorMeta) {
                pontuacao = (valorRealizado / valorMeta) * 100;
            } else if (valorRealizado < superMeta) {
                const progressoNaSuperMeta = (valorRealizado - valorMeta) / (superMeta - valorMeta);
                pontuacao = 100 + (progressoNaSuperMeta * (PONTUACAO_MAXIMA - 100));
            } else {
                pontuacao = PONTUACAO_MAXIMA;
            }
        } else {
            const superMetaInversa = valorMeta * (2 - FATOR_SUPERMETA);
            if (valorRealizado >= superMeta) {
                pontuacao = 0;
            } else if (valorRealizado > valorMeta) {
                pontuacao = Math.max(0, 100 - ((valorRealizado - valorMeta) / (superMeta - valorMeta)) * 100);
            } else if (valorRealizado > superMetaInversa) {
                const progressoNaSuperMeta = (valorMeta - valorRealizado) / (valorMeta - superMetaInversa);
                pontuacao = 100 + (progressoNaSuperMeta * (PONTUACAO_MAXIMA - 100));
            } else {
                pontuacao = PONTUACAO_MAXIMA;
            }
        }

        return Math.min(PONTUACAO_MAXIMA, Math.max(0, pontuacao));
    };

    const radarChartData = useMemo(() => {
        const radarChartConfig: RadarConfig[] = [
            {
                subject: 'Margem de Lucro',
                getValor: (d: any) => d.evolucao_resultados_percentual.find((item: any) => item.nome.trim() === "RESULTADO FINAL")?.media ?? 0,
                getMeta: (d: any) => d.evolucao_resultados_percentual.find((item: any) => item.nome.trim() === "RESULTADO FINAL")?.media_sist ?? 0,
                tipoFormula: 'maiorMelhor'
            },
            {
                subject: 'Ticket Médio',
                getValor: (d: any) => {
                    const ticketItem = d.faturamento?.find((item: any) => item.nome?.trim() === "TICKET MÉDIO");
                    return ticketItem ? (ticketItem.media ?? 0) : 0;
                },
                getMeta: (d: any) => {
                    const ticketItem = d.faturamento?.find((item: any) => item.nome?.trim() === "TICKET MÉDIO");
                    return ticketItem ? (ticketItem.media_sist ?? 0) : 0;
                },
                tipoFormula: 'maiorMelhor'
            },
            {
                subject: 'Faturamento',
                getValor: (d: any) => d.faturamento.find((item: any) => item.nome.trim() === "TOTAL VENDAS")?.media ?? 0,
                getMeta: (d: any) => d.faturamento.find((item: any) => item.nome.trim() === "TOTAL VENDAS")?.media_sist ?? 0,
                tipoFormula: 'maiorMelhor'
            },
            {
                subject: 'Custos',
                getValor: (d: any) => d.custos_operacionais_percentual.find((item: any) => item.nome.trim() === "COMERCIAIS")?.media ?? 0,
                getMeta: (d: any) => d.custos_operacionais_percentual.find((item: any) => item.nome.trim() === "COMERCIAIS")?.media_sist ?? 0,
                tipoFormula: 'menorMelhor'
            },
            {
                subject: 'Crescimento',
                getValor: (d: any) => {
                    const vendasIniciais = d.faturamento.find((item: any) => item.nome.trim() === "TOTAL VENDAS")?.saldo_jan_2025 ?? 0;
                    const vendasFinais = d.faturamento.find((item: any) => item.nome.trim() === "TOTAL VENDAS")?.saldo_ago_2025 ?? 0;
                    return vendasIniciais > 0 ? ((vendasFinais - vendasIniciais) / vendasIniciais) * 100 : 0;
                },
                getMeta: () => 10,
                tipoFormula: 'maiorMelhor'
            },
            {
                subject: 'Eficiência',
                getValor: (d: any) => d.evolucao_resultados_percentual.find((item: any) => item.nome.trim() === "RESULTADO OPERACIONAL")?.media ?? 0,
                getMeta: (d: any) => d.evolucao_resultados_percentual.find((item: any) => item.nome.trim() === "RESULTADO OPERACIONAL")?.media_sist,
                tipoFormula: 'maiorMelhor'
            }
        ];

        const rawValues: { [key: string]: number } = {};
        const metas: { [key: string]: number } = {};
        const chartData = [];

        for (const config of radarChartConfig) {
            const valorRealizado = config.getValor(filteredData);
            const valorMeta = config.getMeta(filteredData);

            rawValues[config.subject] = valorRealizado;

            let pontuacao = 0;

            if (valorMeta !== null && valorMeta !== undefined) {
                metas[config.subject] = valorMeta;
                pontuacao = calcularPontuacao(valorRealizado, valorMeta, config.tipoFormula);
            }

            chartData.push({
                subject: config.subject,
                pontuacao: pontuacao,
                meta: valorMeta,
                fullMark: PONTUACAO_MAXIMA,
                details: { rawValues, metas }
            });
        }

        return chartData;
    }, [filteredData]);


    const tooltipValueFormatter = (value: ValueType, name: NameType) => {
        if (typeof value !== 'number') {
            return value;
        }

        switch (name) {
            case 'Faturamento':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(value);
            default:
                return value.toLocaleString('pt-BR');
        }
    };

    return (
        <PageTransition>
            <div className="w-full mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* <Cards
                        title="Margem de Lucro Atual"
                        value={margemLucroData.valor}
                        meta={margemLucroData.meta}
                        Icon={Percent}
                        suffix='%'
                        showProgress={true}
                        colors={{
                            card: "p-4 bg-[#d8f1e0] dark:bg-gradient-to-br from-[#004216] to-[#186431]",
                            text: "text-sm text-green-700 dark:text-green-300",
                            icon: "text-green-500",
                            shadowHoverClass: "dark:hover:shadow-green-500/50",
                            progressColor: "success"
                        }}
                    />

                    <Cards
                        title="Ticket Médio"
                        value={ticketMedioData.valor}
                        meta={ticketMedioData.meta}
                        isPositive={ticketMedioData.isPositive}
                        Icon={ShoppingCart}
                        showProgress={true}
                        prefix='R$ '
                        colors={{
                            card: "p-4 bg-[#e0e5fa] dark:bg-gradient-to-br from-[#01026e] to-[#4344aa] transition-all",
                            text: "text-sm text-blue-700 dark:text-blue-300",
                            icon: "text-blue-500",
                            shadowHoverClass: "dark:hover:shadow-blue-500/50",
                            progressColor: "primary"
                        }}
                    />

                    <Cards
                        title="Faturamento Médio Diário"
                        value={faturamentoMedioDiarioData.valor}
                        meta={faturamentoMedioDiarioData.meta}
                        isPositive={faturamentoMedioDiarioData.isPositive}
                        Icon={DollarSign}
                        showProgress={true}
                        prefix=' R$'
                        colors={{
                            card: "p-4 bg-[#f7e8fd] dark:bg-gradient-to-br from-[#3d016e] to-[#7343aa] transition-all",
                            text: "text-sm text-purple-700 dark:text-purple-300",
                            icon: "text-purple-500",
                            shadowHoverClass: "dark:hover:shadow-purple-500/50",
                            progressColor: 'bg-purple-500'
                        }}
                    />

                    <Cards
                        title="Custos Comerciais"
                        value={custosComerciaisData.valor}
                        meta={custosComerciaisData.meta}
                        isPositive={custosComerciaisData.isPositive}
                        Icon={BarChartHorizontal}
                        showProgress={true}
                        suffix='%'
                        colors={{
                            card: "p-4 bg-[#ffeee0] dark:bg-gradient-to-br from-[#612c00] to-[#8d4e1b] transition-all",
                            text: "text-sm text-orange-700 dark:text-orange-300",
                            icon: "text-orange-500",
                            shadowHoverClass: "dark:hover:shadow-orange-500/50",
                            progressColor: 'bg-orange-500'
                        }}
                    /> */}

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
                                <p className="text-sm text-default-500">Margem de Lucro Atual</p>
                            </div>
                            <div
                                className={"bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"}
                            >
                                <Percent
                                    size={20}
                                    className={"text-success"}
                                />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker className={"text-2xl font-bold text-black dark:text-white"}
                                value={margemLucroData.valor}
                                decimalPlaces={2}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">%</span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className='flex'>
                                {margemLucroData.isPositive ? <TrendingUp size={14} className={margemLucroData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />
                                    : <TrendingDown size={14} className={margemLucroData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />}
                                <p className={margemLucroData.isPositive ? `text-success` : `text-danger`}>{margemLucroData.dif.toFixed(2)}%</p>
                            </div>
                            <div className=''>
                                <p className='text-success'>Meta: 35%</p>
                            </div>
                        </div>
                        <Progress
                            aria-label="Variação de margem"
                            size="sm"
                            value={(margemLucroData.valor / margemLucroData.meta) * 100}
                            className="mt-4"
                            color={margemLucroData.isPositive ? "success" : "danger"}
                        />
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
                                <p className="text-sm text-default-500">Ticket Médio</p>
                            </div>
                            <div
                                className={"bg-primary-100 dark:bg-primary-500/20 p-2 rounded-lg"}
                            >
                                <ShoppingCart
                                    size={20}
                                    className={"text-blue-500"}
                                />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <span className="text-2xl font-bold text-black dark:text-white">R$</span>
                            <NumberTicker className={"text-2xl font-bold text-black dark:text-white"}
                                value={ticketMedioData.valor}
                                decimalPlaces={2}
                            />
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className='flex'>
                                {ticketMedioData.isPositive ? <TrendingUp size={14} className={ticketMedioData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />
                                    : <TrendingDown size={14} className={margemLucroData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />}
                                <p className={ticketMedioData.isPositive ? `text-success` : `text-danger`}>{ticketMedioData.dif.toFixed(2)}%</p>
                            </div>
                            <div className=''>
                                <p className='text-success'>Meta: 5.000</p>
                            </div>
                        </div>
                        <Progress
                            aria-label="Variação de margem"
                            size="sm"
                            value={(ticketMedioData.valor / ticketMedioData.meta) * 100}
                            className="mt-4"
                            color={ticketMedioData.isPositive ? "primary" : "danger"}
                        />
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
                                <p className="text-sm text-default-500">Faturamento Médio Diário</p>
                            </div>
                            <div
                                className={"bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg"}
                            >
                                <DollarSign
                                    size={20}
                                    className={"text-purple-500"}
                                />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <span className="text-2xl font-bold text-black dark:text-white">R$</span>
                            <NumberTicker className={"text-2xl font-bold text-black dark:text-white"}
                                value={faturamentoMedioDiarioData.valor}
                                decimalPlaces={2}
                            />
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className='flex'>
                                {faturamentoMedioDiarioData.isPositive ? <TrendingUp size={14} className={faturamentoMedioDiarioData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />
                                    : <TrendingDown size={14} className={faturamentoMedioDiarioData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />}
                                <p className={faturamentoMedioDiarioData.isPositive ? `text-success` : `text-danger`}>{faturamentoMedioDiarioData.dif.toFixed(2)}%</p>
                            </div>
                            <div className=''>
                                <p className='text-success'>Meta: 50.000</p>
                            </div>
                        </div>
                        <Progress
                            aria-label="Variação de margem"
                            size="sm"
                            value={(faturamentoMedioDiarioData.valor / faturamentoMedioDiarioData.meta) * 100}
                            className="mt-4"
                            color={faturamentoMedioDiarioData.isPositive ? "secondary" : "danger"}
                        />
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
                                <p className="text-sm text-default-500">Custos Comerciais (Comissão e custos de Networking)</p>
                            </div>
                            <div
                                className={"bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg"}
                            >
                                <BarChartHorizontal
                                    size={20}
                                    className={"text-orange-500"}
                                />
                            </div>
                        </div>
                        <div className="flex items-end mt-4">
                            <NumberTicker
                                className={"text-2xl font-bold text-black dark:text-white"}
                                value={custosComerciaisData.valor}
                                decimalPlaces={2}
                            />
                            <span className="text-2xl font-bold text-black dark:text-white">%</span>
                        </div>

                        <div className={`text-xs flex mt-1 justify-between`}>
                            <div className='flex'>
                                {custosComerciaisData.isPositive ? <TrendingUp size={14} className={custosComerciaisData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />
                                    : <TrendingDown size={14} className={custosComerciaisData.isPositive ? `text-success mr-1` : `text-danger mr-1`} />}
                                <p className={custosComerciaisData.isPositive ? `text-success` : `text-danger`}>{custosComerciaisData.dif.toFixed(2)}%</p>
                            </div>
                            <div className=''>
                                <p className='text-success'>Meta: 15.00%</p>
                            </div>
                        </div>
                        <Progress
                            aria-label="Variação de margem"
                            size="sm"
                            value={(custosComerciaisData.valor / custosComerciaisData.meta) * 100}
                            className="mt-4"
                            color={custosComerciaisData.isPositive ? "warning" : "danger"}
                        />
                    </Card>

                </div>

                {/* Gráficos: */}
                {/* Gráfico de linhas */}

                {/* Grafico de ticket médio */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Evolução dos Indicadores</h3>
                        <p className="text-xs text-gray-500 mb-4">Evolução do ticket médio e cupons emitidos</p>
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={evolutionChartData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="#888888" className='text-xs'/>

                                <YAxis
                                    yAxisId="right"
                                    stroke="#3b82f6"
                                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                                />

                                <YAxis
                                    yAxisId="left"
                                    orientation="right"
                                    stroke="#3b82f6"
                                    tickFormatter={(value) => `R$${value}`}
                                />

                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                                />
                                <Legend />


                                <Line yAxisId="right" type="monotone" dataKey="Ticket Médio" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={evolutionChartData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="#888888" className='text-xs'/>

                                <YAxis
                                    yAxisId="left"
                                    stroke="#198754"
                                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                                />

                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#3b82f6"
                                    tickFormatter={(value) => `R$${value}`}
                                />

                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                                />
                                <Legend />

                                <Line yAxisId="left" type="monotone" dataKey="Emissão de Cupons" stroke="#198754" strokeWidth={2} activeDot={{ r: 8 }} />

                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Gráfico de Radar */}
                    <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Radar de Performance</h3>
                        <p className="text-xs text-gray-500 mb-4">Visão geral do progresso em relação às metas</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                                <PolarGrid strokeOpacity={0.3} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0a0', fontSize: 12 }} />

                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, PONTUACAO_MAXIMA]}
                                    tickCount={7}
                                    tick={{ fontSize: 10, fill: '#a0a0a0' }}
                                />

                                <Radar name='Meta' dataKey="meta" stroke="#dc3545" fill="#dc3545" fillOpacity={0.2} strokeWidth={1.5} />
                                <Radar name="Performance" dataKey="pontuacao" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} strokeWidth={2} />

                                <Tooltip content={<CustomTooltip valueFormatter={tooltipValueFormatter} />} />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
                <div className='pb-4'>
                    <PerformanceSummary />
                </div>
            </div>
        </PageTransition>
    );
}
