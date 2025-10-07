import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

// Componentes Card genéricos (mantidos do seu código)
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
);
const CardBody = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
);

interface Secao {
    nome: string;
    [key: string]: any; 
}

interface FaturamentoPorSecaoProps {
    vendas: Secao[];
}

const FaturamentoPorSecao: React.FC<FaturamentoPorSecaoProps> = ({ vendas }) => {
    const hoje = new Date();
    const mesAtualDate = new Date(hoje.getFullYear(), hoje.getMonth() -2);
    const mesAnteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 3); 

    const nomeMesAtual = mesAtualDate.toLocaleString('pt-BR', { month: 'long' });
    
    const chaveMesAtual = `saldo_${mesAtualDate.toLocaleString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '')}_${mesAtualDate.getFullYear()}`;
    const chaveMesAnterior = `saldo_${mesAnteriorDate.toLocaleString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '')}_${mesAnteriorDate.getFullYear()}`;
    const vendasOrdenadas = [...vendas].sort((a, b) => {
        const valorA = Number(a[chaveMesAtual] || 0);
        const valorB = Number(b[chaveMesAtual] || 0);
        return valorB - valorA;
    });

    return (
        <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 capitalize">Faturamento por Seção - {nomeMesAtual}</h3>
            <p className="text-xs text-gray-500 mb-4">Performance de faturamento por seção em {nomeMesAtual}</p>
            <CardBody>
                <div className="space-y-4">
                    {vendasOrdenadas.map((secao) => {
                        const valorAtual = Number(secao[chaveMesAtual] || 0);
                        const valorAnterior = Number(secao[chaveMesAnterior] || 0);

                        let percentual = 0;
                        if (valorAnterior > 0) {
                            percentual = ((valorAtual - valorAnterior) / valorAnterior) * 100;
                        } else if (valorAtual > 0) {
                            percentual = 100;
                        }
                        
                        const cor = percentual > 0 ? 'text-green-500' : percentual < 0 ? 'text-red-500' : 'text-gray-500';
                        const Icone = percentual > 0 ? TrendingUp : TrendingDown;
                        return (
                            <div key={secao.nome} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{secao.nome}</p>
                                    <p className=" text-gray-400 dark:text-gray-500 mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorAtual)}
                                    </p>
                                </div>
                                <div className={`flex items-center space-x-1 font-bold ${cor}`}>
                                    {valorAtual > 0 || valorAnterior > 0 ? (
                                      <>
                                        <Icone size={16} />
                                        <span>{percentual.toFixed(2)}%</span>
                                      </>
                                    ) : (
                                      <span>0%</span>
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