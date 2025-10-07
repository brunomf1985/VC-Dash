// src/components/CustomTooltip.tsx

import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  valueFormatter?: (value: ValueType, name: NameType) => React.ReactNode;
  PONTUACAO_MAXIMA?: number; // Prop para o gráfico de radar
}

export const CustomTooltip = ({ active, payload, label, valueFormatter, PONTUACAO_MAXIMA }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Verificação para o gráfico de Rradar (já existente)
    const isRadarPayload = payload[0]?.payload?.details;
    if (isRadarPayload) {
      // ... (toda a sua lógica para o tooltip do radar continua aqui)
      // ... (sem alterações necessárias nesta parte)
    }

    // Lógica padrão para gráficos de Linha, Barra e Pizza
    const headerLabel = payload[0].payload.tooltipLabel || payload[0].name || label;
    
    return (
      <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-200 text-black rounded-lg shadow-lg text-sm dark:from-gray-700 dark:to-gray-900 dark:border-gray-600 dark:text-white">
        {/* Para PieChart, o `headerLabel` pode não ser o mais útil, então podemos customizar */}
        <p className="font-bold mb-2 text-base">{headerLabel}</p>
        <ul className="list-none p-0 m-0">
          {payload.map((pld, index) => {
            if (pld.value === undefined || pld.name === undefined) return null;

            const formattedValue = valueFormatter 
                ? valueFormatter(pld.value, pld.name) 
                : pld.value;

            return (
              <li key={index} style={{ color: pld.payload.fill || pld.color }} className="flex items-center justify-between">
                <span>{`${pld.name}:`}</span>
                <span className="font-bold ml-4">{formattedValue}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return null;
};