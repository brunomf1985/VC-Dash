import { useMemo } from "react";
import {
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Area,
    AreaChart
} from "recharts";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { useWatchTheme } from "@/hooks/WatchTheme";

interface AnaliseCompletaCardProps {
    data: any;
}



// --- HOOK: Informações do período filtrado ---
const usePeriodoInfo = (data: any) => {
    return useMemo(() => {
        // Verificar se existe filtro aplicado
        const temFiltro = data.periodo && (
            data.periodo.includes('28/02/2025') || 
            data.periodo.includes('30/05/2025') || 
            data.periodo.includes('30/08/2025') ||
            !data.periodo.startsWith('01.01.2025')
        );

        const periodoNome = data.periodo || 'Período completo';

        return { temFiltro, periodoNome };
    }, [data]);
};

// --- Hook com a lógica da Análise Consolidada do Período ---
const useAnaliseCompleta = (data: any) => {
    return useMemo(() => {
        // Validação inicial de dados necessários
        if (!data || !data.recebimentos || !data.faturamento || !data.custos_operacionais_percentual) {
            console.log('Dados insuficientes para AnaliseCompletaCard:', {
                temRecebimentos: !!data?.recebimentos,
                temFaturamento: !!data?.faturamento,
                temCustosOperacionais: !!data?.custos_operacionais_percentual
            });
            return {
                entradas: [],
                saidas: [],
                resultado: 0,
                chartData: [],
                totalEntradas: 0,
                totalSaidas: 0
            };
        }

        // 1. CALCULAR ENTRADAS CONSOLIDADAS (usar saldo_total dos recebimentos)
        const nomesEntradas = ["CARTÕES", "DINHEIRO", "PIX / TED / DOC", "ANTECIPAÇÃO DE CARTÕES"];
        const entradas = nomesEntradas.map(nome => {
            let itemData;
            
            // Busca específica para cada tipo de entrada
            if (nome === "ANTECIPAÇÃO DE CARTÕES") {
                // Buscar por diferentes variações possíveis do nome
                itemData = data.recebimentos.find((d: any) => {
                    const nomeUpper = d.nome.trim().toUpperCase();
                    return nomeUpper.includes("ANTECIPAÇÃO") || 
                           nomeUpper.includes("ANTECIPACAO") ||
                           nomeUpper.includes("ANTEC") ||
                           (nomeUpper.includes("CARTÃO") && nomeUpper.includes("ANTEC"));
                });
            } else {
                itemData = data.recebimentos.find((d: any) => d.nome.trim().toUpperCase() === nome);
            }
            
            let valor = Number(itemData?.saldo_total || 0);
            
            // Se saldo_total é 0, tentar usar media ou somar campos mensais disponíveis
            if (valor === 0 && itemData) {
                // Primeiro tentar usar a média
                if (itemData.media && itemData.media > 0) {
                    valor = Number(itemData.media);
                } else {
                    // Se não tiver média, somar todos os campos mensais disponíveis
                    const camposMensais = Object.keys(itemData).filter(key => key.startsWith('saldo_') && key.includes('_2025'));
                    valor = camposMensais.reduce((acc, campo) => acc + Number(itemData[campo] || 0), 0);
                }
            }
            
            return { nome: itemData?.nome.trim() || nome, valor };
        });
        const totalEntradas = entradas.reduce((acc, item) => acc + item.valor, 0);

        // 2. CALCULAR SAÍDAS CONSOLIDADAS
        const faturamentoItem = data.faturamento.find((d: any) => d.nome.trim() === "TOTAL VENDAS") as Record<string, any> | undefined;
        const faturamentoTotal = Number(faturamentoItem?.saldo_total || 0);

        // Saídas baseadas em percentual médio aplicado sobre o faturamento total
        const nomesSaidasPct = ["PESSOAL", "ADMINISTRATIVAS / OPERACIONAIS", "IMPOSTOS", "FINANCEIRAS", "TAXAS DIVERSAS"];
        const saidasPct = nomesSaidasPct.map(nome => {
            const itemData = data.custos_operacionais_percentual.find((d: any) => d.nome.trim().toUpperCase().startsWith(nome)) as Record<string, any> | undefined;
            const percent = Number(itemData?.media || 0); // Usar média do período
            const valor = (faturamentoTotal * percent) / 100;
            return { nome: itemData?.nome.trim() || nome, valor };
        });

        // "Despesas Comerciais" vem do total consolidado
        let despesaComercialValor = 0;
        if (data.comparativo_cmv_vs_comerciais) {
            const despesaComercialItem = data.comparativo_cmv_vs_comerciais.find((d: any) => d.nome.trim() === "COMERCIAIS") as Record<string, any> | undefined;
            despesaComercialValor = Number(despesaComercialItem?.saldo_total || 0);
        } else {
            console.log('Campo comparativo_cmv_vs_comerciais não disponível para este cliente');
        }

        const saidas = [
            ...saidasPct.filter(s => s.nome.startsWith("PESSOAL")),
            { nome: "Despesas Comerciais", valor: despesaComercialValor },
            ...saidasPct.filter(s => !s.nome.startsWith("PESSOAL")),
        ];
        const totalSaidas = saidas.reduce((acc, item) => acc + item.valor, 0);

        // 3. RESULTADO CONSOLIDADO
        const resultado = totalEntradas - totalSaidas;

        // 4. DADOS DO GRÁFICO (Waterfall consolidado)
        const chartData: Array<{
            nome: string;
            Valor: number;
            tipo: string;
            valorMovimento: number;
            nomeCompleto: string;
        }> = [];
        let acumulado = 0;

        // Adiciona Entradas (construindo o valor)
        for (const entrada of entradas) {
            if (entrada.valor > 0) { // Só incluir se tiver valor
                acumulado += entrada.valor;
                chartData.push({
                    nome: entrada.nome,
                    Valor: acumulado,
                    tipo: 'entrada',
                    valorMovimento: entrada.valor,
                    nomeCompleto: entrada.nome
                });
            }
        }

        // Adiciona Saídas (reduzindo o valor)
        for (const saida of saidas) {
            if (saida.valor > 0) { // Só incluir se tiver valor
                acumulado -= saida.valor;
                chartData.push({
                    nome: saida.nome.split('/')[0].trim(),
                    Valor: acumulado,
                    tipo: 'saida',
                    valorMovimento: saida.valor,
                    nomeCompleto: saida.nome
                });
            }
        }

        return { entradas, saidas, totalEntradas, totalSaidas, resultado, chartData };

    }, [data]);
};

