import React from 'react';
import { CrownIcon, Award } from 'lucide-react';

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
);
const CardBody = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
);

interface Produto {
    nome: string;
    saldo_total: number;
}

interface TopProdutosCardProps {
    vendas: Produto[];
}

const TopProdutosCard: React.FC<TopProdutosCardProps> = ({ vendas }) => {

    const vendasOrdenadas = [...vendas].sort((a, b) => b.saldo_total - a.saldo_total);

    const getMedalColor = (index: number): string => {
        switch (index) {
            case 0: 
                return 'text-amber-400'; 
            case 1:
                return 'text-slate-400';
            case 2:
                return 'text-yellow-600'; 
            default:
                return 'text-gray-500';
        }
    };

    return (
        <Card className="p-4 bg-white dark:bg-[#1C1C1C] rounded-lg shadow-md min-h-[400px]">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Top Produtos por Faturamento</h3>
            <p className="text-xs text-gray-500 mb-4">Produtos com maior receita no período</p>
            <CardBody>
                <div className='flex justify-between mb-4 font-bold'>
                    <h1>Produtos</h1>
                    <div className='flex items-center gap-2'>
                        <h1>Ranking</h1>
                        <CrownIcon className='text-yellow-300'/>
                    </div>
                </div>
                <div className="space-y-4">
                    {vendasOrdenadas.map((produto, index) => (
                        <div key={produto.nome} className="flex justify-between items-center">
                            <div className='flex gap-1 items-center'>
                                {index < 3  ?
                                    <span className={`relative ${getMedalColor(index)}`}>
                                        <Award size={24} />
                                        <span className='absolute font-bold text-[11px] top-[0.4px] left-[9.0px]'>{index + 1}</span>
                                    </span>
                                    :
                                    <span className='flex text-xs text-gray-800 items-center justify-center rounded-full bg-green-300 w-5 h-5 mr-1'>{index + 1}</span>
                                }
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{produto.nome}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.saldo_total)}
                                </p>
                            </div>  
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};

export default TopProdutosCard;