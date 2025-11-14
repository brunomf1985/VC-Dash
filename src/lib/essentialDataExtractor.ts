// Funções otimizadas para buscar apenas os dados essenciais do dashboard
import { RegistroFinanceiro } from '@/pages/types';
import { DataSearchOptions, findDataItem } from './dataHelpers';

/**
 * Interface para os dados essenciais do dashboard index
 */
export interface EssentialDashboardData {
    // Métricas principais
    receitaTotal: number;
    despesas: number;
    lucroOperacional: number;
    margem: number;

    // Dados para gráfico de evolução
    evolutionData: {
        entradas?: RegistroFinanceiro;
        custosVariaveis?: RegistroFinanceiro;
        custosFixos?: RegistroFinanceiro;
        resultado?: RegistroFinanceiro;
    };

    // Dados para donut chart
    donutData: Array<{
        nome: string;
        saldo_total: number;
    }>;

    // Dados para cards de variação
    variationData: {
        totalVendas?: RegistroFinanceiro;
        custoTotal?: RegistroFinanceiro;
        margemContribuicao?: RegistroFinanceiro;
    };
}

/**
 * Extrai apenas os dados essenciais para o dashboard index
 */
export function extractEssentialDashboardData(
    apiData: any,
    options: DataSearchOptions = {}
): EssentialDashboardData {
    const { logWarning = true } = options;

    // 1. Métricas principais
    const receitaTotal = findDataItem(
        apiData?.recebimentos,
        (item: any) => item.nome?.trim().toUpperCase() === "TOTAL RECEBIMENTOS",
        { fieldName: "TOTAL RECEBIMENTOS", logWarning }
    )?.saldo_total || 0;

    const despesas = findDataItem(
        apiData?.custos_operacionais_percentual,
        (item: any) => item.nome?.trim().toUpperCase() === "CUSTO TOTAL",
        { fieldName: "CUSTO TOTAL", logWarning }
    )?.saldo_total || 0;

    // Tentar encontrar lucro operacional, senão calcular
    let lucroOperacional = findDataItem(
        apiData?.evolucao_resultados_valor,
        (item: any) => item.nome?.trim().toUpperCase() === "RESULTADO OPERACIONAL",
        { fieldName: "RESULTADO OPERACIONAL", logWarning: false }
    )?.saldo_total || 0;

    // Se não encontrou, calcular: Receita Total - Custos em valor
    if (lucroOperacional === 0 && receitaTotal > 0 && despesas > 0) {
        // Despesas está em %, então calcular o valor: receita * (despesas / 100)
        const despesasValor = receitaTotal * (despesas / 100);
        lucroOperacional = receitaTotal - despesasValor;

    }

    // Tentar encontrar margem, senão calcular
    let margem = findDataItem(
        apiData?.evolucao_resultados_percentual,
        (item: any) => item.nome?.trim().toUpperCase() === "MARGEM DE CONTRIBUIÇÃO",
        { fieldName: "MARGEM DE CONTRIBUIÇÃO", logWarning: false }
    )?.saldo_total || 0;

    // Se não encontrou, calcular de forma mais robusta
    if (margem === 0) {
        // Se a receitaTotal for maior que 0, podemos calcular a margem.
        // Não importa se o lucro é positivo ou negativo.
        if (receitaTotal > 0) {
            // Calcular margem como: (Lucro / Receita) * 100
            // Isso funciona para lucro (positivo) e prejuízo (negativo).
            margem = (lucroOperacional / receitaTotal) * 100;

        } else if (despesas > 0) {
            // Fallback de último caso se não houver receita, mas houver despesas
            margem = 100 - despesas;
        }
    }

    // 2. Dados para gráfico de evolução
    const entradas = findDataItem(
        apiData?.recebimentos,
        (item: any) => item.nome?.trim().toUpperCase() === "TOTAL RECEBIMENTOS",
        { fieldName: "TOTAL RECEBIMENTOS (Evolution)", logWarning: true }
    );



    // Tentar primeiro evolucao_resultados_valor, senão usar fontes alternativas
    let custosVariaveis: any = null;
    let custosFixos: any = null;
    let resultado: any = null;

    if (apiData?.evolucao_resultados_valor && Array.isArray(apiData.evolucao_resultados_valor) && apiData.evolucao_resultados_valor.length > 0) {
        custosVariaveis = findDataItem(
            apiData.evolucao_resultados_valor,
            (item: any) => item.nome?.trim().toUpperCase() === "CUSTOS VARIÁVEIS",
            { fieldName: "CUSTOS VARIÁVEIS", logWarning: false }
        );

        custosFixos = findDataItem(
            apiData.evolucao_resultados_valor,
            (item: any) => item.nome?.trim().toUpperCase() === "CUSTOS FIXOS OPERACIONAIS",
            { fieldName: "CUSTOS FIXOS OPERACIONAIS", logWarning: false }
        );

        resultado = findDataItem(
            apiData.evolucao_resultados_valor,
            (item: any) => item.nome?.trim().toUpperCase() === "RESULTADO OPERACIONAL",
            { fieldName: "RESULTADO OPERACIONAL (Evolution)", logWarning: false }
        );
    } else {
        console.warn('Campo evolucao_resultados_valor não encontrado - usando dados alternativos para gráfico de evolução');

        // Usar dados alternativos se disponíveis
        if (apiData?.faturamento && apiData?.custos_operacionais_percentual) {
            const faturamentoData = findDataItem(
                apiData.faturamento,
                (item: any) => item.nome?.trim().toUpperCase() === "TOTAL VENDAS",
                { fieldName: "TOTAL VENDAS (Alternative)", logWarning: false }
            );

            if (faturamentoData) {
                // Simular dados de resultado baseado em faturamento - recebimentos
                resultado = {
                    ...faturamentoData,
                    nome: "RESULTADO ESTIMADO"
                };

                // Calcular "saídas" baseado nos percentuais de custos
                const custoTotalPct = findDataItem(
                    apiData.custos_operacionais_percentual,
                    (item: any) => item.nome?.trim().toUpperCase() === "CUSTO TOTAL",
                    { fieldName: "CUSTO TOTAL (Alternative)", logWarning: false }
                );

                if (custoTotalPct && entradas) {
                    // Criar dados simulados de custos baseado nos percentuais
                    custosVariaveis = { nome: "CUSTOS SIMULADOS" };
                    custosFixos = { nome: "CUSTOS SIMULADOS" };

                    // Para cada mês, calcular custos baseado no percentual
                    Object.keys(entradas).forEach(key => {
                        if (key.startsWith('saldo_') && key !== 'saldo_total') {
                            const valorEntrada = Number(entradas[key] || 0);
                            const percentualCusto = custoTotalPct.media || custoTotalPct.saldo_total || 0;
                            const custoEstimado = (valorEntrada * percentualCusto) / 100;

                            custosVariaveis[key] = custoEstimado * 0.6; // 60% custos variáveis
                            custosFixos[key] = custoEstimado * 0.4; // 40% custos fixos
                            resultado[key] = valorEntrada - custoEstimado;
                        }
                    });
                }
            }
        }
    }

    let custosEmValor: RegistroFinanceiro | undefined = undefined;

    // Filtro para chaves de mês válidas
    const getSaldoKeys = (obj: any) =>
        Object.keys(obj || {}).filter(key => key.startsWith('saldo_') && key !== 'saldo_total');

    if (custosVariaveis || custosFixos) {
        custosEmValor = {
            nome: "CUSTOS EM VALOR",
            tipo_registro: "CALC",
            // Pega todas as chaves de mês de ambos os objetos
            ...Object.fromEntries(
                [
                    ...new Set([
                        ...getSaldoKeys(custosVariaveis),
                        ...getSaldoKeys(custosFixos)
                    ])
                ]
                    .map(key => {
                        const valorVariavel = Number((custosVariaveis as any)?.[key] || 0);
                        const valorFixo = Number((custosFixos as any)?.[key] || 0);
                        return [key, valorVariavel + valorFixo];
                    })
            )
        };

        // Calcular o saldo_total
        custosEmValor.saldo_total = Object.keys(custosEmValor)
            .filter(key => key.startsWith('saldo_') && key !== 'saldo_total')
            .reduce((acc, key) => acc + Number((custosEmValor as any)[key] || 0), 0);
    }

    // 3. Dados para donut chart (filtrar apenas os necessários)
    const donutData = (apiData?.custos_operacionais_percentual || [])
        .filter((item: any) => {
            const nome = item.nome?.trim().toUpperCase();
            return nome !== "CUSTO OPERAÇÃO" &&
                nome !== "CUSTO TOTAL" &&
                item.saldo_total &&
                item.saldo_total > 0;
        })
        .map((item: any) => ({
            nome: item.nome.replace(/\/ OPERACIONAIS/g, "").trim(),
            saldo_total: parseFloat(item.saldo_total.toFixed(2))
        }));

    // 4. Dados para cards de variação
    const totalVendas = findDataItem(
        apiData?.faturamento,
        (item: any) => item.nome?.trim().toUpperCase() === "TOTAL VENDAS",
        { fieldName: "TOTAL VENDAS", logWarning: false }
    );

    const custoTotal = findDataItem(
        apiData?.custos_operacionais_percentual,
        (item: any) => item.nome?.trim().toUpperCase() === "CUSTO TOTAL",
        { fieldName: "CUSTO TOTAL (Variation)", logWarning: false }
    );

    // Tentar encontrar margem nos dados, senão calcular automaticamente
    let margemContribuicao = findDataItem(
        apiData?.evolucao_resultados_percentual,
        (item: any) => item.nome?.trim().toUpperCase() === "MARGEM DE CONTRIBUIÇÃO",
        { fieldName: "MARGEM DE CONTRIBUIÇÃO (Variation)", logWarning: false }
    );

    // Se não encontrou margem, calcular automaticamente: Receita - Custo Total
    if (!margemContribuicao && totalVendas && custoTotal) {


        // Criar objeto simulado com estrutura similar aos dados da API
        const mesesChaves = Object.keys(totalVendas)
            .filter(key => key.startsWith('saldo_') && key !== 'saldo_total');

        margemContribuicao = {
            nome: "MARGEM CALCULADA",
            tipo_registro: "CALC",
            saldo_total: 0,
            media: 0
        };

        let totalMargem = 0;
        let mesesComDados = 0;

        // Calcular margem para cada mês
        mesesChaves.forEach(chave => {
            const receita = totalVendas[chave] || 0;
            const custo = custoTotal[chave] || 0;

            if (receita > 0) {
                // Margem = Receita - (Receita * (Custo% / 100))
                const custoValor = receita * (custo / 100);
                const margem = receita - custoValor;

                margemContribuicao[chave] = margem;
                totalMargem += margem;
                mesesComDados++;
            } else {
                margemContribuicao[chave] = 0;
            }
        });

        margemContribuicao.saldo_total = totalMargem;
        margemContribuicao.media = mesesComDados > 0 ? totalMargem / mesesComDados : 0;


    }



    return {
        // Métricas principais
        receitaTotal,
        despesas,
        lucroOperacional,
        margem,

        // Dados para gráfico de evolução
        evolutionData: {
            entradas,
            custosVariaveis,
            custosFixos,
            resultado
        },

        // Dados para donut chart
        donutData,

        // Dados para cards de variação
        variationData: {
            totalVendas,
            custoTotal,
            margemContribuicao
        }
    };
}

