import React, { useMemo, useState, useEffect } from "react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions, AgDonutSeriesOptions } from 'ag-charts-community';
import { useWatchTheme } from "@/hooks/WatchTheme";
import data from '@/pages/exemplo.json';
import { MonthlyRecord } from "@/pages/types";
import { Progress } from "@heroui/progress";
import { CircleAlert, TrendingUp, TrendingDown } from "lucide-react";
import { PageTransition } from "@/components/PageTransiotion";

const expenseColors = ['#22c55e', '#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#d946ef', '#14b8a6'];

const lightTheme: AgChartOptions['theme'] = {
  baseTheme: 'ag-default',
  palette: {
    fills: expenseColors,
    strokes: expenseColors,
  },
};
const darkTheme: AgChartOptions['theme'] = {
  baseTheme: 'ag-default-dark',
  palette: {
    fills: expenseColors,
    strokes: expenseColors,
  },
};


export default function Index() {
  const { isDarkMode } = useWatchTheme();

  const receitaTotal = data.recebimentos.find(item => item.nome === "TOTAL RECEBIMENTOS")?.saldo_total || 0;
  const despesas = data.custos_operacionais_percentual.find(item => item.nome === "CUSTO TOTAL")?.saldo_total || 0;
  const lucroOperacional = data.evolucao_resultados_valor.find(item => item.nome === "RESULTADO OPERACIONAL")?.saldo_total || 0;
  const margem = data.evolucao_resultados_percentual.find(item => item.nome === "MARGEM DE CONTRIBUIÇÃO")?.saldo_total || 0;

  const evolutionChartData = useMemo(() => {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago'];
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'];
    const entradas: MonthlyRecord | undefined = data.recebimentos.find(d => d.nome === 'TOTAL RECEBIMENTOS');
    const custosVariaveis: MonthlyRecord | undefined = data.evolucao_resultados_valor.find(d => d.nome === 'CUSTOS VARIÁVEIS');
    const custosFixos: MonthlyRecord | undefined = data.evolucao_resultados_valor.find(d => d.nome === 'CUSTOS FIXOS OPERACIONAIS');
    const resultado: MonthlyRecord | undefined = data.evolucao_resultados_valor.find(d => d.nome === 'RESULTADO OPERACIONAL');

    if (!entradas || !custosVariaveis || !custosFixos || !resultado) return [];

    return months.map((month, index) => {
      const key = `saldo_${month}_2025` as keyof MonthlyRecord;
      const saidas = Number(custosVariaveis[key] || 0) + Number(custosFixos[key] || 0);
      return {
        month: monthLabels[index],
        entradas: entradas[key] ? Number(entradas[key]) : 0,
        saidas: saidas,
        resultado: resultado[key] ? Number(resultado[key]) : 0,
      };
    });
  }, []);

  const donutChartData = useMemo(() => {
    const ignoredTypes = ["CUSTO OPERAÇÃO", "CUSTO TOTAL"];

    return data.custos_operacionais_percentual
      .filter(item => !ignoredTypes.includes(item.nome) && item.saldo_total && item.saldo_total > 0)
      .map(item => ({
        tipo: item.nome.replace(/\/ OPERACIONAIS/g, '').trim(),
        valorPercentual: parseFloat(item.saldo_total.toFixed(2)),
      }));
  }, []);

  const [evolutionChartOptions, setEvolutionChartOptions] = useState<AgChartOptions>({});
  const [donutChartOptions, setDonutChartOptions] = useState<AgChartOptions>({});

  const revenueGrowthData = useMemo(() => { 
    const totalSales = data.faturamento.find(item => item.nome.trim() === "TOTAL VENDAS");
    if (!totalSales) return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthSales = totalSales.saldo_ago_2025;
    const previousMonthSales = totalSales.saldo_jul_2025;
    if (previousMonthSales === 0) return { percentage: currentMonthSales > 0 ? 100 : 0, period: "Julho de 2025", isPositive: true };

    const percentage = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage >= 0,
    };
  }, []);

  const costVariationData = useMemo(() => {
    const totalCosts = data.custos_operacionais_percentual.find(item => item.nome.trim() === "CUSTO TOTAL");
    if (!totalCosts) return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthCosts = totalCosts.saldo_ago_2025;
    const previousMonthCosts = totalCosts.saldo_jul_2025;
    if (previousMonthCosts === 0) return { percentage: currentMonthCosts > 0 ? 100 : 0, period: "Julho de 2025", isPositive: false };

    const percentage = ((currentMonthCosts - previousMonthCosts) / previousMonthCosts) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage <= 0,
    };
  }, []);

  const marginVariationData = useMemo(() => {
    const totalMargin = data.evolucao_resultados_percentual.find(item => item.nome.trim() === "MARGEM DE CONTRIBUIÇÃO");
    if (!totalMargin) return { percentage: 0, period: "mês anterior", isPositive: true };

    const currentMonthMargin = totalMargin.saldo_ago_2025;
    const previousMonthMargin = totalMargin.saldo_jul_2025;
    if (previousMonthMargin === 0) return { percentage: currentMonthMargin > 0 ? 100 : 0, period: "Julho de 2025", isPositive: true };

    const percentage = ((currentMonthMargin - previousMonthMargin) / previousMonthMargin) * 100;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      period: "Julho de 2025",
      isPositive: percentage >= 0,
    };
  }, []);

  const revenueCard = {
    isPositive: revenueGrowthData.isPositive,
    Icon: revenueGrowthData.isPositive ? TrendingUp : TrendingDown,
    text: revenueGrowthData.isPositive ? 'cresceu' : 'diminuiu',
    prefix: revenueGrowthData.isPositive ? '+' : ''
  };

  const costCard = {
    isPositive: costVariationData.isPositive,
    Icon: costVariationData.isPositive ? TrendingDown : TrendingUp,
    text: costVariationData.isPositive ? 'diminuíram' : 'aumentaram',
  };

  const marginCard = {
    isPositive: marginVariationData.isPositive,
    Icon: marginVariationData.isPositive ? TrendingUp : TrendingDown,
    text: marginVariationData.isPositive ? 'aumentou' : 'diminuiu',
    prefix: marginVariationData.isPositive ? '+' : ''
  };

  useEffect(() => {
    setEvolutionChartOptions({
      theme: { baseTheme: isDarkMode ? 'ag-default-dark' : 'ag-default' },
      background: { fill: 'transparent' },
      title: { text: "Evolução Financeira" },
      subtitle: { text: "Entradas, saídas e resultado operacional mensal" },
      data: evolutionChartData,
      series: [
        {
          type: 'area',
          stacked: true,
          xKey: 'month',
          yKey: 'resultado',
          yName: 'Resultado',
          fill: 'rgba(59, 130, 246, 0.3)',
          stroke: '#3b82f6',
          marker: { enabled: false, shape: 'circle', size: 4 },
          interpolation: { type: 'smooth' }
        },
        {
          type: 'area',
          stacked: true,
          xKey: 'month',
          yKey: 'saidas',
          yName: 'Saídas',
          fill: 'rgba(239, 68, 68, 0.3)',
          stroke: '#ef4444',
          marker: { enabled: false, shape: 'circle', size: 4 },
          interpolation: { type: 'smooth' }
        },
        {
          type: 'area',
          stacked: true,
          xKey: 'month',
          yKey: 'entradas',
          yName: 'Entradas',
          fill: 'rgba(34, 197, 94, 0.3)',
          stroke: '#22c55e',
          marker: { enabled: false, shape: 'circle', size: 4 },
          interpolation: { type: 'smooth' }
        },
      ] as any,
      legend: { position: 'bottom' },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          },
          line: {
            stroke: isDarkMode ? '#444' : '#ccc'
          },
          tick: {
            stroke: isDarkMode ? '#444' : '#ccc'
          }
        },
        {
          type: 'number',
          position: 'left',
          label: {
            formatter: (params) => {
              return `R$ ${params.value.toLocaleString('pt-BR')}`;
            },
            color: isDarkMode ? '#e0e0e0' : '#333'
          },
          line: {
            stroke: isDarkMode ? '#444' : '#ccc'
          },
          tick: {
            stroke: isDarkMode ? '#444' : '#ccc'
          }
        }
      ]
    });

    setDonutChartOptions({
      theme: isDarkMode ? darkTheme : lightTheme,
      background: { fill: 'transparent' },
      title: { text: 'Composição de Despesas' },
      data: donutChartData,
      series: [{
        type: 'donut',
        angleKey: 'valorPercentual',
        legendItemKey: 'tipo',
        innerRadiusRatio: 0.7,
        tooltip: {
          renderer: ({ datum }) => ({
            title: datum.tipo,
            content: `${datum.valorPercentual}%`
          })
        }
      }] as AgDonutSeriesOptions[],
      legend: { enabled: false },
    });

  }, [isDarkMode, evolutionChartData, donutChartData]);


  return (
    <DefaultLayout>
      <PageTransition>
      <section className="flex flex-col items-center h-full justify-center gap-4 py-8 md:py-1">
        <div className="w-full text-start">
          <h1 className={title({ size: 'sm' })}>Visão Geral</h1>
          <p className="text-default-500">Acompanhe os principais indicadores financeiros da sua empresa.</p>
        </div>
        <Card className="flex flex-row items-center w-full px-4 py-2 gap-2 p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.25)]">
          <CircleAlert size={16} />
          Dados importados de • Última atualização: 23/09/2025
        </Card>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-150 
                 hover:-translate-y-1 
                  hover:shadow-sm
                 default: hover:shadow-gray-400
                 dark:hover:shadow-blue-400">
            <CardHeader>
              <h4 className="font-bold text-large">Receita Total</h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">R$ {receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardBody>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <CardHeader>
              <h4 className="font-bold text-large">Despesas
              </h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">{despesas.toFixed(2)}%</p>
            </CardBody>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <CardHeader>
              <h4 className="font-bold text-large">Lucro Operacional</h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">R$ {lucroOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardBody>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <CardHeader>
              <h4 className="font-bold text-large">Margem</h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">{margem.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</p>
            </CardBody>
          </Card>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-2 ">
          <div className="lg:col-span-2 w-full shadow-md p-4 rounded-xl bg-white dark:bg-[#0c0b0b]" style={{ height: '400px' }}>
            <AgCharts options={evolutionChartOptions} />
          </div>
          <div className="lg:col-span-1 w-full rounded-xl shadow-md p-4 flex items-center bg-white dark:bg-[#0c0b0b]" style={{ height: '400px' }}>
            <div className="w-1/2 h-full">
              <AgCharts options={donutChartOptions} />
            </div>
            <div className="w-1/2 h-full flex flex-col justify-center gap-4 pl-4">
              {donutChartData.map((item, index) => (
                <div key={item.tipo} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: expenseColors[index % expenseColors.length] }}
                  />
                  <div>
                    <p className="font-bold text-sm">{item.tipo}</p>
                    <p className="text-xs text-default-500">
                      {item.valorPercentual}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-full grid md:grid-cols-3 gap-2">
          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-default-500">Crescimento de Receita</p></div>
              <div className={revenueCard.isPositive ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg" : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"}>
                <revenueCard.Icon size={20} className={revenueCard.isPositive ? "text-success-500" : "text-danger-500"} />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <p className={revenueCard.isPositive ? "text-2xl font-bold text-success-500" : "text-2xl font-bold text-danger-500"}>
                {revenueCard.prefix}{revenueGrowthData.percentage}%
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
              A receita {revenueCard.text} {Math.abs(revenueGrowthData.percentage)}% em relação a {revenueGrowthData.period}.
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-default-500">Variação de Custos</p></div>
              <div className={costCard.isPositive ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg" : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"}>
                <costCard.Icon size={20} className={costCard.isPositive ? "text-success-500" : "text-danger-500"} />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <p className={costCard.isPositive ? "text-2xl font-bold text-success-500" : "text-2xl font-bold text-danger-500"}>
                {costVariationData.percentage}%
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
              Os custos {costCard.text} {Math.abs(costVariationData.percentage)}% em relação a {costVariationData.period}.
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-[#0c0b0b] 
                 transition-all duration-300 
                 hover:-translate-y-1 
                 hover:shadow-lg 
                 dark:hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-default-500">Variação de Margem</p></div>
              <div className={marginCard.isPositive ? "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg" : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"}>
                <marginCard.Icon size={20} className={marginCard.isPositive ? "text-success-500" : "text-danger-500"} />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <p className={marginCard.isPositive ? "text-2xl font-bold text-success-500" : "text-2xl font-bold text-danger-500"}>
                {marginCard.prefix}{marginVariationData.percentage}%
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
              A margem {marginCard.text} {Math.abs(marginVariationData.percentage)}% em relação a {marginVariationData.period}.
            </p>
          </Card>
        </div>
      </section>
      </PageTransition> 
    </DefaultLayout>
  );
}