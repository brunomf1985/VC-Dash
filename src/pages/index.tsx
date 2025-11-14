import { useMemo } from "react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card } from "@heroui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, } from "recharts";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useWatchTheme } from "@/hooks/WatchTheme";
import { Progress } from "@heroui/progress";
import { CircleAlert, TrendingUp, TrendingDown } from "lucide-react";
import { PageTransition } from "@/components/PageTransiotion";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { RegistroFinanceiro } from "./types";
import { useFilter } from "@/hooks/useFilter";
import { 
  calculateGrowthPercentage
} from "@/lib/dataHelpers";
import { 
  SafeMetricCard 
} from "@/components/DataFallbacks";
import { 
  extractEssentialDashboardData,
  validateSections,
  validateVariationCards,
  EssentialDashboardData
} from "@/lib/essentialDataExtractor";

const expenseColors = ["#22c55e", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#d946ef", "#14b8a6",];

export default function Index() {
  const { isDarkMode } = useWatchTheme();
  const { filteredData, hasData, isLoadingApi, apiError } = useFilter();



  // Extrair apenas os dados essenciais que realmente usamos
  const essentialData = useMemo(() => {
    if (!filteredData) {
      return {
        receitaTotal: filteredData.faturamento[0].saldo_total,
        despesas: 0,
        lucroOperacional: 0,
        margem: 0,
        evolutionData: {},
        donutData: [],
        variationData: {}
      } as EssentialDashboardData;
    }
    
    return extractEssentialDashboardData(filteredData);
  }, [filteredData]);

  // Validar quais seções devem ser exibidas
  const sectionValidation = useMemo(() => {
    const validation = validateSections(essentialData);
    return validation;
  }, [essentialData]);

  // Validar cards de variação individuais
  const variationCardValidation = useMemo(() => {
    const validation = validateVariationCards(essentialData);
    return validation;
  }, [essentialData]);

  // Extrair valores para facilitar uso
  const { receitaTotal, despesas, lucroOperacional, margem } = essentialData;

  // const evolutionChartData = useMemo(() => {
  //   const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  //   const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  //   const entradas: MonthlyRecord | undefined = filteredData.recebimentos.find(
  //     (d: any) => d.nome === "TOTAL RECEBIMENTOS"
  //   );
  //   const custosVariaveis: MonthlyRecord | undefined =
  //     filteredData.evolucao_resultados_valor.find(
  //       (d: any) => d.nome === "CUSTOS VARIÁVEIS"
  //     );
  //   const custosFixos: MonthlyRecord | undefined =
  //     filteredData.evolucao_resultados_valor.find(
  //       (d: any) => d.nome === "CUSTOS FIXOS OPERACIONAIS"
  //     );
  //   const resultado: MonthlyRecord | undefined =
  //     filteredData.evolucao_resultados_valor.find(
  //       (d: any) => d.nome === "RESULTADO OPERACIONAL"
  //     );

  //   if (!entradas || !custosVariaveis || !custosFixos || !resultado) return [];

  //   return months.map((month, index) => {
  //     const key = `saldo_${month}_2025` as keyof MonthlyRecord;
  //     const saidas =
  //       Number(custosVariaveis[key] || 0) + Number(custosFixos[key] || 0);
  //     return {
  //       month: monthLabels[index],
  //       entradas: entradas[key] ? Number(entradas[key]) : 0,
  //       saidas: saidas,
  //       resultado: resultado[key] ? Number(resultado[key]) : 0,
  //     };
  //   });
  // }, []);

  const evolutionChartData = useMemo(() => {
    // Usar dados essenciais já extraídos
    const { entradas, custosVariaveis, custosFixos, resultado } = essentialData.evolutionData;

    if (!entradas || !resultado) {
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
      const recebimentosTotais = Number((entradas as any)[chaveDoMes] || 0);

      const saidas = Number((custosVariaveis as any)[chaveDoMes] || 0) + Number((custosFixos as any)[chaveDoMes] || 0);

      const resultadototal = Number((resultado as any)[chaveDoMes] || 0);

      mesesProcessados.push({
        name: `${mesAbrevCapitalizado} ${ano}`,
        tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
        'entradas': parseFloat(recebimentosTotais.toFixed(2)),
        'saidas': parseFloat(saidas.toFixed(2)),
        'resultado': parseFloat(resultadototal.toFixed(2))
      });
    }

    return mesesProcessados.filter(mes => mes['entradas'] > 0 || mes['saidas'] > 0 || mes['resultado'] !== 0);  

  }, [essentialData]);

  const donutChartData = useMemo(() => {
    // Usar dados essenciais já extraídos do custos_operacionais_percentual
    if (!filteredData?.custos_operacionais_percentual) {
      return [];
    }
    
    const ignoredTypes = ["CUSTO OPERAÇÃO", "CUSTO TOTAL"];

    return (filteredData.custos_operacionais_percentual || [])
      .filter(
        (item: any) =>
          !ignoredTypes.includes(item.nome) &&
          item.saldo_total &&
          item.saldo_total > 0
      )
      .map((item: any) => ({
        name: item.nome.replace(/\/ OPERACIONAIS/g, "").trim(),
        value: parseFloat(item.saldo_total.toFixed(2)),
      }));
  }, [filteredData]);

  const getVariationMetrics = (dataRecord: Record<string, any> | undefined) => {
    if (!dataRecord) {
      return {
        currentValue: 0,
        previousValue: 0,
        periodLabel: "mês anterior"
      };
    }

    // 1. Pega todas as chaves de saldo e as ordena
    // Isso garante que "saldo_abr_2025" venha antes de "saldo_mai_2025"
    const chavesDeSaldo = Object.keys(dataRecord)
      .filter(key => key.startsWith('saldo_') && key !== 'saldo_total')
      .sort(); // Ordena alfabeticamente (ex: saldo_ago_2024, saldo_abr_2025)

    // 2. Se não tiver pelo menos 2 meses, não há como comparar
    if (chavesDeSaldo.length < 2) {
      return {
        currentValue: Number(dataRecord[chavesDeSaldo[0]] || 0), // Retorna o único valor
        previousValue: 0,
        periodLabel: "período anterior"
      };
    }

    // 3. Pega as duas últimas chaves (mês mais recente e o anterior)
    const chaveMesMaisRecente = chavesDeSaldo[chavesDeSaldo.length - 1] as keyof typeof dataRecord;
    const chaveMesAnterior = chavesDeSaldo[chavesDeSaldo.length - 2] as keyof typeof dataRecord;

    // 4. Formata o nome do mês anterior para o texto do card
    //    Formato esperado: saldo_mes_ano (ex: saldo_abr_2025)
    const [_, mes, ano] = chaveMesAnterior.split('_');
    let periodLabel = "mês anterior";
    
    if (mes && ano) {
      // Capitaliza o mês e monta a string (ex: "Abril de 2025")
      periodLabel = `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${ano}`;
    }

    // 5. Pega os valores numéricos
    const currentValue = Number(dataRecord[chaveMesMaisRecente] || 0);
    const previousValue = Number(dataRecord[chaveMesAnterior] || 0);
    
    return { currentValue, previousValue, periodLabel };
  };

  // --- Hooks useMemo Refatorados ---

  const revenueGrowthData = useMemo(() => {
    // Usar dados essenciais já extraídos
    const { totalVendas } = essentialData.variationData;
    
    // Pega os valores dinamicamente
    const { currentValue, previousValue, periodLabel } = getVariationMetrics(totalVendas);
    
    // Calcula a porcentagem
    const growth = calculateGrowthPercentage(currentValue, previousValue);
    
    return {
      percentage: growth.percentage,
      period: periodLabel,
      isPositive: growth.percentage >= 0, // Para receita, maior é melhor
    };
  }, [essentialData]);

  const costVariationData = useMemo(() => {
    // Usar dados essenciais já extraídos  
    const { custoTotal } = essentialData.variationData;
    
    // Pega os valores dinamicamente
    const { currentValue, previousValue, periodLabel } = getVariationMetrics(custoTotal);
    
    // Calcula a porcentagem
    const growth = calculateGrowthPercentage(currentValue, previousValue);
    
    return {
      percentage: growth.percentage,
      period: periodLabel,
      isPositive: growth.percentage <= 0, // Para custos, menor é melhor
    };
  }, [essentialData]);

  const marginVariationData = useMemo(() => {
    // Usar dados essenciais já extraídos
    const { margemContribuicao } = essentialData.variationData;
    
    // Pega os valores dinamicamente
    const { currentValue, previousValue, periodLabel } = getVariationMetrics(margemContribuicao);

    // Calcula a porcentagem
    const growth = calculateGrowthPercentage(currentValue, previousValue);
    
    return {
      percentage: growth.percentage,
      period: periodLabel,
      isPositive: growth.percentage >= 0, // Para margem, maior é melhor
    };
  }, [essentialData]);

  const revenueCard = {
    isPositive: revenueGrowthData.isPositive,
    Icon: revenueGrowthData.isPositive ? TrendingUp : TrendingDown,
    text: revenueGrowthData.isPositive ? "cresceu" : "diminuiu",
    prefix: revenueGrowthData.isPositive ? "+" : "",
  };

  const costCard = {
    isPositive: costVariationData.isPositive,
    Icon: costVariationData.isPositive ? TrendingDown : TrendingUp,
    text: costVariationData.isPositive ? "diminuíram" : "aumentaram",
  };

  const marginCard = {
    isPositive: marginVariationData.isPositive,
    Icon: marginVariationData.isPositive ? TrendingUp : TrendingDown,
    text: marginVariationData.isPositive ? "aumentou" : "diminuiu",
    prefix: marginVariationData.isPositive ? "+" : "",
  };

  const tooltipValueFormatter = (value: ValueType, name: NameType) => {
    const percentNames = donutChartData.map((item: any) => item.name);

    if (typeof value === 'number') {
      if (percentNames.includes(name as string)) {
        return `${value.toFixed(2)}%`;
      }

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }

    return value;
  };






  // Proteção: não renderizar se não há dados ou se há erro da API
  if (isLoadingApi) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando dados...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!hasData || !filteredData) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400">Erro ao carregar dados da API</p>
            {apiError && apiError.includes('Ticket Médio') && (
              <p className="text-yellow-600 text-sm mt-2">
                ⚠️ Alguns dados (Ticket Médio) não estão disponíveis para este cliente
              </p>
            )}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <PageTransition>
        <section className="flex flex-col items-center h-full justify-center gap-4 py-8 md:py-1">
          <div className="w-full text-start">
            <h1 className={title({ size: "sm" })}>Visão Geral</h1>
            <p className="text-default-500">
              Acompanhe os principais indicadores financeiros da sua empresa.
            </p>
          </div>
          <Card
            className="flex flex-row 
            items-center w-full
            px-4 py-2 gap-2 p-4 
            bg-white dark:bg-[#141313] 
            transition-all duration-150 
            shadow-none
            hover:-translate-y-1 hover:shadow-sm
            default: hover:shadow-gray-400 dark:hover:shadow-blue-400"
          >
            <CircleAlert size={16} />
            Dados importados de • Última atualização: 23/09/2025
          </Card>
          {sectionValidation.showMainMetrics && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <SafeMetricCard
                title="Receita Total"
                value={receitaTotal}
                prefix="R$ "
                isLoading={isLoadingApi}
                hasData={hasData}
                fallbackMessage="Dados de receita não disponíveis"
              />
              
              <SafeMetricCard
                title="Despesas"
                value={despesas}
                suffix="%"
                isLoading={isLoadingApi}
                hasData={hasData}
                fallbackMessage="Dados de despesas não disponíveis"
              />
              
              <SafeMetricCard
                title="Lucro Operacional"
                value={lucroOperacional}
                prefix="R$ "
                isLoading={isLoadingApi}
                hasData={hasData}
                fallbackMessage="Dados de lucro não disponíveis"
              />
              
              <SafeMetricCard
                title="Margem"
                value={margem}
                suffix="%"
                isLoading={isLoadingApi}
                hasData={hasData}
                fallbackMessage="Dados de margem não disponíveis"
              />
            </div>
          )}

          {(sectionValidation.showEvolutionChart || sectionValidation.showDonutChart) && (
            <div className={`w-full grid grid-cols-1 gap-2 ${
              sectionValidation.showEvolutionChart && sectionValidation.showDonutChart 
                ? 'lg:grid-cols-3' 
                : 'lg:grid-cols-1'
            }`}>
              {sectionValidation.showEvolutionChart && (
                <div
                  className={`w-full shadow-md p-4 rounded-xl bg-white dark:bg-[#141313] ${
                    sectionValidation.showDonutChart ? 'lg:col-span-2' : 'lg:col-span-1'
                  }`}
                  style={{ height: "400px" }}
                >
              <div className="text-start mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Evolução Financeira
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Entradas, saídas e resultado operacional mensal
                </p>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart
                  data={evolutionChartData}
                  margin={{ top: 10, right: 30, left: 15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorResultado"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorSaidas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#ef4444"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#ef4444"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorEntradas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#22c55e"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#22c55e"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke={isDarkMode ? "#e0e0e0" : "#333"}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDarkMode ? "#e0e0e0" : "#333"}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      value.toLocaleString("pt-BR")
                    }
                  />
                  <Tooltip
                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="entradas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEntradas)"
                    name="Entradas"
                  />
                  <Area
                    type="monotone"
                    dataKey="saidas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSaidas)"
                    name="Saídas"
                  />
                  <Area
                    type="monotone"
                    dataKey="resultado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResultado)"
                    name="Resultado"
                  />
                </AreaChart>
              </ResponsiveContainer>
                </div>
              )}
              
              {sectionValidation.showDonutChart && (
                <div
                  className="lg:col-span-1 w-full rounded-xl shadow-md p-4 flex items-center bg-white dark:bg-[#141313]"
                  style={{ height: "400px" }}
                >
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                    >
                      {donutChartData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            expenseColors[index % expenseColors.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 h-full flex flex-col justify-center gap-4 pl-4">
                {donutChartData.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{
                        backgroundColor:
                          expenseColors[index % expenseColors.length],
                      }}
                    />
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-default-500">
                        {item.value}%
                      </p>
                    </div>
                  </div>
                ))}
                </div>
                </div>
              )}
            </div>
          )}
          {sectionValidation.showVariationCards && (
            <div className={`w-full h-full grid gap-2 ${
              [variationCardValidation.showRevenueCard, variationCardValidation.showCostCard, variationCardValidation.showMarginCard].filter(Boolean).length === 1 
                ? 'grid-cols-1' 
                : [variationCardValidation.showRevenueCard, variationCardValidation.showCostCard, variationCardValidation.showMarginCard].filter(Boolean).length === 2 
                  ? 'md:grid-cols-2' 
                  : 'md:grid-cols-3'
            }`}>
              {variationCardValidation.showRevenueCard && (
                <Card
              className="p-4 bg-white dark:bg-[#141313] 
             transition-all duration-150 
             hover:-translate-y-1 
             hover:shadow-sm
             shadow-none
             default: hover:shadow-gray-400
             dark:hover:shadow-blue-400"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-default-500">Crescimento de Receita</p>
                </div>
                <div
                  className={
                    revenueCard.isPositive
                      ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"
                      : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"
                  }
                >
                  <revenueCard.Icon
                    size={20}
                    className={
                      revenueCard.isPositive ? "text-success-500" : "text-danger-500"
                    }
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <p
                  className={"text-2xl font-bold flex items-center"}
                >
                  {revenueCard.prefix}
                  <NumberTicker value={(revenueGrowthData.percentage)}
                    decimalPlaces={2}
                  />%
                </p>
              </div>
              <Progress
                aria-label="Crescimento de receita"
                size="sm"
                value={Math.abs(revenueGrowthData.percentage)}
                className="mt-4"
                color={revenueCard.isPositive ? "success" : "danger"}
              />
              <p className="text-xs text-default-500 mt-2">
                A receita {revenueCard.text}{" "}
                {Math.abs(revenueGrowthData.percentage)}% em relação a{" "}
                {revenueGrowthData.period}.
              </p>
                </Card>
              )}

              {variationCardValidation.showCostCard && (
                <Card
                  className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
                 dark:hover:shadow-blue-400"
                >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-default-500">Variação de Custos</p>
                </div>
                <div
                  className={
                    costCard.isPositive
                      ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"
                      : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"
                  }
                >
                  <costCard.Icon
                    size={20}
                    className={costCard.isPositive ? "text-success-500" : "text-danger-500"}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <p
                  className={"text-2xl font-bold flex items-center"}
                >
                  <NumberTicker value={(costVariationData.percentage)}
                    decimalPlaces={2}
                  />%
                </p>
              </div>
              <Progress
                aria-label="Variação de custos"
                size="sm"
                value={Math.abs(costVariationData.percentage)}
                className="mt-4"
                color={costCard.isPositive ? "success" : "danger"}
              />
              <p className="text-xs text-default-500 mt-2">
                Os custos {costCard.text}{" "}
                {Math.abs(costVariationData.percentage)}% em relação a{" "}
                {costVariationData.period}.
              </p>
                </Card>
              )}

              {variationCardValidation.showMarginCard && (
                <Card
                  className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
                 dark:hover:shadow-blue-400"
                >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-default-500">Variação de Margem</p>
                </div>
                <div
                  className={
                    marginCard.isPositive
                      ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"
                      : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"
                  }
                >
                  <marginCard.Icon
                    size={20}
                    className={
                      marginCard.isPositive ? "text-success-500" : "text-danger-500"
                    }
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-4">
                <p
                  className={"text-2xl font-bold flex items-center"}
                >
                  {marginCard.prefix}
                  <NumberTicker value={(marginVariationData.percentage)}
                    decimalPlaces={2}
                  />%
                </p>
              </div>
              <Progress
                aria-label="Variação de margem"
                size="sm"
                value={Math.abs(marginVariationData.percentage)}
                className="mt-4"
                color={marginCard.isPositive ? "success" : "danger"}
              />
              <p className="text-xs text-default-500 mt-2">
                A margem {marginCard.text}{" "}
                {Math.abs(marginVariationData.percentage)}% em relação a{" "}
                {marginVariationData.period}.
              </p>
                </Card>
              )}
            </div>
          )}
        </section>
      </PageTransition>
    </DefaultLayout>
  );
}
