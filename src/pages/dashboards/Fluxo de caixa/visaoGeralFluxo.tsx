import { useMemo } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ClipboardList,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ComposedChart,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";

import data from "../../exemplo.json";

import { RegistroFinanceiro } from "@/pages/types";
import { PageTransition } from "@/components/PageTransiotion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CustomTooltip } from "@/components/CustomTooltip";
import { useWatchTheme } from "@/hooks/WatchTheme";

export default function VisaoGeralFluxo() {
  const { isDarkMode } = useWatchTheme();

  const faturamentoMesAtual = useMemo(() => {
    const hoje = new Date();

    // 1. Define o período: o mês atual
    const dataMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(),-1, 1);

    // 2. Reutiliza sua função helper
    const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
      const mesAbrev = data
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      const ano = data.getFullYear();

      return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
    };

    // 3. Cria a chave para buscar no JSON
    const chaveMesAtual = criarChaveDoMes(dataMesAtual);

    // 4. Busca a linha de "TOTAL VENDAS"
    const faturamentoData = data.faturamento.find(
      (item) => item.nome.trim() === "TOTAL VENDAS",
    );

    const meta = 1000000; // Exemplo de meta

    // 5. Lógica de fallback
    if (!faturamentoData) {
      return {
        valor: 0,
        nome: "N/A",
      };
    }

    // 6. Pega o valor
    // Se a chave (ex: 'saldo_out_2025') não existir no JSON, o valor será 0.
    const valorMesAtual = Number((faturamentoData as any)[chaveMesAtual] || 0);

    // 7. Formata o nome para exibição
    const nomeMesAtual = dataMesAtual.toLocaleString("pt-BR", {
      month: "long",
    });
    const nomeFormatado =
      nomeMesAtual.charAt(0).toUpperCase() + nomeMesAtual.slice(1);

    return {
      valor: valorMesAtual,
      nome: nomeFormatado,
      meta: meta,
      IsPositive: valorMesAtual >= meta,
    };
  }, [data]);

  const entradasMesAtual = useMemo(() => {
    const hoje = new Date();

    // 1. Define o período: o mês atual
    const dataMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(),-1, 1);

    // 2. Reutiliza sua função helper
    const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
      const mesAbrev = data
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      const ano = data.getFullYear();

      return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
    };

    // 3. Cria a chave para buscar no JSON
    const chaveMesAtual = criarChaveDoMes(dataMesAtual);

    // 4. MODIFICADO: Busca a linha de "TOTAL RECEBIMENTOS" em data.recebimentos
    const entradasData = data.recebimentos.find(
      (item) => item.nome.trim() === "TOTAL RECEBIMENTOS",
    );

    // Você pode definir uma meta específica para as entradas
    const meta = 800000;

    // 5. Lógica de fallback
    if (!entradasData) {
      return {
        valor: 0,
        nome: "N/A",
        meta: meta,
        IsPositive: false,
      };
    }

    // 6. Pega o valor
    const valorMesAtual = Number((entradasData as any)[chaveMesAtual] || 0);

    // 7. Formata o nome para exibição
    const nomeMesAtual = dataMesAtual.toLocaleString("pt-BR", {
      month: "long",
    });
    const nomeFormatado =
      nomeMesAtual.charAt(0).toUpperCase() + nomeMesAtual.slice(1);

    return {
      valor: valorMesAtual,
      nome: nomeFormatado,
      meta: meta,
      IsPositive: valorMesAtual >= meta,
    };
  }, [data]);

  const saidasMesAtual = useMemo(() => {
    const hoje = new Date();

    // 1. Define o período: o mês atual
    const dataMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(),-1, 1);

    // 2. Reutiliza sua função helper
    const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
      const mesAbrev = data
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      const ano = data.getFullYear();

      return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
    };

    // 3. Cria a chave para buscar no JSON
    const chaveMesAtual = criarChaveDoMes(dataMesAtual);

    // 4. Busca os dados de custos em data.evolucao_resultados_valor
    const custosVariaveisData = data.evolucao_resultados_valor.find(
      (item) => item.nome.trim() === "CUSTOS VARIÁVEIS",
    );
    const custosFixosData = data.evolucao_resultados_valor.find(
      (item) => item.nome.trim() === "CUSTOS FIXOS OPERACIONAIS",
    );

    // Define uma meta de gastos (ex: limite de R$ 850.000)
    const meta = 850000;

    // 5. Lógica de fallback
    if (!custosVariaveisData || !custosFixosData) {
      return {
        valor: 0,
        nome: "N/A",
        meta: meta,
        IsPositive: true, // Positivo se for 0 (abaixo da meta)
      };
    }

    // 6. Pega os valores
    const valorVariavel = Number(
      (custosVariaveisData as any)[chaveMesAtual] || 0,
    );
    const valorFixo = Number((custosFixosData as any)[chaveMesAtual] || 0);
    const valorMesAtual = valorVariavel + valorFixo;

    // 7. Formata o nome para exibição
    const nomeMesAtual = dataMesAtual.toLocaleString("pt-BR", {
      month: "long",
    });
    const nomeFormatado =
      nomeMesAtual.charAt(0).toUpperCase() + nomeMesAtual.slice(1);

    return {
      valor: valorMesAtual,
      nome: nomeFormatado,
      meta: meta,
      // É "Positivo" (bom) se a saída for MENOR ou igual à meta
      IsPositive: valorMesAtual <= meta,
    };
  }, [data]);

  const fluxoOperacionalMesAtual = useMemo(() => {
    // 1. Calcula o valor do fluxo
    const valorFluxo = entradasMesAtual.valor - saidasMesAtual.valor;

    // 2. Define se o resultado é positivo (bom)
    const isPositive = valorFluxo >= 0;

    // 3. Define uma meta (ex: fluxo de caixa positivo de R$ 50.000)
    const meta = 50000;

    return {
      valor: valorFluxo,
      nome: entradasMesAtual.nome, // Reutiliza o nome do mês
      meta: meta,
      // É "Positivo" se o fluxo for MAIOR ou igual à meta
      IsPositive: valorFluxo >= meta,
    };
    // 4. Define as dependências. Este hook depende dos outros dois.
  }, [entradasMesAtual, saidasMesAtual]);

  const barChartData = useMemo(() => {
    // 1. Buscar as fontes de dados
    const entradasData = data.recebimentos.find(
      (item) => item.nome.trim() === "TOTAL RECEBIMENTOS",
    );
    const custosVariaveisData = data.evolucao_resultados_valor.find(
      (item) => item.nome.trim() === "CUSTOS VARIÁVEIS",
    );
    const custosFixosData = data.evolucao_resultados_valor.find(
      (item) => item.nome.trim() === "CUSTOS FIXOS OPERACIONAIS",
    );

    // 2. Fallback se os dados principais não existirem
    if (!entradasData || !custosVariaveisData || !custosFixosData) {
      return [];
    }

    // 3. Função helper para criar a chave do mês
    const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
      const mesAbrev = data
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      const ano = data.getFullYear();

      return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
    };

    const mesesProcessados = [];
    const hoje = new Date();

    // 4. Loop de 12 meses
    for (let i = 11; i >= 0; i--) {
      const dataDoPeriodo = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - i,
        1,
      );
      const ano = dataDoPeriodo.getFullYear();

      const mesAbrev = dataDoPeriodo
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      const mesAbrevCapitalizado =
        mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);

      const nomeDoMes = dataDoPeriodo.toLocaleString("pt-BR", {
        month: "long",
      });
      const nomeDoMesCapitalizado =
        nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);

      const chaveDoMes = criarChaveDoMes(dataDoPeriodo);

      // 5. Calcular valores para o mês
      const valorEntradas = Number((entradasData as any)[chaveDoMes] || 0);
      const valorCustoVariavel = Number(
        (custosVariaveisData as any)[chaveDoMes] || 0,
      );
      const valorCustoFixo = Number((custosFixosData as any)[chaveDoMes] || 0);

      const valorSaidas = valorCustoVariavel + valorCustoFixo;
      const valorResultado = valorEntradas - valorSaidas;

      // 6. Adicionar ao array (se houver dados)
      if (valorEntradas > 0 || valorSaidas > 0) {
        mesesProcessados.push({
          name: `${mesAbrevCapitalizado} ${ano}`,
          tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
          Entradas: parseFloat(valorEntradas.toFixed(2)),
          Saídas: parseFloat(valorSaidas.toFixed(2)),
          Resultado: parseFloat(valorResultado.toFixed(2)),
        });
      }
    }

    return mesesProcessados; // Retorna o array de dados diretamente
  }, [data]);

  const tooltipValueFormatter = (value: ValueType) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("pt-BR", {
        compactDisplay: "long",
        style: "currency",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        currency: "BRL",
      }).format(value);
    }

    return value;
  };

  const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
    const mesAbrev = data
      .toLocaleString("pt-BR", { month: "short" })
      .replace(".", "");
    const ano = data.getFullYear();

    return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
  };

  // Lógica de cores para os Badges
  // (A lógica da imagem não é clara, então criei uma simples: >= 95% é bom)
  const getBadgeClass = (taxa: number) => {
    const baseClass = "px-3 py-1 text-sm font-medium rounded-full";

    if (taxa >= 95) {
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
    }

    return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
  };

  // Badge especial para a média/total (azul/roxo como na imagem)
  const totalBadgeClass =
    "px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";

  const processedData = useMemo(() => {
    const taxaData = data.comparativo_vendas_vs_recebimento.find(
      (item) => item.nome.trim() === "RECEBIMENTOS ÷ VENDAS (%)",
    );
    // Usamos faturamento para exibir apenas meses que tiveram vendas
    const vendasData = data.faturamento.find(
      (item) => item.nome.trim() === "TOTAL VENDAS",
    );

    if (!taxaData || !vendasData) {
      return { meses: [], media: 0 };
    }

    const mesesProcessados: { mes: string; taxa: number }[] = [];
    const hoje = new Date();

    // Itera pelos últimos 12 meses (mesma lógica do gráfico)
    for (let i = 11; i >= 0; i--) {
      const dataDoPeriodo = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - i,
        1,
      );
      const ano = dataDoPeriodo.getFullYear();
      const chaveDoMes = criarChaveDoMes(dataDoPeriodo);

      // 1. Só mostra o mês se houver vendas
      const valorVenda = Number((vendasData as any)[chaveDoMes] || 0);

      if (valorVenda > 0) {
        // 2. Calcula a taxa real
        const taxaDiferenca = Number((taxaData as any)[chaveDoMes] || 0);
        const taxaReal = 100 + taxaDiferenca;

        // 3. Formata o nome do mês (ex: "Mai/2025")
        const mesAbrev = dataDoPeriodo
          .toLocaleString("pt-BR", { month: "short" })
          .replace(".", "");
        const mesAbrevCapitalizado =
          mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);
        const nomeFormatado = `${mesAbrevCapitalizado}/${ano}`;

        mesesProcessados.push({
          mes: nomeFormatado,
          taxa: taxaReal,
        });
      }
    }

    // 4. Calcula a média total
    const media = 100 + (Number(taxaData.saldo_total) || 0);

    return { meses: mesesProcessados, media: media };
  }, [data]);

  return (
    <PageTransition>
      <div className="p-4 space-y-4">
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
                <p className="text-sm text-default-500">Saldo Atual</p>
              </div>
              <div
                className={
                  "bg-success-100 dark:bg-success-500/20 p-2 rounded-lg"
                }
              >
                <Wallet className={"text-success"} size={20} />
              </div>
            </div>
            <div className="flex items-end mt-4">
              <span className="text-2xl font-bold text-black dark:text-white">
                R$
              </span>
              <NumberTicker
                className={"text-2xl font-bold text-black dark:text-white"}
                decimalPlaces={2}
                value={faturamentoMesAtual.valor}
              />
            </div>

            <div className={`text-xs flex mt-1 justify-between`}>
              <div className="flex">
                {faturamentoMesAtual.IsPositive ? (
                  <TrendingUp
                    className={
                      faturamentoMesAtual.IsPositive
                        ? `text-success mr-1`
                        : `text-danger mr-1`
                    }
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    className={
                      faturamentoMesAtual.IsPositive
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
                  Entradas Operacionais no Mês
                </p>
              </div>
              <div
                className={
                  "bg-primary-100 dark:bg-primary-500/20 p-2 rounded-lg"
                }
              >
                <ArrowUpCircle className={"text-blue-500"} size={20} />
              </div>
            </div>
            <div className="flex items-end mt-4">
              <span className="text-2xl font-bold text-black dark:text-white">
                R$
              </span>
              <NumberTicker
                className={"text-2xl font-bold text-black dark:text-white"}
                decimalPlaces={2}
                value={entradasMesAtual.valor}
              />
            </div>

            <div className={`text-xs flex mt-1 justify-between`}>
              <div className="flex">
                {entradasMesAtual.IsPositive ? (
                  <TrendingUp
                    className={
                      entradasMesAtual.IsPositive
                        ? `text-success mr-1`
                        : `text-danger mr-1`
                    }
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    className={
                      entradasMesAtual.IsPositive
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
                  Saídas Operacionais no Mês
                </p>
              </div>
              <div
                className={"bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg"}
              >
                <ArrowDownCircle className={"text-orange-500"} size={20} />
              </div>
            </div>
            <div className="flex items-end mt-4">
              <span className="text-2xl font-bold text-black dark:text-white">
                R$
              </span>
              <NumberTicker
                className={"text-2xl font-bold text-black dark:text-white"}
                decimalPlaces={2}
                value={saidasMesAtual.valor}
              />
            </div>

            <div className={`text-xs flex mt-1 justify-between`}>
              <div className="flex">
                {saidasMesAtual.IsPositive ? (
                  <TrendingUp
                    className={
                      saidasMesAtual.IsPositive
                        ? `text-success mr-1`
                        : `text-danger mr-1`
                    }
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    className={
                      saidasMesAtual.IsPositive
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
                  Fluxo Operacional no Mês
                </p>
              </div>
              <div
                className={"bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg"}
              >
                <TrendingUp className={"text-purple-500"} size={20} />
              </div>
            </div>
            <div className="flex items-end mt-4">
              <span className="text-2xl font-bold text-black dark:text-white">
                R$
              </span>
              <NumberTicker
                className={"text-2xl font-bold text-black dark:text-white"}
                decimalPlaces={2}
                value={fluxoOperacionalMesAtual.valor}
              />
            </div>

            <div className={`text-xs flex mt-1 justify-between`}>
              <div className="flex">
                {fluxoOperacionalMesAtual.IsPositive ? (
                  <TrendingUp
                    className={
                      fluxoOperacionalMesAtual.IsPositive
                        ? `text-success mr-1`
                        : `text-danger mr-1`
                    }
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    className={
                      fluxoOperacionalMesAtual.IsPositive
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

        <Card
          className="p-4 bg-white dark:bg-[#141313] mb-4"
          style={{ height: "400px" }}
        >
          <CardHeader className="grid gap-1">
            <p className="text-base font-semibold">Evolução por Seção</p>
            <p className="text-xs text-gray-500">
              Faturamento mensal por seção
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart
                barCategoryGap="20%"
                barGap={4}
                data={barChartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  stroke={
                    isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)"
                  }
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  stroke={isDarkMode ? "#e0e0e0" : "#333"}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  stroke={isDarkMode ? "#e0e0e0" : "#333"}
                  tickFormatter={(value: number) =>
                    `R$${Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)}`
                  }
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <CustomTooltip valueFormatter={tooltipValueFormatter} />
                  }
                  cursor={{
                    fill: isDarkMode
                      ? "rgba(75, 85, 99, 0.2)"
                      : "rgba(209, 213, 219, 0.3)",
                  }}
                />
                <Legend />

                {/* BARRA 1: Entradas (igual) */}
                <Bar
                  dataKey="Entradas"
                  fill="#3b82f6" // Azul
                  name="Entradas"
                  radius={[4, 4, 0, 0]}
                />
                {/* BARRA 2: Saídas (igual) */}
                <Bar
                  dataKey="Saídas"
                  fill="#ef4444" // Vermelho
                  name="Saídas"
                  radius={[4, 4, 0, 0]}
                />

                {/* MODIFICADO: Trocamos a <Bar> de Resultado por uma <Line> 
                                  para mostrar a evolução do saldo.
                                */}
                <Line
                  activeDot={{ r: 6 }} // Ponto ao passar o mouse
                  dataKey="Resultado"
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} // Pontos na linha
                  name="Resultado (Saldo)"
                  stroke="#22c55e" // Verde
                  strokeWidth={2.5}
                  type="monotone" // Curva suave
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card
          className="p-4 bg-white dark:bg-[#141313] mb-4"
          style={{ height: "400px" }}
        >
          <CardBody>
            <ResponsiveContainer height="100%" width="100%">
              <p>card pra tabela com os salos dos bancos</p>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#141313]">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-500" />
              <p className="text-base font-semibold">
                Comparativo de Vendas x Recebimentos
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Análise de eficiência de recebimentos
            </p>
          </CardHeader>

          <CardBody className="p-0">
            {/* Cabeçalho da Lista */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-medium text-gray-500">Período</p>
              <p className="text-xs font-medium text-gray-500">
                Taxa de Recebimento
              </p>
            </div>

            {/* Lista de Meses */}
            <div className="flex flex-col gap-3">
              {processedData.meses.map((item) => (
                <div
                  key={item.mes}
                  className="flex justify-between items-center"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.mes}
                  </p>
                  <span className={getBadgeClass(item.taxa)}>
                    {item.taxa.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Linha Divisória e Total */}
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Taxa Média de Recebimento:
              </p>
              <span className={totalBadgeClass}>
                {processedData.media.toFixed(2)}%
              </span>
            </div>
          </CardBody>
        </Card>

        <Card
          className="p-4 bg-white dark:bg-[#141313] mb-4"
          style={{ height: "400px" }}
        >
          <CardBody>
            <ResponsiveContainer height="100%" width="100%">
              <p>card pra Contas à receber por mês</p>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </PageTransition>
  );
}
