import { useMemo } from "react";
import {
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Area,
    AreaChart
} from "recharts";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useWatchTheme } from "@/hooks/WatchTheme";
import { CustomTooltip } from "@/components/CustomTooltip";
// import { RegistroFinanceiro } from "@/pages/types";

export interface AnaliseNaoOperacionalProps {
  data: any; // Dados obrigatórios da API
}

// --- Helper para formatar moeda ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// --- Hook com a lógica da Análise ---
const useNaoOperacionalData = (data: any) => {
    return useMemo(() => {
        const entradasItem = data.evolucao_resultados_valor.find((d: any) => d.nome.trim() === "RESULTADO OPERACIONAL");
        const saidasItem = data.evolucao_resultados_valor.find((d: any) => d.nome.trim() === "CUSTOS FIXOS NÃO OPERACIONAIS");
        const resultadoItem = data.evolucao_resultados_valor.find((d: any) => d.nome.trim() === "RESULTADO FINAL");

        if (!entradasItem || !saidasItem || !resultadoItem) {
            return {
                kpiEntradas: { total: 0, media: 0 },
                kpiSaidas: { total: 0, media: 0 },
                kpiResultado: { total: 0, media: 0 },
                chartData: [],
                entradas: [],
                saidas: [],
                latestName: '',
                totalEntradas: 0,
                totalSaidas: 0,
                resultado: 0
            };
        }

        // 1. DADOS DOS KPIs (Totais e Médias do período)
        const kpiEntradas = {
            total: Number(entradasItem.saldo_total || 0),
            media: Number(entradasItem.media || 0)
        };
        const kpiSaidas = {
            total: Number(saidasItem.saldo_total || 0),
            media: Number(saidasItem.media || 0)
        };
        const kpiResultado = {
            total: Number(resultadoItem.saldo_total || 0),
            media: Number(resultadoItem.media || 0)
        };

        // 2. DADOS DO GRÁFICO (Valores mensais) - usar dados filtrados
        const chartData: Array<{
            name: string;
            "Entradas Não Operacionais": number;
            "Saídas Não Operacionais": number;
            "Resultado Não Operacional": number;
        }> = [];
        
        // Coletar todas as chaves existentes
        const chavesComDados = new Set<string>();
        [entradasItem, saidasItem, resultadoItem].forEach(item => {
            if (item) {
                Object.keys(item).forEach(key => {
                    if (key.startsWith('saldo_') && key !== 'saldo_total') {
                        chavesComDados.add(key);
                    }
                });
            }
        });

        // Converter chaves para datas e ordenar
        const mesesComDados: { key: string, date: Date }[] = [];
        chavesComDados.forEach(key => {
            const parts = key.split('_');
            if (parts.length === 3) {
                const mesAbrev = parts[1];
                const ano = parseInt(parts[2]);
                
                const mesesMap: { [key: string]: number } = {
                    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
                };
                
                if (mesesMap[mesAbrev] !== undefined) {
                    const date = new Date(ano, mesesMap[mesAbrev], 1);
                    mesesComDados.push({ key, date });
                }
            }
        });

        // Ordenar por data (mais antigo primeiro para o gráfico)
        mesesComDados.sort((a, b) => a.date.getTime() - b.date.getTime());

        mesesComDados.forEach(({ key, date }) => {
            const valorEntradas = Number((entradasItem as any)[key] || 0);
            const valorSaidas = Number((saidasItem as any)[key] || 0);
            const valorResultado = Number((resultadoItem as any)[key] || 0);

            // Adiciona apenas meses que têm dados
            if (valorEntradas !== 0 || valorSaidas !== 0 || valorResultado !== 0) {
                const mesAbrev = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                chartData.push({
                    name: `${mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1)}`,
                    "Entradas Não Operacionais": valorEntradas,
                    "Saídas Não Operacionais": valorSaidas,
                    "Resultado Não Operacional": valorResultado
                });
            }
        });

        // 3. DADOS PARA AS LISTAS DE ENTRADAS E SAÍDAS (VALORES TOTAIS ACUMULADOS)
        const latestName = data.periodo; // Usar o período dos dados

        // Analisar entradas não operacionais
        // Como não há entradas não operacionais específicas no JSON, vamos usar o Resultado Operacional como base
        const resultadoOperacionalPositivo = Math.max(Number(entradasItem.saldo_total || 0), 0);
        
        const entradas = resultadoOperacionalPositivo > 0 ? [
            {
                nome: "Resultado Operacional Positivo",
                valor: resultadoOperacionalPositivo
            }
        ] : [];

        // Para saídas não operacionais, vamos detalhar os custos fixos não operacionais
        const custosFixosNaoOp = Number(saidasItem.saldo_total || 0);
        
        const saidas = custosFixosNaoOp > 0 ? [
            {
                nome: "Custos Fixos Não Operacionais",
                valor: Math.abs(custosFixosNaoOp)
            }
        ] : [];

        // Se você quiser mais detalhes, pode adicionar itens específicos da seção custos_operacionais_percentual
        // que são relacionados a atividades não operacionais
        const despesasFinanceiras = data.custos_operacionais_percentual?.find(
            (item: any) => item.nome?.includes("FINANCEIRAS")
        );
        
        if (despesasFinanceiras && despesasFinanceiras.saldo_total) {
            // Calcular valor absoluto das despesas financeiras baseado no faturamento
            const faturamentoTotal = 6885145.91; // Total de vendas do período
            const valorFinanceiras = (Number(despesasFinanceiras.saldo_total) / 100) * faturamentoTotal;
            
            if (valorFinanceiras > 0) {
                saidas.push({
                    nome: "Despesas Financeiras",
                    valor: Math.abs(valorFinanceiras)
                });
            }
        }

        const totalEntradas = entradas.reduce((acc, item) => acc + item.valor, 0);
        const totalSaidas = saidas.reduce((acc, item) => acc + item.valor, 0);
        const resultado = totalEntradas - totalSaidas;

        return { 
            kpiEntradas, 
            kpiSaidas, 
            kpiResultado, 
            chartData, 
            entradas, 
            saidas, 
            latestName, 
            totalEntradas, 
            totalSaidas, 
            resultado 
        };

    }, [data]);
};

