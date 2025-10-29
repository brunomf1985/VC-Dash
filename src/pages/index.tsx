import React, { useMemo } from "react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, } from "recharts";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useWatchTheme } from "@/hooks/WatchTheme";
import data from "@/pages/exemplo.json";
import { Progress } from "@heroui/progress";
import { CircleAlert, TrendingUp, TrendingDown } from "lucide-react";
import { PageTransition } from "@/components/PageTransiotion";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { RegistroFinanceiro, MonthlyRecord } from "./types";

const expenseColors = ["#22c55e", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#d946ef", "#14b8a6",];

export default function Index() {
  const { isDarkMode } = useWatchTheme();

  const receitaTotal =
    data.recebimentos.find((item) => item.nome === "TOTAL RECEBIMENTOS")
      ?.saldo_total || 0;
  const despesas =
    data.custos_operacionais_percentual.find(
      (item) => item.nome === "CUSTO TOTAL"
    )?.saldo_total || 0;
  const lucroOperacional =
    data.evolucao_resultados_valor.find(
      (item) => item.nome === "RESULTADO OPERACIONAL"
    )?.saldo_total || 0;
  const margem =
    data.evolucao_resultados_percentual.find(
      (item) => item.nome === "MARGEM DE CONTRIBUIÇÃO"
    )?.saldo_total || 0;

  // const evolutionChartData = useMemo(() => {
  //   const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  //   const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  //   const entradas: MonthlyRecord | undefined = data.recebimentos.find(
  //     (d) => d.nome === "TOTAL RECEBIMENTOS"
  //   );
  //   const custosVariaveis: MonthlyRecord | undefined =
  //     data.evolucao_resultados_valor.find(
  //       (d) => d.nome === "CUSTOS VARIÁVEIS"
  //     );
  //   const custosFixos: MonthlyRecord | undefined =
  //     data.evolucao_resultados_valor.find(
  //       (d) => d.nome === "CUSTOS FIXOS OPERACIONAIS"
  //     );
  //   const resultado: MonthlyRecord | undefined =
  //     data.evolucao_resultados_valor.find(
  //       (d) => d.nome === "RESULTADO OPERACIONAL"
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
    const entradas: MonthlyRecord | undefined = data.recebimentos.find(
      (d) => d.nome === "TOTAL RECEBIMENTOS"
    );
    const custosVariaveis: MonthlyRecord | undefined =
      data.evolucao_resultados_valor.find(
        (d) => d.nome === "CUSTOS VARIÁVEIS"
      );
    const custosFixos: MonthlyRecord | undefined =
      data.evolucao_resultados_valor.find(
        (d) => d.nome === "CUSTOS FIXOS OPERACIONAIS"
      );
    const resultado: MonthlyRecord | undefined =
      data.evolucao_resultados_valor.find(
        (d) => d.nome === "RESULTADO OPERACIONAL"
      );

    if (!custosVariaveis || !custosFixos || !resultado || !entradas) {
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

  }, [data]);

  const donutChartData = useMemo(() => {
    const ignoredTypes = ["CUSTO OPERAÇÃO", "CUSTO TOTAL"];

    return data.custos_operacionais_percentual
      .filter(
        (item) =>
          !ignoredTypes.includes(item.nome) &&
          item.saldo_total &&
          item.saldo_total > 0
      )
      .map((item) => ({
        name: item.nome.replace(/\/ OPERACIONAIS/g, "").trim(),
        value: parseFloat(item.saldo_total.toFixed(2)),
      }));
  }, []);

  const revenueGrowthData = useMemo(() => {
    const totalSales = data.faturamento.find(
      (item) => item.nome.trim() === "TOTAL VENDAS"
    );
    if (!totalSales)
      return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthSales = totalSales.saldo_ago_2025;
    const previousMonthSales = totalSales.saldo_jul_2025;
    if (previousMonthSales === 0)
      return {
        percentage: currentMonthSales > 0 ? 100 : 0,
        period: "Julho de 2025",
        isPositive: true,
      };

    const percentage =
      ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage >= 0,
    };
  }, []);

  const costVariationData = useMemo(() => {
    const totalCosts = data.custos_operacionais_percentual.find(
      (item) => item.nome.trim() === "CUSTO TOTAL"
    );
    if (!totalCosts)
      return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthCosts = totalCosts.saldo_ago_2025;
    const previousMonthCosts = totalCosts.saldo_jul_2025;
    if (previousMonthCosts === 0)
      return {
        percentage: currentMonthCosts > 0 ? 100 : 0,
        period: "Julho de 2025",
        isPositive: false,
      };

    const percentage =
      ((currentMonthCosts - previousMonthCosts) / previousMonthCosts) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage <= 0,
    };
  }, []);

  const marginVariationData = useMemo(() => {
    const totalMargin = data.evolucao_resultados_percentual.find(
      (item) => item.nome.trim() === "MARGEM DE CONTRIBUIÇÃO"
    );
    if (!totalMargin)
      return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthMargin = totalMargin.saldo_ago_2025;
    const previousMonthMargin = totalMargin.saldo_jul_2025;
    if (previousMonthMargin === 0)
      return {
        percentage: currentMonthMargin > 0 ? 100 : 0,
        period: "Julho de 2025",
        isPositive: true,
      };

    const percentage =
      ((currentMonthMargin - previousMonthMargin) / previousMonthMargin) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage >= 0,
    };
  }, []);

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
    const percentNames = donutChartData.map(item => item.name);

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
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Card
              className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
               dark:hover:shadow-blue-400"
            >
              <CardHeader>
                <h4 className="font-bold text-large">Receita Total</h4>
              </CardHeader>
              <CardBody className="flex-row">
                <p className="text-3xl font-bold">R$</p>
                <NumberTicker className="text-3xl font-bold"
                  value={receitaTotal}
                  decimalPlaces={2}
                />
              </CardBody>
            </Card>
            <Card
              className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
               dark:hover:shadow-blue-400"
            >
              <CardHeader>
                <h4 className="font-bold text-large">Despesas</h4>
              </CardHeader>
              <CardBody className="flex-row">
                <NumberTicker className="text-3xl font-bold"
                  value={despesas}
                  decimalPlaces={2}
                />
                <p className="text-3xl font-bold">%</p>
              </CardBody>
            </Card>
            <Card
              className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
               dark:hover:shadow-blue-400"
            >
              <CardHeader>
                <h4 className="font-bold text-large">Lucro Operacional</h4>
              </CardHeader>
              <CardBody className="flex-row">
                <p className="text-3xl font-bold">R$</p>
                <NumberTicker className="text-3xl font-bold"
                  value={lucroOperacional}
                  decimalPlaces={2}
                />
              </CardBody>
            </Card>
            <Card
              className="p-4 bg-white dark:bg-[#141313] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                 hover:shadow-sm
                 shadow-none
                 default: hover:shadow-gray-400
               dark:hover:shadow-blue-400"
            >
              <CardHeader>
                <h4 className="font-bold text-large">Margem</h4>
              </CardHeader>
              <CardBody className="flex-row">
                <NumberTicker className="text-3xl font-bold"
                  value={margem}
                  decimalPlaces={2}
                />
                <p className="text-3xl font-bold">%</p>
              </CardBody>
            </Card>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-2 ">
            <div
              className="lg:col-span-2 w-full shadow-md p-4 rounded-xl bg-white dark:bg-[#141313]"
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
                      {donutChartData.map((_entry, index) => (
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
                {donutChartData.map((item, index) => (
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
          </div>
          <div className="w-full h-full grid md:grid-cols-3 gap-2">
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
          </div>
        </section>
      </PageTransition>
    </DefaultLayout>
  );
}