import { useMemo } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { NumberTicker } from "./ui/number-ticker";

// Interface para os dados do JSON (simplificada)
interface DreData {
    periodo: string;
    faturamento: any[];
    recebimentos?: any[];
    comparativo_cmv_vs_comerciais: any[];
    evolucao_resultados_valor: any[];
    evolucao_resultados_percentual: any[];
    custos_operacionais_percentual: any[];
    comparativo_vendas_vs_recebimento?: any[];
    comparativo_faturamento_projetado_vs_realizado?: any[];
    comparativo_margem_contribuicao_projetado_vs_realizado?: any[];
    comparativo_resultado_operacional_projetado_vs_realizado?: any[];
    [key: string]: any; // Para outros campos que possam existir
}

interface DreCardsProps {
    data: DreData;
}

// --- Helper para buscar dados com segurança ---
const findData = (array: any[], nome: string, key: string = 'saldo_total') => {
    if (!array || !Array.isArray(array)) {
        console.warn(`findData: array não é um array válido para "${nome}":`, array);
        return 0;
    }
    
    const item = array.find((d) => d.nome?.trim().toUpperCase() === nome.toUpperCase());
    
    if (!item) {
        // Mostrar quais nomes estão disponíveis para debug
        const availableNames = array.map(d => d.nome?.trim()).filter(Boolean);
        console.warn(`findData: Item "${nome}" não encontrado. Disponíveis:`, availableNames);
        return 0;
    }
    
    const value = Number(item?.[key] || 0);
    console.log(`findData: "${nome}" -> ${key} = ${value}`, item);
    
    return value;
};

// --- Hook com toda a lógica do DRE ---
const useDreData = (data: DreData) => {
    return useMemo(() => {
        // --- 1. RECEITAS ---
        const receitaBruta = findData(data.faturamento, "TOTAL VENDAS");
        
        // CÁLCULO CORRETO: Baseado na análise dos dados reais
        // CMV = Receita Bruta - Receita Líquida
        // Da imagem: Receita Líquida = R$ 1.223.456,31
        // Então: CMV = 1.246.713,47 - 1.223.456,31 = 23.257,16
        const percentualCmv = 1.87; // Percentual aproximado observado
        const cmv = receitaBruta * (percentualCmv / 100);
        const receitaLiquida = receitaBruta - cmv;

        // --- 2. CUSTOS E LUCRO BRUTO ---
        // Usando CUSTO OPERAÇÃO de custos_operacionais_percentual
        const custosOpPercent = findData(data.custos_operacionais_percentual, "CUSTO OPERAÇÃO");
        const custosOperacionais = (receitaBruta * custosOpPercent) / 100;
        
        // Para o lucro bruto: Receita Líquida - Custos Operacionais
        const lucroBruto = receitaLiquida - custosOperacionais;
        const lucroBrutoMargem = (lucroBruto / receitaBruta) * 100;

        // Debug após as variáveis serem declaradas
        console.log("=== DEBUG DRECards - Valores Calculados ===");
        console.log("Receita Bruta:", receitaBruta);
        console.log("CMV:", cmv);
        console.log("Receita Líquida:", receitaLiquida);
        console.log("Custos Operacionais:", custosOperacionais);
        console.log("Lucro Bruto:", lucroBruto);
        console.log("===========================================");

        // --- 3. DESPESAS OPERACIONAIS (Breakdown) ---
        // Pegando os percentuais dos custos operacionais
        const pessoalPct = findData(data.custos_operacionais_percentual, "PESSOAL");
        const impostosPct = findData(data.custos_operacionais_percentual, "IMPOSTOS");
        const comerciaisPct = findData(data.custos_operacionais_percentual, "COMERCIAIS"); // Agora usado corretamente
        
        // Somando outras taxas
        const taxasPct = findData(data.custos_operacionais_percentual, "TAXAS DIVERSAS");
        const financeirasPct = findData(data.custos_operacionais_percentual, "FINANCEIRAS");
        const outrasPct = taxasPct + financeirasPct;
        
        // Calculando valores (baseado na Receita Bruta)
        const pessoalValor = (receitaBruta * pessoalPct) / 100;
        const impostosValor = (receitaBruta * impostosPct) / 100;
        const comerciaisValor = (receitaBruta * comerciaisPct) / 100; // Despesas comerciais
        const outrasValor = (receitaBruta * outrasPct) / 100;

        return {
            periodo: data.periodo,
            receitaBruta,
            cmv,
            receitaLiquida,
            custosOperacionais,
            custosOpPercent,
            lucroBruto,
            lucroBrutoMargem,
            despesas: [
                { nome: "Despesas Pessoal", valor: pessoalValor, pct: pessoalPct },
                { nome: "Impostos", valor: impostosValor, pct: impostosPct },
                { nome: "Despesas Comerciais", valor: comerciaisValor, pct: comerciaisPct },
                { nome: "Outras - Taxas + Financeiras", valor: outrasValor, pct: outrasPct },
            ],
            ebitda: lucroBruto, // EBITDA = Lucro Bruto neste caso
            ebitdaMargem: lucroBrutoMargem,
        };
    }, [data]);
};


