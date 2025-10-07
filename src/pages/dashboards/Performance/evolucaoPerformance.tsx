import Cards from "@/components/Cards"
import { useMemo } from "react"
import data from "../../exemplo.json"
import { RegistroFinanceiro } from "@/pages/types";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/PageTransiotion";

export default function EvolucaoPerformance() {
    const crescimentoMensal = useMemo(() => {
        const hoje = new Date();

        const dataMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const dataMesRetrasado = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);

        const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
            const mesAbrev = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = data.getFullYear();
            return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
        };

        const chaveMesAnterior = criarChaveDoMes(dataMesAnterior);
        const chaveMesRetrasado = criarChaveDoMes(dataMesRetrasado);

        const faturamentoData = data.faturamento.find(
            (item) => item.nome.trim() === "TOTAL VENDAS"
        );
        if (!faturamentoData) {
            return {
                crescimentoPercentual: 0,
                houveCrescimento: false,
                valorMesAnterior: 0,
                valorMesRetrasado: 0,
                nomeMesAnterior: 'N/A',
                nomeMesRetrasado: 'N/A',
            };
        }

        const valorMesAnterior = Number((faturamentoData as any)[chaveMesAnterior] || 0);
        const valorMesRetrasado = Number((faturamentoData as any)[chaveMesRetrasado] || 0);

        let crescimentoPercentual = 0;
        if (valorMesRetrasado > 0) {
            crescimentoPercentual = ((valorMesAnterior * 100) / valorMesRetrasado) - 100;
        } else if (valorMesAnterior > 0) {
            crescimentoPercentual = 100;
        }

        const nomeMesAnterior = dataMesAnterior.toLocaleString('pt-BR', { month: 'long' });
        const nomeMesRetrasado = dataMesRetrasado.toLocaleString('pt-BR', { month: 'long' });

        return {
            crescimentoPercentual: parseFloat(crescimentoPercentual.toFixed(2)),
            houveCrescimento: valorMesAnterior > valorMesRetrasado,
            valorMesAnterior: valorMesAnterior,
            valorMesRetrasado: valorMesRetrasado,
            nomeMesAnterior: nomeMesAnterior.charAt(0).toUpperCase() + nomeMesAnterior.slice(1),
            nomeMesRetrasado: nomeMesRetrasado.charAt(0).toUpperCase() + nomeMesRetrasado.slice(1),
        };
    }, [data]);

    return (
        <PageTransition>
            <div className="w-full mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Cards
                        title="Crescimento Mensal"
                        showSubTitle={false}
                        value={crescimentoMensal.crescimentoPercentual}
                        meta={10}
                        showMeta={false}
                        showDescription={true}
                        description={`Crescimento de ${crescimentoMensal.nomeMesAnterior} vs ${crescimentoMensal.nomeMesRetrasado}`}
                        isPositive={crescimentoMensal.houveCrescimento}
                        Icon={crescimentoMensal.houveCrescimento ? TrendingUp : TrendingDown}
                        prefix={crescimentoMensal.houveCrescimento && crescimentoMensal.crescimentoPercentual > 0 ? '+' : ''}
                        suffix="%"
                        showProgress={true}
                        colors={{
                            card: "p-4 bg-[#dbf2ff] dark:bg-gradient-to-br from-[#00184b] to-[#1f2681]",
                            text: "text-sm text-primary-500 dark:text-primary-600",
                            icon: "text-blue-500",
                            shadowHoverClass: "dark:hover:shadow-primary-500/50",
                            progressColor: "bg-primary-300"
                        }}
                    />
                </div>
            </div>
        </PageTransition>
    )
}   