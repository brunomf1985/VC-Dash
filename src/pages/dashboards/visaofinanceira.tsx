import { useState, useMemo } from 'react';
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { PageTransition } from "@/components/PageTransiotion";
import { useFilter } from '@/hooks/useFilter';
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
  const { filteredData } = useFilter();

  // Função para calcular meta ajustada ao período filtrado
  const calculateAdjustedMeta = (baseMeta: number, dataItem: any) => {
    if (!dataItem || baseMeta <= 0) return baseMeta;

    // Contar quantos meses têm dados no período filtrado
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    let monthsWithData = 0;

    months.forEach(month => {
      const key = `saldo_${month}_2025`;
      const value = dataItem[key];
      // Considera como mês com dados se o valor existe e não é undefined/null
      // (mesmo que seja 0, pois 0 pode ser um valor válido)
      if (value !== undefined && value !== null) {
        monthsWithData++;
      }
    });

    // Se temos dados mensais, calcular meta proporcional
    if (monthsWithData > 0) {
      // Para metas percentuais (como 5% ao ano):
      // A meta permanece a mesma em % independente do período
      // Exemplo: meta de 5% é 5% seja em 1 mês ou 6 meses

      // Para metas de valor absoluto, seria diferente:
      // metaMensal = baseMeta / 12; return metaMensal * monthsWithData;

      // Como estamos lidando com percentuais de resultado, 
      // mantemos a meta original (5% é 5% independente do período)
      return baseMeta;
    }

    // Se não há dados mensais, usar meta original
    return baseMeta;
  };
  const faturamentoTotal = filteredData.faturamento?.find((item: any) => item.nome.trim() === 'TOTAL VENDAS')?.saldo_total || 0;
  const recebimentoTotal = filteredData.recebimentos?.find((item: any) => item.nome.trim() === 'TOTAL RECEBIMENTOS')?.saldo_total || 0;

  // Calcular pagamentos totais de forma alternativa usando custos percentuais
  const pagamentosTotais = useMemo(() => {
    // Tentar método original primeiro
    const custosVariaveis = filteredData.evolucao_resultados_valor?.find((item: any) => item.nome.trim() === 'CUSTOS VARIÁVEIS')?.saldo_total || 0;
    const custosFixos = filteredData.evolucao_resultados_valor?.find((item: any) => item.nome.trim() === 'CUSTOS FIXOS OPERACIONAIS')?.saldo_total || 0;

    if (custosVariaveis > 0 || custosFixos > 0) {
      return custosVariaveis + custosFixos;
    }

    // Método alternativo: calcular usando custo percentual
    const custoPercentual = filteredData.custos_operacionais_percentual?.find((item: any) => item.nome.trim() === 'CUSTO TOTAL')?.saldo_total || 0;
    if (custoPercentual > 0 && faturamentoTotal > 0) {
      return faturamentoTotal * (custoPercentual / 100);
    }

    return 0;
  }, [filteredData, faturamentoTotal]);

  // Calcular resultado líquido alternativo
  const resultadoLiquido = useMemo(() => {
    // Tentar método original primeiro
    const resultadoOriginal = filteredData.evolucao_resultados_valor?.find((item: any) => item.nome.trim() === 'RESULTADO OPERACIONAL')?.saldo_total || 0;

    if (resultadoOriginal > 0) {
      return resultadoOriginal;
    }

    // Método alternativo: Receita - Pagamentos
    if (recebimentoTotal > 0 && pagamentosTotais > 0) {
      return recebimentoTotal - pagamentosTotais;
    }

    return 0;
  }, [filteredData, recebimentoTotal, pagamentosTotais]);
  const mediaMensalFaturamento = filteredData.faturamento?.find((item: any) => item.nome.trim() === 'TOTAL VENDAS')?.media || 0;
  // Novo (com correção)
  const taxaRecebimento = faturamentoTotal > 0
    ? (recebimentoTotal / faturamentoTotal) * 100
    : 0;

  const evolutionChartData = useMemo(() => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"];
    const recebimentosData = filteredData.recebimentos?.find((d: any) => d.nome === 'TOTAL RECEBIMENTOS');
    const faturamentoData = filteredData.faturamento?.find((d: any) => d.nome.trim() === 'TOTAL VENDAS');

    if (!recebimentosData || !faturamentoData) return [];

    return months.map(month => {
      const monthKey = `saldo_${month}_2025` as keyof typeof recebimentosData;
      const recebimentos = recebimentosData[monthKey] || 0;
      const vendas = faturamentoData[monthKey] || 0;
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        Recebimentos: recebimentos,
        Vendas: vendas,
      };
    }).filter(item => item.Recebimentos > 0 || item.Vendas > 0);
  }, [filteredData]);

  const barChartData = useMemo(() => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago"];
    const entradasData = filteredData.recebimentos?.find((d: any) => d.nome.trim() === "TOTAL RECEBIMENTOS") as MonthlyRecord | undefined;
    const custosVariaveisData = filteredData.evolucao_resultados_valor?.find((d: any) => d.nome.trim() === "CUSTOS VARIÁVEIS") as MonthlyRecord | undefined;
    const custosFixosData = filteredData.evolucao_resultados_valor?.find((d: any) => d.nome.trim() === "CUSTOS FIXOS OPERACIONAIS") as MonthlyRecord | undefined;
    const resultadoData = filteredData.evolucao_resultados_valor?.find((d: any) => d.nome.trim() === "RESULTADO OPERACIONAL") as MonthlyRecord | undefined;

    if (!entradasData || !custosVariaveisData || !custosFixosData || !resultadoData) return [];

    return months.map(month => {
      const key = `saldo_${month}_2025`;
      const entradas = entradasData[key] || 0;
      const saidas = (Number(custosVariaveisData[key] || 0) + Number(custosFixosData[key] || 0));
      const resultado = resultadoData[key] || 0;
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        Entradas: entradas,
        Saídas: saidas,
        Resultado: resultado,
      };
    }).filter(item => item.Entradas > 0 || item.Saídas > 0 || item.Resultado !== 0);
  }, [filteredData]);



  const revenueGrowthData = useMemo(() => {


    // Primeiro: verificar se há comparativo de recebimentos vs vendas
    // Buscar por qualquer item que contenha os termos principais
    let recebimentosVsVendas = null;
    if (filteredData.comparativo_vendas_vs_recebimento) {
      recebimentosVsVendas = filteredData.comparativo_vendas_vs_recebimento.find(
        (item: any) => {
          const nome = item.nome.trim().toUpperCase();
          return nome.includes("RECEBIMENTOS") && nome.includes("VENDAS") && nome.includes("%");
        }
      );
    }

    if (recebimentosVsVendas && recebimentosVsVendas.saldo_total !== undefined) {
      // Converter o valor para número de forma segura
      const valor = Number(recebimentosVsVendas.saldo_total);

      // Se o valor for NaN, usar 0 como fallback
      const percentageValue = isNaN(valor) ? 0 : valor;

      return {
        percentage: percentageValue,
        period: "período selecionado",
        isPositive: percentageValue >= 0,
      };
    }

    // Fallback: usar dados de faturamento
    const totalSales = filteredData.faturamento?.find(
      (item: any) => item.nome.trim() === "TOTAL VENDAS"
    );
    if (!totalSales)
      return { percentage: 0, period: "período anterior", isPositive: true };

    // Calcular crescimento baseado na diferença entre recebimentos e vendas no período
    const vendasTotal = totalSales.saldo_total || 0;
    const recebimentosTotal = filteredData.recebimentos?.find(
      (item: any) => item.nome.trim() === "TOTAL RECEBIMENTOS"
    )?.saldo_total || 0;

    if (vendasTotal > 0) {
      const eficienciaRecebimento = ((recebimentosTotal - vendasTotal) / vendasTotal) * 100;
      return {
        percentage: parseFloat(eficienciaRecebimento.toFixed(2)),
        period: "eficiência de recebimento",
        isPositive: eficienciaRecebimento >= 0,
      };
    }

    return { percentage: 0, period: "período anterior", isPositive: true };
  }, [filteredData]);



  const revenueCard = {
    isPositive: revenueGrowthData.isPositive,
    Icon: revenueGrowthData.isPositive ? TrendingUp : TrendingDown,
    text: revenueGrowthData.isPositive ? "cresceu" : "diminuiu",
    prefix: revenueGrowthData.isPositive ? "+" : "",
  };

  // Nova lógica para o card de Faturamento vs. Projetado
  const faturamentoProjetadoData = useMemo(() => {


    // Definir um teto para não poluir a tela
    const MAX_DISPLAY_PERCENTAGE = 999;

    const comparativo = filteredData.comparativo_faturamento_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "FATURAMENTO REALIZADO ÷ PROJETADO (%)"
    );


    if (comparativo && comparativo.saldo_total !== undefined) {
      // O saldo_total aqui já é a variância final (ex: -34.07)
      // Não precisa de cálculos adicionais
      const performance = comparativo.saldo_total;

      return {
        percentage: parseFloat(performance.toFixed(2)),
        isPositive: performance >= 0,
      };
    }

    // Fallback: calcular baseado nos dados reais
    const faturamentoProjetado = filteredData.comparativo_faturamento_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "FATURAMENTO PROJETADO"
    );
    const faturamentoRealizado = filteredData.comparativo_faturamento_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "FATURAMENTO REALIZADO"
    );


    if (faturamentoProjetado && faturamentoRealizado && faturamentoProjetado.saldo_total > 0) {
      // Fórmula da Variância: ((Real / Projetado) * 100) - 100
      let performance = ((faturamentoRealizado.saldo_total / faturamentoProjetado.saldo_total) * 100) - 100;

      // Limita o valor máximo
      if (performance > MAX_DISPLAY_PERCENTAGE) {
        performance = MAX_DISPLAY_PERCENTAGE;
      }

      return {
        percentage: parseFloat(performance.toFixed(2)),
        isPositive: performance >= 0,
      };
    }

    // Se chegou até aqui, não há dados suficientes
    // Retorna 0% como fallback para que o card ainda apareça
    return { percentage: 0, isPositive: true };
  }, [filteredData]);

  const faturamentoProjetadoCard = {
    isPositive: faturamentoProjetadoData.isPositive,
    Icon: faturamentoProjetadoData.isPositive ? TrendingUp : TrendingDown,
    text: faturamentoProjetadoData.isPositive ? "acima do projetado" : "abaixo do projetado",
    prefix: faturamentoProjetadoData.isPositive ? "+" : "",
  };

  const resultadoOperacionalProjetadoData = useMemo(() => {


    // Definir um teto para não poluir a tela
    const MAX_DISPLAY_PERCENTAGE = 999;

    const comparativo = filteredData.comparativo_resultado_operacional_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "RESULT. OPERAC. REALIZADO ÷ PROJETADO (%)"
    );


    if (comparativo && comparativo.saldo_total !== undefined) {
      // O saldo_total já é a variância final (ex: -107)
      // Não precisa de cálculos adicionais
      const performance = comparativo.saldo_total;

      return {
        percentage: parseFloat(performance.toFixed(2)),
        isPositive: performance >= 0,
      };
    }

    // Fallback: calcular baseado nos dados reais
    const resultadoProjetado = filteredData.comparativo_resultado_operacional_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "RESULTADO OPERACIONAL PROJETADO"
    );
    const resultadoRealizado = filteredData.comparativo_resultado_operacional_projetado_vs_realizado?.find(
      (item: any) => item.nome.trim() === "RESULTADO OPERACIONAL REALIZADO"
    );


    if (resultadoProjetado && resultadoRealizado && resultadoProjetado.saldo_total > 0) {
      // Fórmula da Variância: ((Real / Projetado) * 100) - 100
      let performance = ((resultadoRealizado.saldo_total / resultadoProjetado.saldo_total) * 100) - 100;

      // Limita o valor máximo
      if (performance > MAX_DISPLAY_PERCENTAGE) {
        performance = MAX_DISPLAY_PERCENTAGE;
      }

      return {
        percentage: parseFloat(performance.toFixed(2)),
        isPositive: performance >= 0,
      };
    }

    // Fallback: usar resultado operacional vs meta do segmento
    const resultadoOperacional = filteredData.evolucao_resultados_percentual?.find(
      (item: any) => item.nome.trim() === "RESULTADO OPERACIONAL"
    );

    if (resultadoOperacional && resultadoOperacional.saldo_total !== undefined) {
      // Pega a meta base do segmento. Se não houver, usa 5% como padrão
      const metaBase = resultadoOperacional.media_seg || 5;
      const resultadoReal = resultadoOperacional.saldo_total;

      // Calcular meta ajustada ao período filtrado
      const metaAjustada = calculateAdjustedMeta(metaBase, resultadoOperacional);

      // Evitar divisão por zero ou metas irreais
      if (metaAjustada < 0.1) {
        // Se a meta ajustada é muito baixa e o resultado é positivo, 
        // considera que bateu a meta (0% de variação, positivo)
        return { percentage: 0, isPositive: resultadoReal > 0 };
      }

      // Fórmula da Variância: ((Real / Meta Ajustada) * 100) - 100
      let performance = ((resultadoReal / metaAjustada) * 100) - 100;

      // Limita o valor máximo
      if (performance > MAX_DISPLAY_PERCENTAGE) {
        performance = MAX_DISPLAY_PERCENTAGE;
      }

      return {
        percentage: parseFloat(performance.toFixed(2)),
        isPositive: performance >= 0,
      };
    }

    // Se chegou até aqui, não há dados suficientes
    // Retorna 0% como fallback para que o card ainda apareça
    return { percentage: 0, isPositive: true };
  }, [filteredData]);

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
                value={revenueGrowthData.percentage || 0}
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
              {Math.abs(isNaN(revenueGrowthData.percentage) ? 0 : revenueGrowthData.percentage)}% em relação a{" "}
              {revenueGrowthData.period}.
            </p>
          </Card>

          {/* CARD 2: Faturamento vs. Projetado */}
          {!isNaN(faturamentoProjetadoData.percentage) ? (
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
                  value={faturamentoProjetadoData.percentage}
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
          ) : (
            <Card className="p-4 bg-white dark:bg-[#141313] flex items-center justify-center">
              <p className="text-sm text-gray-500">Faturamento vs. Projetado (N/A)</p>
            </Card>
          )}

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
