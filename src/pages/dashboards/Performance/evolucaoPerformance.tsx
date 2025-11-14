import Cards from "@/components/Cards"
import { useMemo } from "react"
import { useFilter } from '@/hooks/useFilter';
import { RegistroFinanceiro } from "@/pages/types";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/PageTransiotion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useWatchTheme } from "@/hooks/WatchTheme";
import { CustomTooltip } from "@/components/CustomTooltip";

export default function EvolucaoPerformance() {
    const { filteredData, hasData, isLoadingApi } = useFilter();
    const { isDarkMode } = useWatchTheme();

    // Early return se não há dados disponíveis
    if (isLoadingApi) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando evolução de performance...</p>
                </div>
            </div>
        );
    }

    if (!hasData || !filteredData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">Nenhum dado disponível</p>
                    <p className="text-sm text-gray-400">Faça login e selecione um cliente para carregar dados da API</p>
                </div>
            </div>
        );
    }

    const dataBaseUltimoMes = useMemo(() => {
        const faturamentoData = filteredData?.faturamento?.find(
            (item: any) => item.nome?.trim() === "TOTAL VENDAS"
        );

        // Se não encontrar dados de faturamento, retorna a data de hoje como fallback
        if (!faturamentoData) {
            return new Date();
        }

        // Mapeia os meses em português para números (0-11)
        const mesesMap: { [key: string]: number } = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };

        let ultimaDataEncontrada: Date | null = null;

        // Itera sobre todas as chaves do objeto 'TOTAL VENDAS'
        for (const key in faturamentoData) {
            // Verifica se é uma chave de saldo (ex: 'saldo_nov_2025')
            if (key.startsWith('saldo_')) {
                const parts = key.split('_'); // ['saldo', 'mes', 'ano']

                // Verifica se o valor é maior que 0
                const valor = Number((faturamentoData as any)[key] || 0);

                if (parts.length === 3 && valor > 0) {
                    const mesAbrev = parts[1];
                    const ano = parseInt(parts[2], 10);
                    const mesIndex = mesesMap[mesAbrev];

                    if (mesIndex !== undefined && !isNaN(ano)) {
                        const dataAtual = new Date(ano, mesIndex, 1);

                        // Atualiza a 'ultimaDataEncontrada' se a data_atual for mais recente
                        if (!ultimaDataEncontrada || dataAtual > ultimaDataEncontrada) {
                            ultimaDataEncontrada = dataAtual;
                        }
                    }
                }
            }
        }

        // Retorna a última data encontrada ou a data de hoje como fallback
        return ultimaDataEncontrada || new Date();

    }, [filteredData]); // Depende apenas dos 'filteredData'

    const crescimentoMensal = useMemo(() => {
        // REMOVIDO: const hoje = new Date();

        // ADICIONADO: Usamos a data base como o "mês anterior" da sua lógica original
        const dataMesAnterior = dataBaseUltimoMes;
        // E calculamos o "mês retrasado" com base nela
        const dataMesRetrasado = new Date(dataBaseUltimoMes.getFullYear(), dataBaseUltimoMes.getMonth() - 1, 1);

        const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
            const mesAbrev = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = data.getFullYear();
            return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
        };

        const chaveMesAnterior = criarChaveDoMes(dataMesAnterior);
        const chaveMesRetrasado = criarChaveDoMes(dataMesRetrasado);

        const faturamentoData = filteredData?.faturamento?.find(
            (item: any) => item.nome?.trim() === "TOTAL VENDAS"
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

        // ADICIONADO: dataBaseUltimoMes como dependência
    }, [filteredData, dataBaseUltimoMes]);

    const crescimentoPeriodo = useMemo(() => {
        // REMOVIDO: const hoje = new Date();

        // 1. Define os dois períodos de comparação
        const dataMesAnterior = dataBaseUltimoMes; // Mês anterior da sua lógica = Último mês registrado
        const dataJaneiroEsteAno = new Date(dataBaseUltimoMes.getFullYear(), 0, 1); // Janeiro do ano do último mês

        // 2. Reutiliza sua função helper
        const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
            const mesAbrev = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = data.getFullYear();
            return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
        };

        // 3. Cria as chaves para buscar no JSON
        const chaveMesAnterior = criarChaveDoMes(dataMesAnterior);
        const chaveJaneiroEsteAno = criarChaveDoMes(dataJaneiroEsteAno);

        // 4. Busca a linha de "TOTAL VENDAS"
        const faturamentoData = filteredData?.faturamento?.find(
            (item: any) => item.nome?.trim() === "TOTAL VENDAS"
        );

        // 5. Lógica de fallback
        if (!faturamentoData) {
            return {
                crescimentoPercentual: 0,
                houveCrescimento: false,
                valorMesAnterior: 0,
                valorJaneiro: 0,
                nomeMesAnterior: 'N/A',
                nomeJaneiro: 'N/A',
            };
        }

        // 6. Pega os valores
        const valorMesAnterior = Number((faturamentoData as any)[chaveMesAnterior] || 0);
        const valorJaneiro = Number((faturamentoData as any)[chaveJaneiroEsteAno] || 0);

        // 7. Calcula o percentual
        let crescimentoPercentual = 0;
        if (valorJaneiro > 0) {
            crescimentoPercentual = ((valorMesAnterior * 100) / valorJaneiro) - 100;
        } else if (valorMesAnterior > 0) {
            // Se começou do 0 e agora tem valor, o crescimento é 100% (ou infinito)
            crescimentoPercentual = 100;
        }

        // 8. Formata os nomes para exibição
        const nomeMesAnterior = dataMesAnterior.toLocaleString('pt-BR', { month: 'long' });
        const nomeJaneiro = dataJaneiroEsteAno.toLocaleString('pt-BR', { month: 'long' });

        return {
            crescimentoPercentual: parseFloat(crescimentoPercentual.toFixed(2)),
            houveCrescimento: valorMesAnterior > valorJaneiro,
            valorMesAnterior: valorMesAnterior,
            valorJaneiro: valorJaneiro,
            nomeMesAnterior: nomeMesAnterior.charAt(0).toUpperCase() + nomeMesAnterior.slice(1),
            // Adiciona o ano em Janeiro para clareza
            nomeJaneiro: `${nomeJaneiro.charAt(0).toUpperCase() + nomeJaneiro.slice(1)} ${dataJaneiroEsteAno.getFullYear()}`,
        };

        // ADICIONADO: dataBaseUltimoMes como dependência
    }, [filteredData, dataBaseUltimoMes]);

    const melhorTrimestreAno = useMemo(() => {
        // REMOVIDO: const hoje = new Date();
        const anoAtual = dataBaseUltimoMes.getFullYear(); // ADICIONADO: Usa o ano da data base

        // 1. Reutiliza sua função helper para criar a chave do JSON
        const criarChaveDoMes = (data: Date): keyof RegistroFinanceiro => {
            const mesAbrev = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const ano = data.getFullYear();
            return `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;
        };

        // 2. Encontra a linha de faturamento
        const faturamentoData = filteredData?.faturamento?.find(
            (item: any) => item.nome?.trim() === "TOTAL VENDAS"
        );

        // 3. Função de fallback
        if (!faturamentoData) {
            return {
                nome: 'N/A',
                valor: 0
            };
        }

        // 4. Helper para pegar o valor do mês com segurança
        const getValorMes = (mes: number) => { // mes é 0-indexado (0 = Jan, 1 = Fev)
            const dataMes = new Date(anoAtual, mes, 1);
            const chave = criarChaveDoMes(dataMes);
            return Number((faturamentoData as any)[chave] || 0);
        };

        // 5. Soma os valores para cada trimestre
        const totaisTrimestres = [
            {
                nome: `Q1 ${anoAtual}`,
                valor: getValorMes(0) + getValorMes(1) + getValorMes(2) // Jan+Fev+Mar
            },
            {
                nome: `Q2 ${anoAtual}`,
                valor: getValorMes(3) + getValorMes(4) + getValorMes(5) // Abr+Mai+Jun
            },
            {
                nome: `Q3 ${anoAtual}`,
                valor: getValorMes(6) + getValorMes(7) + getValorMes(8) // Jul+Ago+Set
            },
            {
                nome: `Q4 ${anoAtual}`,
                valor: getValorMes(9) + getValorMes(10) + getValorMes(11) // Out+Nov+Dez
            }
        ];

        // 6. Encontra o trimestre com o maior valor
        const melhorTrimestre = totaisTrimestres.reduce(
            (melhor, atual) => (atual.valor > melhor.valor ? atual : melhor),
            totaisTrimestres[0] // Começa assumindo que Q1 é o melhor
        );

        return {
            nome: melhorTrimestre.nome,
            valor: melhorTrimestre.valor
        };

        // ADICIONADO: dataBaseUltimoMes como dependência
    }, [filteredData, dataBaseUltimoMes]);

    const { data: barChartData, keys: barKeys } = useMemo(() => {
        const secoesData = filteredData?.vendas_por_secao;

        if (!secoesData || secoesData.length === 0) {
            return { data: [], keys: [] };
        }

        const nomesSecoes = secoesData
            .map((secao: any) => secao.nome.trim())
            .filter((nome: string) => nome.toUpperCase() !== 'OUTROS');

        const temOutros = secoesData.some((s: any) => s.nome.trim().toUpperCase() === 'OUTROS');
        if (temOutros) {
            nomesSecoes.push('OUTROS');
        }

        const mesesProcessados = [];
        // REMOVIDO: const hoje = new Date();
        // ADICIONADO: Usamos a data base como referência
        const dataBase = dataBaseUltimoMes;

        for (let i = 11; i >= 0; i--) {
            // CORRIGIDO: O loop agora é relativo à 'dataBase'
            const dataDoPeriodo = new Date(dataBase.getFullYear(), dataBase.getMonth() - i, 1);
            const ano = dataDoPeriodo.getFullYear();

            const mesAbrev = dataDoPeriodo.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const mesAbrevCapitalizado = mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);

            const nomeDoMes = dataDoPeriodo.toLocaleString('pt-BR', { month: 'long' });
            const nomeDoMesCapitalizado = nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);

            const chaveDoMes = `saldo_${mesAbrev}_${ano}` as keyof RegistroFinanceiro;

            const mesProcessado: { [key: string]: string | number } = {
                name: `${mesAbrevCapitalizado} ${ano}`,
                tooltipLabel: `${nomeDoMesCapitalizado} - ${ano}`,
            };

            let totalMes = 0;

            for (const secao of secoesData) {
                const nomeSecao = secao.nome.trim();
                // Processa apenas as seções que listamos em nomesSecoes
                if (nomesSecoes.includes(nomeSecao)) {
                    const valorSecao = Number((secao as any)[chaveDoMes] || 0);
                    mesProcessado[nomeSecao] = parseFloat(valorSecao.toFixed(2));
                    totalMes += valorSecao;
                }
            }

            // Esta lógica de 'totalMes > 0' agora funciona corretamente,
            // pois ela só vai pular meses antigos sem dados,
            // e não os meses futuros que ainda não aconteceram.
            if (totalMes > 0) {
                mesesProcessados.push(mesProcessado);
            }
        }

        return { data: mesesProcessados, keys: nomesSecoes };

        // ADICIONADO: dataBaseUltimoMes como dependência
    }, [filteredData, dataBaseUltimoMes]);

    const tooltipValueFormatter = (value: ValueType,) => {
        if (typeof value === 'number') {

            return new Intl.NumberFormat('pt-BR', {
                compactDisplay: 'long',
                style: 'currency',
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
                currency: 'BRL'
            }).format(value);
        }

        return value;
    };

    const BAR_COLORS = [
        "#3b82f6", // blue-500
        "#10b981", // emerald-500
        "#eab308", // yellow-500
        "#f97316", // orange-500
        "#8b5cf6", // violet-500
        "#ec4899", // pink-500
    ];

    return (
        <PageTransition>
            <div className="w-full mt-6 gap-10">
                {/* Gráfico de Barras para Evolução por Seção */}
                <Card className="p-4 bg-white dark:bg-[#141313] mb-4" style={{ height: "400px" }}>
                    <CardHeader className='grid gap-1'>
                        <p className="text-base font-semibold">Evolução por Seção</p>
                        <p className="text-xs text-gray-500">Faturamento mensal por seção</p>
                    </CardHeader>
                    <CardBody>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barChartData}
                                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                barCategoryGap="20%"
                                barGap={3}
                                className="gap-in-legend"
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                />

                                <XAxis dataKey="name" stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} />
                                <YAxis stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`} />
                                <Tooltip
                                    cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)' }}
                                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                                />
                                <Legend iconType="square" align="left" />

                                {barKeys.map((key: any, index: number) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                        name={key}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}

                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                {/* Futuro talves gráfico */}
                <Card className="p-4 bg-white dark:bg-[#141313] mb-4" style={{ height: "400px" }}>
                    <CardHeader className='grid gap-1'>
                        <p className="text-base font-semibold">Evolução por Seção</p>
                        <p className="text-xs text-gray-500">Faturamento mensal por seção</p>
                    </CardHeader>
                    <CardBody>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barChartData}
                                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                barCategoryGap="20%"
                                barGap={3}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                />

                                <XAxis dataKey="name" stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} />
                                <YAxis stroke={isDarkMode ? "#e0e0e0" : "#333"} axisLine={false} tickLine={false} tickFormatter={(value: number) => `R$${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}`} />
                                <Tooltip
                                    cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)' }}
                                    content={<CustomTooltip valueFormatter={tooltipValueFormatter} />}
                                />
                                <Legend iconType="square" />

                                {barKeys.map((key: any, index: number) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                        name={key}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}

                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
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
                    <Cards
                        title="Crescimento no Período"
                        showSubTitle={false}
                        value={crescimentoPeriodo.crescimentoPercentual}
                        meta={10}
                        showMeta={false}
                        showDescription={true}
                        description={`Crescimento de ${crescimentoPeriodo.nomeMesAnterior} vs ${crescimentoPeriodo.nomeJaneiro}`}
                        isPositive={crescimentoPeriodo.houveCrescimento}
                        Icon={crescimentoPeriodo.houveCrescimento ? TrendingUp : TrendingDown}
                        prefix={crescimentoPeriodo.houveCrescimento && crescimentoPeriodo.crescimentoPercentual > 0 ? '+' : ''}
                        suffix="%"
                        showProgress={true}
                        colors={{
                            card: "p-4 bg-[#dbffe0] dark:bg-gradient-to-br from-[#004b0c] to-[#1f812f]",
                            text: "text-sm text-success-500 dark:text-success-600",
                            icon: "text-green-500",
                            shadowHoverClass: "dark:hover:shadow-success-500/50",
                            progressColor: "bg-success-300"
                        }}
                    />
                    <Cards
                        title="Melhor Trimestre do Ano"
                        showSubTitle={false}
                        value={melhorTrimestreAno.valor}
                        meta={2500000}
                        showMeta={false}
                        showDescription={true}
                        description={melhorTrimestreAno.nome}
                        isPositive={true}
                        Icon={TrendingUp}
                        prefix="R$"
                        showProgress={true}
                        colors={{
                            card: "p-4 bg-[#eedbff] dark:bg-gradient-to-br from-[#20004b] to-[#4d1f81]",
                            text: "text-sm text-secondary-500 dark:text-secondary-600",
                            icon: "text-purple-500",
                            shadowHoverClass: "dark:hover:shadow-secondary-500/50",
                            progressColor: "bg-secondary-300"
                        }}
                    />
                </div>
            </div>
        </PageTransition>
    )
}