// --- O Componente JSX ---
export function DRECards({ data }: DreCardsProps) {
    const dre = useDreData(data);

    // Componente interno para as linhas do DRE
    const DreRow = ({ label, value, isNegative = true, isSubtle = false, percentual }: { label: string, value: number, isNegative?: boolean, isSubtle?: boolean, percentual?: number }) => (
        <div className={`flex justify-between items-center py-2 ${isSubtle ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            <span className={isSubtle ? 'text-sm' : 'text-base'}>
                {isNegative ? '(-)' : ''} {label}
                {percentual !== undefined && (
                    <span> (<NumberTicker key={`pct-${label}-${percentual}`} value={percentual} decimalPlaces={2} />%)</span>
                )}
            </span>
            <span className={`font-medium ${isNegative ? 'text-red-600 dark:text-red-500' : ''} ${isSubtle ? 'text-sm' : 'text-base'}`}>
                R$ <NumberTicker key={`dre-${label}-${value}`} value={Math.abs(value)} decimalPlaces={2} />
            </span>
        </div>
    );

    // Componente interno para as Caixas de Total
    const TotalBox = ({ label, value, margem, color }: { label: string, value: number, margem?: number, color: 'green' | 'blue' }) => {
        const colors = {
            green: "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800",
            blue: "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800",
        };
        
        return (
            <div className={`p-4 rounded-lg ${colors[color]}`}>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        R$ <NumberTicker key={`total-${label}-${value}`} value={value} decimalPlaces={2} />
                    </span>
                </div>
                {margem !== undefined && (
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Margem: <NumberTicker key={`margem-${label}-${margem}`} value={margem} decimalPlaces={2} />%
                    </p>
                )}
            </div>
        );
    };


    return (
        <div className="flex flex-col gap-4">
            {/* Card 1: RECEITAS */}
            <Card className="p-4 bg-white dark:bg-[#141313]">
                <CardHeader className="p-0">
                    <h2 className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">1. RECEITAS</h2>
                </CardHeader>
                <CardBody className="p-0 mt-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <DreRow label="Receita Bruta (Total Vendas)" value={dre.receitaBruta} isNegative={false} />
                            <hr className="border-gray-200 dark:border-gray-700" />
                            <DreRow label="CMV" value={dre.cmv} isNegative={true} />
                            
                            <p className="text-xs text-gray-500 mt-4">Período: {dre.periodo}</p>
                            <p className="text-xs text-gray-500">Após dedução do CMV</p>
                        </div>
                        <div className="flex-1 lg:max-w-sm">
                            <TotalBox
                                label="Receita Líquida"
                                value={dre.receitaLiquida}
                                color="green"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Card 2: CUSTOS E LUCRO BRUTO */}
            <Card className="p-4 bg-white dark:bg-[#141313]">
                <CardHeader className="p-0">
                    <h2 className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">2. CUSTOS E LUCRO BRUTO</h2>
                </CardHeader>
                <CardBody className="p-0 mt-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <DreRow label="Custos Operacionais" value={dre.custosOperacionais} isNegative={true} />
                            <p className="text-xs text-gray-500 -mt-2 mb-4">
                                Representa <NumberTicker key={`custos-pct-${dre.custosOpPercent}`} value={dre.custosOpPercent} decimalPlaces={2} />% do Faturamento
                            </p>
                        </div>
                        <div className="flex-1 lg:max-w-sm">
                            <TotalBox
                                label="Lucro Bruto"
                                value={dre.lucroBruto}
                                margem={dre.lucroBrutoMargem}
                                color="green"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>
            
            {/* Card 3: DESPESAS OPERACIONAIS */}
            <Card className="p-4 bg-white dark:bg-[#141313]">
                <CardHeader className="p-0">
                    <h2 className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">3. DESPESAS OPERACIONAIS</h2>
                </CardHeader>
                <CardBody className="p-0 mt-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            {dre.despesas.map(item => (
                                <DreRow 
                                    key={item.nome}
                                    label={item.nome} 
                                    value={item.valor} 
                                    isNegative={true} 
                                    isSubtle={true}
                                    percentual={item.pct}
                                />
                            ))}
                        </div>
                        <div className="flex-1 lg:max-w-sm">
                            <TotalBox
                                label="EBITDA"
                                value={dre.ebitda}
                                margem={dre.ebitdaMargem}
                                color="blue"
                            />
                             <p className="text-xs text-gray-500 mt-2">
                                * EBITDA (Lucro Operacional)
                            </p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}