// --- Componente da Linha do DRE ---
const DreRow = ({ label, value, isNegative = false, isTotal = false, isSubtle = false }:
    { label: string, value: number, isNegative?: boolean, isTotal?: boolean, isSubtle?: boolean }) => (
    <div className={`flex justify-between items-center py-1 ${isSubtle ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
        <span className={`text-sm ${isTotal ? 'font-bold' : ''}`}>
            {isNegative ? '(-)' : ''} {label}
        </span>
        <span className={`font-medium text-sm ${isTotal ? 'font-bold' : ''} ${isNegative ? 'text-red-600 dark:text-red-500' : ''}`}>
            R$ <NumberTicker value={Math.abs(value)} />
        </span>
    </div>
);

// --- Componente Principal do Card ---
export function AnaliseCompletaCard({ data }: AnaliseCompletaCardProps) {
    const { isDarkMode } = useWatchTheme();
    
    // Validação de dados antes de executar os hooks
    if (!data || !data.recebimentos || !data.faturamento || !data.custos_operacionais_percentual) {
        return (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-[#141313] rounded-xl shadow-md p-4">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Dados insuficientes para análise completa</p>
                    <p className="text-sm text-gray-400">Alguns dados necessários não estão disponíveis para este cliente</p>
                </div>
            </div>
        );
    }
    
    const { temFiltro, periodoNome } = usePeriodoInfo(data);
    const { entradas, saidas, totalEntradas, totalSaidas, resultado, chartData } = useAnaliseCompleta(data);

    // Tooltip customizado para o gráfico
    const CustomChartTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const isEntrada = data.tipo === 'entrada';
        const tipoLabel = isEntrada ? 'Entrada Operacional' : 'Saída Operacional';
        const valorMovimento = data.valorMovimento || 0;

        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
                    {data.nomeCompleto}
                </p>
                <p className={`text-xs mb-1 ${isEntrada ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {tipoLabel}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Valor: R$ <NumberTicker value={Math.abs(valorMovimento)} />
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Acumulado: R$ <NumberTicker value={Math.abs(data.Valor)} />
                </p>
            </div>
        );
    };

    return (
        <Card className="p-4 bg-white dark:bg-[#141313]">
            <CardHeader className="p-0 flex flex-col gap-1 items-start">
                <h2 className="text-lg font-semibold">Análise Completa</h2>
                <p className="text-sm text-gray-500">
                    {periodoNome} - Dados consolidados do período {temFiltro ? 'filtrado' : 'completo'}
                </p>
            </CardHeader>
            <CardBody className="p-0 mt-4">

                {/* Seção de Entradas e Saídas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Coluna da Esquerda: Entradas */}
                    <div>
                        <h3 className="font-semibold text-green-600 dark:text-green-500">Entradas Operacionais - Período</h3>
                        <div className="mt-2 flex flex-col gap-1">
                            {entradas.map(item => (
                                <DreRow key={item.nome} label={item.nome} value={item.valor} isSubtle />
                            ))}
                        </div>
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        <DreRow label="Total Entradas Operacionais" value={totalEntradas} isTotal />
                    </div>

                    {/* Coluna da Direita: Saídas */}
                    <div>
                        <h3 className="font-semibold text-red-600 dark:text-red-500">Saídas Operacionais - Período</h3>
                        <div className="mt-2 flex flex-col gap-1">
                            {saidas.map(item => (
                                <DreRow key={item.nome} label={item.nome} value={item.valor} isSubtle />
                            ))}
                        </div>
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        <DreRow label="Total Saídas Operacionais" value={totalSaidas} isTotal isNegative />

                        {/* Resultado Final */}
                    <div className="mt-4 p-2">
                        <DreRow label="Resultado Operacional" value={resultado} isTotal />
                    </div>
                    </div>
                </div>

                {/* Seção do Gráfico */}
                <div className="mt-6" style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                            />
                            <XAxis
                                dataKey="nome"
                                stroke={isDarkMode ? "#e0e0e0" : "#333"}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                style={{ fontSize: '10px' }}
                                height={80}
                            />
                            <YAxis
                                stroke={isDarkMode ? "#e0e0e0" : "#333"}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`}
                            />
                            <Tooltip
                                content={<CustomChartTooltip />}
                            />
                            <Area
                                type="monotone"
                                dataKey="Valor"
                                stroke="#3b82f6"
                                fill="url(#colorValor)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

            </CardBody>
        </Card>
    );
}