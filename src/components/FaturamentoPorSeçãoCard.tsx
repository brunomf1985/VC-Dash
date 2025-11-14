import React, { useMemo } from 'react'; // Adicionado useMemo
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useFilter } from '@/hooks/useFilter';

// Componentes Card genéricos (mantidos do seu código)
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
);
const CardBody = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
);

const FaturamentoPorSecao: React.FC = () => {
    const { filteredData } = useFilter();

    console.log('=== FaturamentoPorSecao Debug ===');
    console.log('filteredData.vendas_por_secao:', filteredData?.vendas_por_secao);

    if (!filteredData?.vendas_por_secao) {
        console.log('Erro: vendas_por_secao não encontrado');
        return (
            <Card className="bg-white dark:bg-slate-800 shadow-md rounded-lg">
                <CardBody>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
                            Faturamento por Seção
                        </h2>
                        <p className="text-gray-500">Dados de vendas por seção não disponíveis</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // 1. Lógica para encontrar a última data com dados em CADA seção
    const dataBaseUltimoMes = useMemo(() => {
        const mesesMap: { [key: string]: number } = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };

        let ultimaDataEncontrada: Date | null = null;

        // Itera sobre cada seção (ex: 'PADARIA', 'AÇOUGUE', etc)
        for (const secao of filteredData.vendas_por_secao) {
            // Itera sobre todas as chaves dessa seção (ex: 'nome', 'saldo_nov_2025')
            for (const key in secao) {
                if (key.startsWith('saldo_')) {
                    const parts = key.split('_');
                    const valor = Number(secao[key] || 0);

                    if (parts.length === 3 && valor > 0) {
                        const mesAbrev = parts[1];
                        const ano = parseInt(parts[2], 10);
                        const mesIndex = mesesMap[mesAbrev];

                        if (mesIndex !== undefined && !isNaN(ano)) {
                            const dataAtual = new Date(ano, mesIndex, 1);
                            // Atualiza se a data encontrada for mais recente que a já salva
                            if (!ultimaDataEncontrada || dataAtual > ultimaDataEncontrada) {
                                ultimaDataEncontrada = dataAtual;
                            }
                        }
                    }
                }
            }
        }
        // Retorna a data mais recente encontrada, ou 'hoje' se nada for encontrado
        return ultimaDataEncontrada || new Date();
    }, [filteredData]);


    // 2. Substitui a lógica de 'hoje' pela 'dataBase'
    // REMOVIDO: const hoje = new Date();
    // REMOVIDO: const mesAtualDate = new Date(hoje.getFullYear(), hoje.getMonth() - 2);
    // REMOVIDO: const mesAnteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 3);

    // ADICIONADO: O "Mês Atual" é o último mês que encontramos com dados
    const mesAtualDate = dataBaseUltimoMes;
    // ADICIONADO: O "Mês Anterior" é um mês antes desse
    const mesAnteriorDate = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() - 1, 1);

    const nomeMesAtual = mesAtualDate.toLocaleString('pt-BR', { month: 'long' });

    const chaveMesAtual = `saldo_${mesAtualDate.toLocaleString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '')}_${mesAtualDate.getFullYear()}`;
    const chaveMesAnterior = `saldo_${mesAnteriorDate.toLocaleString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '')}_${mesAnteriorDate.getFullYear()}`;
    
    // O resto do seu código funciona como antes, mas agora com as datas corretas
    const vendasOrdenadas = useMemo(() => {
        return [...filteredData.vendas_por_secao].sort((a, b) => {
            const valorA = Number(a[chaveMesAtual] || 0);
            const valorB = Number(b[chaveMesAtual] || 0);
            return valorB - valorA;
        });
    }, [filteredData, chaveMesAtual]);

    return (
        <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
            {/* O título agora mostra o nome do último mês com dados */}
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 capitalize">Faturamento por Seção - {nomeMesAtual}</h3>
            <p className="text-xs text-gray-500 mb-4">Performance de faturamento por seção em {nomeMesAtual}</p>
            <CardBody>
                <div className="space-y-4">
                    {vendasOrdenadas.map((secao) => {
                        const valorAtual = Number(secao[chaveMesAtual] || 0);
                        
                        // Buscar o valor anterior nos dados filtrados (mesmo dataset)
                        const secaoOriginal = filteredData?.vendas_por_secao?.find((s: any) => s.nome === secao.nome);
                        const valorAnterior = Number(secaoOriginal?.[chaveMesAnterior] || 0);

                        let percentual = 0;
                        if (valorAnterior > 0) {
                            percentual = ((valorAtual - valorAnterior) / valorAnterior) * 100;
                        } else if (valorAtual > 0) {
                            percentual = 100;
                        }
                        
                        const cor = percentual > 0 ? 'text-green-500' : percentual < 0 ? 'text-red-500' : 'text-gray-500';
                        const Icone = percentual > 0 ? TrendingUp : TrendingDown;
                        
                        // Oculta seções que não tiveram valor nem no mês atual nem no anterior
                        if (valorAtual === 0 && valorAnterior === 0) {
                            return null;
                        }

                        return (
                            <div key={secao.nome} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{secao.nome}</p>
                                    <p className=" text-gray-400 dark:text-gray-500 mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorAtual)}
                                    </p>
                                </div>
                                <div className={`flex items-center space-x-1 font-bold ${cor}`}>
                                    {/* Mostra '--' se não havia dados para comparar */}
                                    {(valorAnterior > 0 || valorAtual > 0) ? (
                                        <>
                                            <Icone size={16} />
                                            <span>{percentual.toFixed(2)}%</span>
                                        </>
                                    ) : (
                                        <span>--</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
};

export default FaturamentoPorSecao;