/**
 * Verifica se os dados essenciais estão disponíveis
 */
export function validateEssentialData(data: EssentialDashboardData): {
    hasMainMetrics: boolean;
    hasEvolutionData: boolean;
    hasDonutData: boolean;
    hasVariationData: boolean;
    isUsable: boolean;
} {
    const hasMainMetrics = data.receitaTotal > 0 || data.lucroOperacional !== 0 || data.margem !== 0;

    const hasEvolutionData = !!(data.evolutionData.entradas &&
        data.evolutionData.resultado);



    const hasDonutData = data.donutData.length > 0;

    const hasVariationData = !!(data.variationData.totalVendas ||
        data.variationData.custoTotal ||
        data.variationData.margemContribuicao);

    // Dashboard é utilizável se tiver ao menos métricas principais
    const isUsable = hasMainMetrics;

    return {
        hasMainMetrics,
        hasEvolutionData,
        hasDonutData,
        hasVariationData,
        isUsable
    };
}

/**
 * Validações específicas para cada seção do dashboard
 */
export interface SectionValidation {
    showMainMetrics: boolean;
    showEvolutionChart: boolean;
    showDonutChart: boolean;
    showVariationCards: boolean;
}

/**
 * Determina quais seções devem ser exibidas baseado nos dados disponíveis
 */
export function validateSections(data: EssentialDashboardData): SectionValidation {
    const validation = validateEssentialData(data);

    return {
        // Métricas principais: mostrar se há pelo menos uma métrica válida
        showMainMetrics: validation.hasMainMetrics,

        // Gráfico de evolução: mostrar se há dados de entrada e resultado
        showEvolutionChart: validation.hasEvolutionData,

        // Gráfico donut: mostrar se há pelo menos 1 item com dados
        showDonutChart: validation.hasDonutData,

        // Cards de variação: mostrar se há pelo menos um dado de variação
        showVariationCards: validation.hasVariationData
    };
}

/**
 * Validações individuais para cada card de variação
 */
export function validateVariationCards(data: EssentialDashboardData): {
    showRevenueCard: boolean;
    showCostCard: boolean;
    showMarginCard: boolean;
} {
    return {
        showRevenueCard: !!(data.variationData.totalVendas),
        showCostCard: !!(data.variationData.custoTotal),
        showMarginCard: !!(data.variationData.margemContribuicao)
    };
}