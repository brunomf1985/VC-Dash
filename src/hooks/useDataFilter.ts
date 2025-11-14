import { useMemo } from 'react';
import { useClients } from './useClients';

export interface DateFilter {
  startDate?: string;
  endDate?: string;
  cliente?: string;
}

export interface UseDataFilterProps {
  data: any;
  dateFilter: DateFilter;
}

export interface FilteredData {
  originalData: any;
  filteredData: any;
  isFiltered: boolean;
  availableMonths: Array<{ key: string; label: string; date: Date }>;
  availableClients: Array<{ key: string; label: string }>;
}

// Helper para extrair meses disponíveis dos dados
const extractAvailableMonths = (data: any): Array<{ key: string; label: string; date: Date }> => {
  const months: Array<{ key: string; label: string; date: Date }> = [];
  
  
  const extractFromDataSet = (dataSet: any) => {
    // Primeiro tentar faturamento, depois custos_operacionais_percentual, depois evolucao_resultados_valor
    let sourceData = null;
    
    if (dataSet.faturamento && dataSet.faturamento.length > 0) {
      sourceData = dataSet.faturamento[0];
    } else if (dataSet.custos_operacionais_percentual && dataSet.custos_operacionais_percentual.length > 0) {
      sourceData = dataSet.custos_operacionais_percentual[0];
    } else if (dataSet.evolucao_resultados_valor && dataSet.evolucao_resultados_valor.length > 0) {
      sourceData = dataSet.evolucao_resultados_valor[0];
    }
    
    if (sourceData) {

      
      // Extrair todas as chaves que seguem o padrão saldo_mes_ano
      Object.keys(sourceData).forEach(key => {
        const match = key.match(/^saldo_([a-z]+)_(\d{4})$/);
        if (match) {

          const [, mesAbrev, ano] = match;
          
          // Converter abreviação do mês para número
          const mesesMap: { [key: string]: number } = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
          };
          
          const mesNumero = mesesMap[mesAbrev];
          if (mesNumero !== undefined) {
            const date = new Date(parseInt(ano), mesNumero, 1);
            const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            
            // Verificar se já existe para evitar duplicatas
            if (!months.some(m => m.key === key)) {
              months.push({
                key: key,
                label: label.charAt(0).toUpperCase() + label.slice(1),
                date: date
              });

            }
          }
        }
      });
      

    } else {
      console.warn("Nenhum dataset válido encontrado para extrair meses");
    }
  };
  
  // Se data é um array, processar cada item
  if (Array.isArray(data)) {
    data.forEach(extractFromDataSet);
  } else {
    // Se data é um objeto único
    extractFromDataSet(data);
  }
  
  // Ordenar por data
  return months.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Helper para filtrar dados baseado no período e cliente
