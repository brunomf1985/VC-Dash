import { useState, useMemo } from 'react';
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { PageTransition } from "@/components/PageTransiotion";
import data from '../exemplo.json';
import { Area, AreaChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { useWatchTheme } from '@/hooks/WatchTheme';
import { TrendingUp, TrendingDown } from "lucide-react";
import { MonthlyRecord } from '../types';
import Performance from './Performance/performance';
import { NumberTicker } from '@/components/ui/number-ticker';
import { CustomTooltip } from '@/components/CustomTooltip';
import { ValueType, } from 'recharts/types/component/DefaultTooltipContent';
import FluxoDeCaixa from './Fluxo de caixa/fluxoDeCaixa';
import Resultados from './Resultados/resultados';


const VisaoFinanceiraContent = () => {
  const { isDarkMode } = useWatchTheme();
  const faturamentoTotal = data.faturamento.find(item => item.nome.trim() === 'TOTAL VENDAS')?.saldo_total || 0;
  const recebimentoTotal = data.recebimentos.find(item => item.nome.trim() === 'TOTAL RECEBIMENTOS')?.saldo_total || 0;
  const pagamentosTotais = (data.evolucao_resultados_valor.find(item => item.nome.trim() === 'CUSTOS VARIÁVEIS')?.saldo_total || 0) + (data.evolucao_resultados_valor.find(item => item.nome.trim() === 'CUSTOS FIXOS OPERACIONAIS')?.saldo_total || 0);
  const resultadoLiquido = data.evolucao_resultados_valor.find(item => item.nome.trim() === 'RESULTADO OPERACIONAL')?.saldo_total || 0;
  const mediaMensalFaturamento = data.faturamento.find(item => item.nome.trim() === 'TOTAL VENDAS')?.media || 0;
  const taxaRecebimento = (recebimentoTotal / faturamentoTotal) * 100;

  const evolutionChartData = useMemo(() => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"];
    const recebimentosData = data.recebimentos.find(d => d.nome === 'TOTAL RECEBIMENTOS');
    const faturamentoData = data.faturamento.find(d => d.nome.trim() === 'TOTAL VENDAS');

    if (!recebimentosData || !faturamentoData) return [];

    return months.map(month => {
      const monthKey = `saldo_${month}_2025` as keyof typeof recebimentosData;
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        Recebimentos: recebimentosData[monthKey] || 0,
        Vendas: faturamentoData[monthKey] || 0,
      };
    });
  }, []);

  const barChartData = useMemo(() => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"];
    const entradasData = data.recebimentos.find(d => d.nome.trim() === "TOTAL RECEBIMENTOS") as MonthlyRecord | undefined;
    const custosVariaveisData = data.evolucao_resultados_valor.find(d => d.nome.trim() === "CUSTOS VARIÁVEIS") as MonthlyRecord | undefined;
    const custosFixosData = data.evolucao_resultados_valor.find(d => d.nome.trim() === "CUSTOS FIXOS OPERACIONAIS") as MonthlyRecord | undefined;
    const resultadoData = data.evolucao_resultados_valor.find(d => d.nome.trim() === "RESULTADO OPERACIONAL") as MonthlyRecord | undefined;

    if (!entradasData || !custosVariaveisData || !custosFixosData || !resultadoData) return [];

    return months.map(month => {
      const key = `saldo_${month}_2025`;
      const saidas = (Number(custosVariaveisData[key] || 0) + Number(custosFixosData[key] || 0));
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        Entradas: entradasData[key] || 0,
        Saídas: saidas,
        Resultado: resultadoData[key] || 0,
      };
    });
  }, []);

  const expenseColors = ["#22c55e", "#ef4444", "#3b82f6", "#f97316", "#8b5cf6", "#d946ef", "#14b8a6"];
  const donutChartData = data.custos_operacionais_percentual
    .filter(item => !["CUSTO OPERAÇÃO", "CUSTO TOTAL"].includes(item.nome) && item.saldo_total && item.saldo_total > 0)
    .map(item => ({
      name: item.nome.replace(/\/ OPERACIONAIS/g, "").trim(),
      value: parseFloat(item.saldo_total.toFixed(2)),
    }));

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


  const revenueCard = {
    isPositive: revenueGrowthData.isPositive,
    Icon: revenueGrowthData.isPositive ? TrendingUp : TrendingDown,
    text: revenueGrowthData.isPositive ? "cresceu" : "diminuiu",
    prefix: revenueGrowthData.isPositive ? "+" : "",
  };

  // Nova lógica para o card de Faturamento vs. Projetado
  const faturamentoProjetadoData = useMemo(() => {
    const comparativo = data.comparativo_faturamento_projetado_vs_realizado.find(
      (item) => item.nome.trim() === "FATURAMENTO REALIZADO ÷ PROJETADO (%)"
    );
    if (!comparativo) return { percentage: 0, isPositive: true };
    const percentage = comparativo.saldo_total;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      isPositive: percentage >= 0,
    };
  }, []);

  const faturamentoProjetadoCard = {
    percentage: faturamentoProjetadoData.percentage,
    isPositive: faturamentoProjetadoData.isPositive,
    Icon: faturamentoProjetadoData.isPositive ? TrendingUp : TrendingDown,
    text: faturamentoProjetadoData.isPositive ? "acima do projetado" : "abaixo do projetado",
    prefix: faturamentoProjetadoData.isPositive ? "+" : "",
  };

  const resultadoOperacionalProjetadoData = useMemo(() => {
    const comparativo = data.comparativo_resultado_operacional_projetado_vs_realizado.find(
      (item) => item.nome.trim() === "RESULT. OPERAC. REALIZADO ÷ PROJETADO (%)"
    );
    if (!comparativo) return { percentage: 0, isPositive: true };
    const percentage = comparativo.saldo_total;
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      isPositive: percentage >= 0,
    };
  }, []);

  const resultadoOperacionalCard = {
    isPositive: resultadoOperacionalProjetadoData.isPositive,
    Icon: resultadoOperacionalProjetadoData.isPositive ? TrendingUp : TrendingDown,
    text: resultadoOperacionalProjetadoData.isPositive ? "acima do projetado" : "abaixo do projetado",
    prefix: resultadoOperacionalProjetadoData.isPositive ? "+" : "",
  };


  const tooltipValueFormatter = (value: ValueType,) => {
    if (typeof value === 'number') {

      return new Intl.NumberFormat('pt-BR', {
        compactDisplay: 'long',
        style: 'currency',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        currency: 'BRL',
      }).format(value);
    }

    return value;
  };

  return (
    <PageTransition>
      <div className="w-full mt-6 space-y-4">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Faturamento Total</p>
            <div>
              <span className="text-2xl font-bold">R$</span>
              <NumberTicker
                value={faturamentoTotal}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Recabimento Total</p>
            <div>
              <span className="text-2xl font-bold">R$</span>
              <NumberTicker
                value={recebimentoTotal}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Pagamentos Totais</p>
            <div>
              <span className="text-2xl font-bold">R$</span>
              <NumberTicker
                value={pagamentosTotais}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Resultado Líquido</p>
            <div>
              <span className="text-2xl font-bold">R$</span>
              <NumberTicker
                value={resultadoLiquido}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Média Mensal Faturamento</p>
            <div>
              <span className="text-2xl font-bold">R$</span>
              <NumberTicker
                value={mediaMensalFaturamento}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313] 
                       transition-all duration-150 
                       hover:-translate-y-1 
                        hover:shadow-sm
                       default: hover:shadow-gray-400
                       dark:hover:shadow-blue-400">
            <p className="text-sm text-gray-500">Taxa de Recebimento</p>
            <div className='flex'>
              <NumberTicker
                value={taxaRecebimento}
                decimalPlaces={2}
                className="text-2xl font-bold"
              />
              <span className="text-2xl font-bold">%</span>
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 bg-white dark:bg-[#141313]" style={{ height: "400px" }}>
            <CardHeader className='grid gap-1'>
              <p className="text-base font-semibold">Evolução Financeira Mensal</p>
              <p className="text-xs text-gray-500">Vendas Totais e Recebimentos</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionChartData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} /><stop offset="95%" stopColor="#8884d8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorRecebimentos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} /><stop offset="95%" stopColor="#82ca9d" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} />
                  <YAxis stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} tickFormatter={(value: number) => `R$ ${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`} />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} cursor={{ fill: 'bg-gray-300 dark:bg-gray-600' }} content={<CustomTooltip valueFormatter={tooltipValueFormatter} />} />
                  <Legend />
                  <Area type="monotone" dataKey="Vendas" stroke="#8884d8" fill="url(#colorVendas)" name='Vendas' />
                  <Area type="monotone" dataKey="Recebimentos" stroke="#82ca9d" fill="url(#colorRecebimentos)" name='Recebimentos' />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
          <Card className="p-4 bg-white dark:bg-[#141313]" style={{ height: "400px" }}>
            <CardHeader className='grid gap-1'>
              <p className="text-base font-semibold">Comparativo Mensal</p>
              <p className="text-xs text-gray-500">Entradas vs Saídas vs Resultado Operacional</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="month" stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} />
                  <YAxis stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`} />
                  <Tooltip
                    cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)' }}
                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                  />
                  <Legend />
                  <Bar radius={[4, 4, 0, 0]} dataKey="Entradas" fill="#3b82f6" name="Entradas" onClick={console.log} />
                  <Bar radius={[4, 4, 0, 0]} dataKey="Saídas" fill="#ef4444" name="Saídas" />
                  <Bar radius={[4, 4, 0, 0]} dataKey="Resultado" fill="#22c55e" name="Resultado" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        {/* Cards finais de crescimento e comparativos */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CARD 1: Crescimento de Receita */}
          <Card
            className={revenueCard.isPositive ? "p-4 bg-[#d8f1e0]  dark:bg-gradient-to-br from-[#004216] to-[#186431] transition-all duration-150 hover:-translate-y-1  hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-green-400"
              : "p-4 bg-[#f1d8d8]  dark:bg-gradient-to-br from-[#420000] to-[#6d2525] transition-all duration-150 hover:-translate-y-1 shadow-none hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-red-400"
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={revenueCard.isPositive ? "text-sm text-success-500"
                  : "text-sm text-danger-500"
                }>
                  Crescimento de Receita
                </p>
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
                    revenueCard.isPositive
                      ? "text-success-400"
                      : "text-danger-500"
                  }
                />
              </div>
            </div>
            <div className="flex items-end gap-1 mt-4">
              <NumberTicker
                value={revenueGrowthData.percentage}
                decimalPlaces={2}
                className={
                  revenueGrowthData.isPositive
                    ? "text-2xl font-bold text-success-600 dark:text-success-600"
                    : "text-2xl font-bold text-danger-500 dark:text-danger-500"
                }
              />
              <span className={revenueCard.isPositive ? "text-2xl font-bold text-success-600" : "text-2xl font-bold text-danger-500"}>
                %
              </span>
            </div>
            <p className={revenueCard.isPositive ? "text-xs text-success-500 mt-2"
              : "text-xs text-danger-500 mt-2"
            }>
              A receita {revenueCard.text}{" "}
              {Math.abs(revenueGrowthData.percentage)}% em relação a{" "}
              {revenueGrowthData.period}.
            </p>
          </Card>

          {/* CARD 2: Faturamento vs. Projetado */}
          <Card
            className={faturamentoProjetadoCard.isPositive ? "p-4 bg-[#e0e5fa]  dark:bg-gradient-to-br from-[#01026e] to-[#4344aa] transition-all duration-150 hover:-translate-y-1  hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-blue-400"
              : "p-4 bg-[#f1d8d8]  dark:bg-gradient-to-br from-[#420000] to-[#6d2525] transition-all duration-150 hover:-translate-y-1 shadow-none hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-red-400"
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={faturamentoProjetadoCard.isPositive ? "text-sm text-primary-500"
                  : "text-sm text-danger-500"
                }>
                  Faturamento vs. Projetado
                </p>
              </div>
              <div
                className={
                  faturamentoProjetadoCard.isPositive
                    ? "bg-primary-80 dark:bg-primary-500/20 p-2 rounded-lg"
                    : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"
                }
              >
                <faturamentoProjetadoCard.Icon
                  size={20}
                  className={
                    faturamentoProjetadoCard.isPositive
                      ? "text-primary-500"
                      : "text-danger-500"
                  }
                />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <NumberTicker
                value={faturamentoProjetadoCard.percentage}
                decimalPlaces={2}
                className={
                  faturamentoProjetadoCard.isPositive
                    ? "text-2xl font-bold text-primary-600 dark:text-primary-600"
                    : "text-2xl font-bold text-danger-500 dark:text-danger-500"
                }
              />
              <span className={faturamentoProjetadoCard.isPositive
                ? "text-2xl font-bold text-primary-600 dark:text-primary-600"
                : "text-2xl font-bold text-danger-500 dark:text-danger-600"}>%</span>
            </div>
            <p className={faturamentoProjetadoCard.isPositive ? "text-xs text-primary-500 mt-2"
              : "text-xs text-danger-500 mt-2"
            }>
              O faturamento realizado ficou{" "}
              {Math.abs(faturamentoProjetadoData.percentage)}%{" "}
              {faturamentoProjetadoCard.text}.
            </p>
          </Card>

          {/* CARD 3: Resultado vs. Projetado*/}
          <Card
            className={resultadoOperacionalCard.isPositive ? "p-4 bg-[#f7e8fd]  dark:bg-gradient-to-br from-[#3d016e] to-[#7343aa] transition-all duration-150 hover:-translate-y-1  hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-purple-400"
              : "p-4 bg-[#f1d8d8]  dark:bg-gradient-to-br from-[#420000] to-[#6d2525] transition-all duration-150 hover:-translate-y-1 shadow-none hover:shadow-sm default: hover:shadow-gray-400 dark:hover:shadow-red-400"
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={resultadoOperacionalCard.isPositive ? "text-sm text-purple-600 dark:text-purple-400"
                  : "text-sm text-danger-500"
                }>
                  Resultado vs. Projetado
                </p>
              </div>
              <div
                className={
                  resultadoOperacionalCard.isPositive
                    ? "bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg"
                    : "bg-danger-100 dark:bg-danger-500/20 p-2 rounded-lg"
                }
              >
                <resultadoOperacionalCard.Icon
                  size={20}
                  className={
                    resultadoOperacionalCard.isPositive
                      ? "text-purple-500"
                      : "text-danger-500"
                  }
                />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <div>
                <NumberTicker
                  value={resultadoOperacionalProjetadoData.percentage}
                  decimalPlaces={2}
                  className={
                    resultadoOperacionalCard.isPositive
                      ? "text-2xl font-bold text-purple-600 dark:text-purple-300"
                      : "text-2xl font-bold text-danger-500 dark:text-danger-500"
                  }
                />
                 <span className={resultadoOperacionalCard.isPositive
                  ? "text-2xl font-bold text-purple-600 dark:text-purple-300"
                  : "text-2xl font-bold text-danger-500"}>%</span>
              </div>
            </div>
            <p className={resultadoOperacionalCard.isPositive ? "text-xs text-purple-600 dark:text-purple-400 mt-2"
              : "text-xs text-danger-500 mt-2"
            }>
              O resultado operacional ficou{" "}
              {Math.abs(resultadoOperacionalProjetadoData.percentage)}%{" "}
              {resultadoOperacionalCard.text}.
            </p>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default function VisaoFinanceira() {
  const tabs = ['Visão Financeira', 'Performance', 'Fluxo de Caixa', 'Resultados'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <DefaultLayout>
      <PageTransition>
        <section className="flex flex-col gap-4 py-8 md:py-10">
          <div className="w-full flex justify-between items-center">
            <h1 className={title({ size: "sm" })}>Dashboards</h1>
            <p className="text-sm text-gray-500">Panorama completo de indicadores empresariais</p>
          </div>

          {/* Navegação das Abas */}
          <div className="w-full grid grid-cols-4 bg-gray-100 dark:bg-[#141313] rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`p-2 text-center rounded-md transition-colors duration-300
                                      ${activeTab === tab
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-[#252525]'
                  }
                                `
                }
              >
                <p className="text-sm font-medium">{tab}</p>
              </button>
            ))}
          </div>

          {/* Conteúdo Renderizado Condicionalmente */}
          <div>
            {activeTab === 'Visão Financeira' && <VisaoFinanceiraContent />}
            {activeTab === 'Performance' && <Performance />}
            {activeTab === 'Fluxo de Caixa' && <FluxoDeCaixa />}
            {activeTab === 'Resultados' && <Resultados />}
          </div>
        </section>
      </PageTransition>
    </DefaultLayout>
  );
}