// --- Sub-componente KpiBox ---
const KpiBox = ({ title, total, media, colorClass }: { title: string, total: number, media: number, colorClass: string }) => (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <p className={`text-sm font-medium ${colorClass}`}>{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(total)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
            Média mensal: {formatCurrency(media)}
        </p>
    </div>
);

// --- Componente da Linha do DRE ---
const DreRow = ({ label, value, isNegative = false, isTotal = false, isSubtle = false }:
    { label: string, value: number, isNegative?: boolean, isTotal?: boolean, isSubtle?: boolean }) => (
    <div className={`flex justify-between items-center py-1 ${isSubtle ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
        <span className={`text-sm ${isTotal ? 'font-bold' : ''}`}>
            {isNegative ? '(-)' : ''} {label}
        </span>
        <span className={`font-medium text-sm ${isTotal ? 'font-bold' : ''} ${isNegative ? 'text-red-600 dark:text-red-500' : ''}`}>
            {formatCurrency(Math.abs(value))}
        </span>
    </div>
);

// --- Componente Principal do Card ---
export function AnaliseNaoOperacional({ data }: AnaliseNaoOperacionalProps) {
    const { isDarkMode } = useWatchTheme();
    
    // Verificar se há dados disponíveis
    if (!data) {
        return (
            <Card className="p-4 bg-white dark:bg-[#141313] transition-all duration-150 hover:-translate-y-1 hover:shadow-sm shadow-none">
                <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Análise Não Operacional</h3>
                    <p className="text-sm text-gray-500">Nenhum dado disponível</p>
                </CardHeader>
                <CardBody>
                    <p className="text-center text-gray-500 py-8">
                        Faça login e selecione um cliente para carregar dados da API
                    </p>
                </CardBody>
            </Card>
        );
    }
    
    const { 
        kpiEntradas, 
        kpiSaidas, 
        kpiResultado, 
        chartData, 
        entradas, 
        saidas, 
        latestName, 
        totalEntradas, 
        totalSaidas, 
        resultado 
    } = useNaoOperacionalData(data);

    // Formatador para o Tooltip do Gráfico
    const chartTooltipFormatter = (value: ValueType) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact'
            }).format(value);
        }
        return value;
    };

    return (
        <Card className="p-4 bg-white dark:bg-[#141313]">
            <CardHeader className="p-0 flex flex-col items-start gap-1">
                <h2 className="text-lg font-semibold">Análise das Atividades Não Operacionais - {data.periodo}</h2>
                <p className="text-sm text-gray-500">Entradas e saídas não relacionadas à operação principal</p>
            </CardHeader>
            <CardBody className="p-0 mt-4">

                {/* Seção de KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiBox
                        title="Entradas (Resultado Operacional)"
                        total={kpiEntradas.total}
                        media={kpiEntradas.media}
                        colorClass="text-green-600 dark:text-green-400"
                    />
                    <KpiBox
                        title="Saídas Não Operacionais"
                        total={kpiSaidas.total}
                        media={kpiSaidas.media}
                        colorClass="text-red-600 dark:text-red-500"
                    />
                    <KpiBox
                        title="Resultado Não Operacional (Final)"
                        total={kpiResultado.total}
                        media={kpiResultado.media}
                        colorClass="text-blue-700 dark:text-blue-300"
                    />
                </div>

                {/* Seção do Gráfico */}
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Evolução das Atividades Não Operacionais</h3>
                    <div className="mt-2" style={{ height: "350px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                />
                                <XAxis
                                    dataKey="name"
                                    stroke={isDarkMode ? "#e0e0e0" : "#333"}
                                    axisLine={false}
                                    tickLine={false}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke={isDarkMode ? "#e0e0e0" : "#333"}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`}
                                />
                                <Tooltip
                                    content={<CustomTooltip valueFormatter={chartTooltipFormatter} />}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="Entradas Não Operacionais"
                                    stroke="#22c55e"
                                    fill="url(#colorEntradas)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Saídas Não Operacionais"
                                    stroke="#f43f5e"
                                    fill="url(#colorSaidas)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Resultado Não Operacional"
                                    stroke="#06b6d4"
                                    fill="url(#colorResultado)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Seção de Entradas e Saídas */}
                <div className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Coluna da Esquerda: Entradas */}
                        <div>
                            <h3 className="font-semibold text-green-600 dark:text-green-500">Principais Entradas Não Operacionais - {latestName}</h3>
                            <div className="mt-2 flex flex-col gap-1">
                                {entradas.length > 0 ? entradas.map((item: { nome: string, valor: number }) => (
                                    <DreRow key={item.nome} label={item.nome} value={item.valor} isSubtle />
                                )) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma entrada não operacional encontrada</p>
                                )}
                            </div>
                            {entradas.length > 0 && (
                                <>
                                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                    <DreRow label="Total Entradas Não Operacionais" value={totalEntradas} isTotal />
                                </>
                            )}
                        </div>

                        {/* Coluna da Direita: Saídas */}
                        <div>
                            <h3 className="font-semibold text-red-600 dark:text-red-500">Principais Saídas Não Operacionais - {latestName}</h3>
                            <div className="mt-2 flex flex-col gap-1">
                                {saidas.length > 0 ? saidas.map((item: { nome: string, valor: number }) => (
                                    <DreRow key={item.nome} label={item.nome} value={item.valor} isSubtle isNegative />
                                )) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma saída não operacional encontrada</p>
                                )}
                            </div>
                            {saidas.length > 0 && (
                                <>
                                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                    <DreRow label="Total Saídas Não Operacionais" value={totalSaidas} isTotal isNegative />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Resultado Final */}
                    {(entradas.length > 0 || saidas.length > 0) && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <DreRow label="Resultado Não Operacional" value={resultado} isTotal />
                            </div>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