const filterDataByPeriod = (data: any, startDate?: string, endDate?: string, cliente?: string) => {
  if (!startDate && !endDate && !cliente) {
    return data; // Retorna dados originais se não há filtro
  }
  
  let filteredData = JSON.parse(JSON.stringify(data)); // Deep clone
  
  // Filtro por cliente (se especificado)
  if (cliente) {
    // Se data é um array de clientes
    if (Array.isArray(data)) {
      const clienteData = data.find(item => item.cliente === cliente);
      if (clienteData) {
        filteredData = JSON.parse(JSON.stringify(clienteData));
      } else {
        // Cliente não encontrado, retornar estrutura vazia
        return {
          cliente: cliente,
          periodo: "Cliente não encontrado",
          faturamento: [],
          recebimentos: [],
          evolucao_resultados_valor: [],
          evolucao_resultados_percentual: [],
          custos_operacionais_percentual: [],
          vendas_por_secao: [],
          vendas_por_produto: [],
          vendas_por_hora: [],
          vendas_por_dia_da_semana: [],
          comparativo_vendas_vs_recebimento: [],
          comparativo_cmv_vs_comerciais: [],
          comparativo_faturamento_projetado_vs_realizado: [],
          comparativo_margem_contribuicao_projetado_vs_realizado: [],
          comparativo_resultado_operacional_projetado_vs_realizado: []
        };
      }
    } else {
      // Se data é um objeto único, simular dados para clientes diferentes
      if (data.cliente !== cliente) {
        // Gerar dados simulados para o cliente selecionado
        const fatorMultiplicador = cliente === "FARMACIA CENTRAL - CENTRO" ? 0.6 : 
                                 cliente === "PADARIA DO JOÃO - BAIRRO" ? 0.3 : 
                                 cliente === "LOJA DE ROUPAS - SHOPPING" ? 0.8 : 1;
        
        // Clonar e modificar os dados
        const simulatedData = JSON.parse(JSON.stringify(data));
        simulatedData.cliente = cliente;
        simulatedData.segmento = cliente === "FARMACIA CENTRAL - CENTRO" ? "FARMACIA" : 
                               cliente === "PADARIA DO JOÃO - BAIRRO" ? "PADARIA" : 
                               cliente === "LOJA DE ROUPAS - SHOPPING" ? "VESTUARIO" : data.segmento;
        
        // Modificar todos os valores monetários aplicando o fator
        const sectionsToModify = [
          'faturamento',
          'recebimentos', 
          'evolucao_resultados_valor',
          'custos_operacionais_percentual',
          'vendas_por_secao',
          'vendas_por_produto',
          'comparativo_vendas_vs_recebimento',
          'comparativo_cmv_vs_comerciais',
          'comparativo_faturamento_projetado_vs_realizado',
          'comparativo_margem_contribuicao_projetado_vs_realizado',
          'comparativo_resultado_operacional_projetado_vs_realizado'
        ];
        
        sectionsToModify.forEach(section => {
          if (simulatedData[section] && Array.isArray(simulatedData[section])) {
            simulatedData[section] = simulatedData[section].map((item: any) => {
              const modifiedItem = { ...item };
              Object.keys(item).forEach(key => {
                if (key.startsWith('saldo_') && typeof item[key] === 'number') {
                  modifiedItem[key] = Math.round(item[key] * fatorMultiplicador);
                }
              });
              return modifiedItem;
            });
          }
        });
        
        filteredData = simulatedData;
      }
    }
  }
  
  // Se temos filtros, aplicar em todas as seções que têm dados mensais
  // EXCLUIR comparativos da filtragem pois são cálculos agregados já prontos da API
  const sectionsToFilter = [
    'faturamento',
    'recebimentos', 
    'evolucao_resultados_valor',
    'evolucao_resultados_percentual',
    'custos_operacionais_percentual',
    'vendas_por_secao',
    'vendas_por_produto',
    'vendas_por_hora',
    'vendas_por_dia_da_semana'
  ];

  const comparativeFields = [
    'comparativo_vendas_vs_recebimento',
    'comparativo_cmv_vs_comerciais',
    'comparativo_faturamento_projetado_vs_realizado',
    'comparativo_margem_contribuicao_projetado_vs_realizado',
    'comparativo_resultado_operacional_projetado_vs_realizado'
  ];

    comparativeFields.forEach(field => {
    if (data[field]) {
      filteredData[field] = JSON.parse(JSON.stringify(data[field])); // Deep clone
    }
  });
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  sectionsToFilter.forEach(section => {
    if (filteredData[section] && Array.isArray(filteredData[section])) {
      filteredData[section] = filteredData[section].map((item: any) => {
        const filteredItem = { ...item };
        let totalFiltrado = 0;
        let countMeses = 0;
        
        // Filtrar campos de saldo mensal
        Object.keys(item).forEach(key => {
          const match = key.match(/^saldo_([a-z]+)_(\d{4})$/);
          if (match) {
            const [, mesAbrev, ano] = match;
            
            // Converter para data para comparação
            const mesesMap: { [key: string]: number } = {
              'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
              'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
            };
            
            const mesNumero = mesesMap[mesAbrev];
            if (mesNumero !== undefined) {
              const dataDoMes = new Date(parseInt(ano), mesNumero, 1);
              
              // Verificar se a data está dentro do filtro
              const dentroDoFiltro = (!start || dataDoMes >= start) && 
                                   (!end || dataDoMes <= end);
              
              if (dentroDoFiltro) {
                totalFiltrado += Number(item[key] || 0);
                countMeses++;
              } else {
                // Se não está no filtro, REMOVER a chave completamente
                delete filteredItem[key];
              }
            }
          }
        });
        
        // Recalcular totais e médias
        if (countMeses > 0) {
          filteredItem.saldo_total = totalFiltrado;
          filteredItem.media = totalFiltrado / countMeses;
        } else {
          filteredItem.saldo_total = 0;
          filteredItem.media = 0;
        }
        
        return filteredItem;
      });
    }
  });
  
  if (start && end) {
    const startStr = start.toLocaleDateString('pt-BR');
    const endStr = end.toLocaleDateString('pt-BR');
    filteredData.periodo = `${startStr} a ${endStr}`;
  } else if (start) {
    filteredData.periodo = `A partir de ${start.toLocaleDateString('pt-BR')}`;
  } else if (end) {
    filteredData.periodo = `Até ${end.toLocaleDateString('pt-BR')}`;
  }
  
  return filteredData;
};

export const useDataFilter = ({ data, dateFilter }: UseDataFilterProps): FilteredData => {
  const { clients } = useClients();
  
  return useMemo(() => {
    const availableMonths = extractAvailableMonths(data);
    // Usar clientes do contexto de autenticação
    const availableClients = clients.map(client => ({
      key: client.key,
      label: client.label
    }));
    
    const isFiltered = !!(dateFilter.startDate || dateFilter.endDate || dateFilter.cliente);
    
    const filteredData = filterDataByPeriod(
      data, 
      dateFilter.startDate, 
      dateFilter.endDate,
      dateFilter.cliente
    );
    
    return {
      originalData: data,
      filteredData,
      isFiltered,
      availableMonths,
      availableClients
    };
  }, [data, dateFilter.startDate, dateFilter.endDate, dateFilter.cliente, clients]);
};