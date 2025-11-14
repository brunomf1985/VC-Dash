import { useMemo } from 'react';
import { RegistroFinanceiro } from '@/pages/types';
import { BorderBeam } from './ui/border-beam';
import { useFilter } from '@/hooks/useFilter';

export default function PerformanceSummary() {
    const { filteredData } = useFilter();

    const summaryData = useMemo(() => {
        const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

        const resultadoFinal: RegistroFinanceiro | undefined = filteredData.evolucao_resultados_percentual.find(
            (item: RegistroFinanceiro) => item.nome.trim() === "RESULTADO FINAL"
        );
        const lucroInicial = resultadoFinal?.saldo_jan_2025 ?? 0;
        const lucroFinal = resultadoFinal?.saldo_ago_2025 ?? 0;
        const lucroCrescimento = lucroFinal - lucroInicial;

        const ticketMedioObj: RegistroFinanceiro | undefined = filteredData?.faturamento?.find(
            (item: RegistroFinanceiro) => item.nome?.trim() === "TICKET MÉDIO"
        );
        
        // Proteção para quando não há dados de ticket médio
        const ticketsMensais = ticketMedioObj ? meses.map(m => ticketMedioObj?.[`saldo_${m}_2025`] ?? 0) : [];
        const maiorTicketMedio = ticketsMensais.length > 0 ? Math.max(...ticketsMensais.filter(t => t > 0)) : 0;

        const custosObj: RegistroFinanceiro | undefined = filteredData.custos_operacionais_percentual.find(
            (item: RegistroFinanceiro) => item.nome.trim() === "COMERCIAIS"
        );

        const menorCustoComercial = Object.entries(custosObj || {}).reduce((min, [key, value]) => {
            if (key.startsWith("saldo_") && key !== "saldo_total" && typeof value === 'number' && value > 0) {
                return Math.min(min, value);
            }
            return min;
        }, Infinity);

        return {
            lucroCrescimento,
            maiorTicketMedio,
            menorCustoComercial: menorCustoComercial === Infinity ? 0 : menorCustoComercial
        };
    }, [filteredData]);

    const SummaryItem = ({ value, label, colorClass }: { value: string, label: string, colorClass: string }) => (
        <div className="flex flex-col items-center text-center">
            <p className={`text-4xl lg:text-5xl font-bold ${colorClass}`}>{value}</p>
            <p className="text-sm text-gray-400 mt-2">{label}</p>
        </div>
    );

    return (
        <div className="relative overflow-hidden w-full p-8 rounded-lg 
        bg-gradient-to-r from-blue-100 to-teal-100 text-blue-600 
        dark:bg-gradient-to-r dark:from-blue-950 dark:to-teal-950 dark:text-blue-200 transition-all duration-150 
        shadow-none
        hover:-translate-y-1 hover:shadow-sm"
        >
            <div className="text-left mb-8">
                <h3 className="font-semibold text-lg">Resumo de Performance</h3>
                <p className="text-sm text-gray-400">Principais conquistas do período</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <SummaryItem
                    value={`${summaryData.lucroCrescimento > 0 ? '+' : ''}${summaryData.lucroCrescimento.toFixed(1)}%`}
                    label="Crescimento da margem de lucro"
                    colorClass="text-cyan-400"
                />
                <SummaryItem
                    value={`R$ ${summaryData.maiorTicketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    label="Maior ticket médio do período"
                    colorClass="text-blue-400"
                />
                <SummaryItem
                    value={`${summaryData.menorCustoComercial.toFixed(2)}%`}
                    label="Menor custo comercial do período"
                    colorClass="text-purple-400"
                />
            </div>

            <BorderBeam
                duration={6}
                size={400}
                className="from-transparent via-blue-500 to-transparent"
            />
            <BorderBeam
                duration={6}
                delay={3}
                size={400}
                borderWidth={2}
                className="from-transparent via-blue-500 to-transparent"
            />
        </div>
    );
}
