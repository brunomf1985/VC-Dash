import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { DateFilter, useDataFilter } from '@/hooks/useDataFilter';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useClients } from '@/hooks/useClients';

interface FilterContextType {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  filteredData: any;
  originalData: any;
  isFiltered: boolean;
  availableMonths: Array<{ key: string; label: string; date: Date }>;
  availableClients: Array<{ key: string; label: string }>;
  clearFilters: () => void;
  // Estados da API
  isLoadingApi: boolean;
  apiError: string | null;
  hasData: boolean;
  executeApiRequest: (params: any) => Promise<void>;
  refreshData: () => void;
  // Validação de campos obrigatórios
  hasRequiredFields: boolean;
  missingFields: string[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({});
  const [apiData, setApiData] = useState<any>(null);
  const [hasTriedRequest, setHasTriedRequest] = useState(false); // Nova flag para controlar tentativas
  const { findClientByKey } = useClients();
  
  // Hook da API
  const { loading: isLoadingApi, data: apiResponseData, error: apiError, success: apiSuccess, executeRequest } = useApiRequest();
  
  // Usar apenas dados da API
  const currentData = apiData || {};
  
  const { filteredData, isFiltered, availableMonths, availableClients } = useDataFilter({
    data: currentData,
    dateFilter
  });

  // Quando a API retorna dados com sucesso, salvar
  useEffect(() => {
    if (apiSuccess && apiResponseData) {
      console.log('=== API Data Received ===');
      console.log('Raw API Response:', apiResponseData);
      
      // API can return an envelope like { json: {...} } or { data: {...} }
      const payload = (apiResponseData as any).json ?? (apiResponseData as any).data ?? apiResponseData;
      console.log('Processed payload:', payload);
      
      // Extrair apenas os dados essenciais que realmente usamos
      const essentialFields = [
        'recebimentos',
        'evolucao_resultados_valor', 
        'evolucao_resultados_percentual',
        'custos_operacionais_percentual',
        'faturamento',
        'comparativo_vendas_vs_recebimento', // Necessário para Fluxo de Caixa
        'comparativo_cmv_vs_comerciais', // Necessário para Resultados
        'comparativo_faturamento_projetado_vs_realizado', // Necessário para Resultados
        'comparativo_resultado_operacional_projetado_vs_realizado' // Necessário para Card Resultado vs Projetado
      ];
      
      const optimizedApiData: any = {
        periodo: (payload as any).periodo || "Dados da API",
      };
      
      // Adicionar apenas os campos essenciais
      essentialFields.forEach(field => {
        if (payload[field]) {
          optimizedApiData[field] = payload[field];
        } else {
          // Campos opcionais (podem não existir para alguns clientes)
          const optionalFields = [
            'comparativo_vendas_vs_recebimento',
            'comparativo_cmv_vs_comerciais', 
            'comparativo_faturamento_projetado_vs_realizado',
            'comparativo_resultado_operacional_projetado_vs_realizado'
          ];
          if (optionalFields.includes(field)) {
            console.log(`Campo opcional '${field}' não encontrado (normal para alguns clientes)`);
          } else {
            optimizedApiData[field] = [];
            console.warn(`Campo essencial '${field}' não encontrado nos dados da API`);
          }
        }
      });
      
      // Log dos dados otimizados
      console.log('=== Dados Otimizados ===');
      essentialFields.forEach(field => {
        const count = Array.isArray(optimizedApiData[field]) ? optimizedApiData[field].length : 'N/A';
        console.log(`${field}: ${count} items`);
      });
      
      setApiData(optimizedApiData);
    }
  }, [apiSuccess, apiResponseData]);

  // Função para executar requisição da API com parâmetros
  const executeApiRequest = useCallback(async (params: any) => {
    console.log('Executando requisição API com parâmetros:', params);
    try {
      await executeRequest(params);
    } catch (error: any) {
      // Se o erro for relacionado a campos que não usamos, ignorar e continuar
      const ignorableErrors = ['Ticket Médio', 'TICKET MÉDIO'];
      const isIgnorableError = ignorableErrors.some(ignorable => 
        error.message && error.message.includes(ignorable)
      );
      
      if (isIgnorableError) {
        console.warn('Aviso: Erro em dados não essenciais, continuando:', error.message);
        
        // Criar estrutura mínima apenas com campos essenciais
        const minimalData = {
          periodo: "Dados Parciais da API - Apenas campos essenciais",
          recebimentos: [],
          evolucao_resultados_valor: [],
          evolucao_resultados_percentual: [],
          custos_operacionais_percentual: [],
          faturamento: [],
          message: "Alguns dados opcionais não estão disponíveis"
        };
        
        setApiData(minimalData);
        return;
      }
      // Outros erros devem ser propagados
      throw error;
    }
  }, [executeRequest]);

  // Resetar flag quando cliente mudar
  useEffect(() => {
    setHasTriedRequest(false);
    setApiData(null); // Limpar dados quando cliente mudar
  }, [dateFilter.cliente]);

  // Auto-requisição quando um cliente é selecionado E datas estão preenchidas
  useEffect(() => {
    // CAMPO OBRIGATÓRIO: Verificar se cliente E datas estão preenchidos
    const hasRequiredFields = dateFilter.cliente && 
                             dateFilter.startDate && 
                             dateFilter.endDate;
    
    if (hasRequiredFields && !isLoadingApi && !apiData && !hasTriedRequest) {
      console.log('=== Cliente e datas selecionados, fazendo requisição automática ===');
      console.log('Cliente:', dateFilter.cliente);
      console.log('Data início:', dateFilter.startDate);
      console.log('Data fim:', dateFilter.endDate);
      
      // Marcar que tentamos fazer a requisição
      setHasTriedRequest(true);
      
      // Buscar o cliente pela key para pegar o ID
      const clienteObj = findClientByKey(dateFilter.cliente!); // Safe porque já verificamos acima
      console.log('Cliente encontrado:', clienteObj);
      
      if (clienteObj && dateFilter.startDate && dateFilter.endDate) {
        const defaultParams = {
          clienteId: clienteObj.id, // Usar o ID do cliente
          dataInicio: new Date(dateFilter.startDate), // Usar data obrigatória
          dataFim: new Date(dateFilter.endDate), // Usar data obrigatória
          qtdMeses: 12,
          faturamentoCliente: 0,
          faturamentoCr: 0,
          centroResultado: 0,
          tipoConsulta: 2
        };
        
        console.log('Parâmetros da requisição:', defaultParams);
        executeApiRequest(defaultParams);
      }
    } else if (dateFilter.cliente && (!dateFilter.startDate || !dateFilter.endDate)) {
      // Log quando cliente está selecionado mas faltam datas
      console.log('⚠️ Cliente selecionado mas faltam datas obrigatórias');
      console.log('Cliente:', dateFilter.cliente);
      console.log('Data início:', dateFilter.startDate);
      console.log('Data fim:', dateFilter.endDate);
    }
  }, [dateFilter.cliente, dateFilter.startDate, dateFilter.endDate, findClientByKey, executeApiRequest, isLoadingApi, apiData, hasTriedRequest]);

  // Função para atualizar dados (fazer nova requisição com filtros atuais)
  const refreshData = useCallback(() => {
    // CAMPOS OBRIGATÓRIOS: Cliente E datas devem estar preenchidos
    if (dateFilter.cliente && dateFilter.startDate && dateFilter.endDate) {
      console.log('=== Refresh Data - Campos obrigatórios preenchidos ===');
      const defaultParams = {
        clienteId: parseInt(dateFilter.cliente),
        dataInicio: new Date(dateFilter.startDate), // Data obrigatória
        dataFim: new Date(dateFilter.endDate), // Data obrigatória  
        qtdMeses: 12,
        faturamentoCliente: 0,
        faturamentoCr: 0,
        centroResultado: 0,
        tipoConsulta: 2
      };
      executeApiRequest(defaultParams);
    } else {
      console.warn('⚠️ Refresh Data: Campos obrigatórios faltando');
      console.log('Cliente:', dateFilter.cliente);
      console.log('Data início:', dateFilter.startDate);
      console.log('Data fim:', dateFilter.endDate);
    }
  }, [dateFilter, executeApiRequest]);

  const clearFilters = useCallback(() => {
    setDateFilter({});
  }, []);

  const handleSetDateFilter = useCallback((filter: DateFilter) => {
    setDateFilter(filter);
  }, []);

  // Validação de campos obrigatórios
  const hasRequiredFields = !!(dateFilter.cliente && dateFilter.startDate && dateFilter.endDate);
  const missingFields: string[] = [];
  
  if (!dateFilter.cliente) missingFields.push('Cliente');
  if (!dateFilter.startDate) missingFields.push('Data de Início');
  if (!dateFilter.endDate) missingFields.push('Data de Fim');

  return (
    <FilterContext.Provider
      value={{
        dateFilter,
        setDateFilter: handleSetDateFilter,
        filteredData,
        originalData: currentData,
        isFiltered,
        availableMonths,
        availableClients,
        clearFilters,
        isLoadingApi,
        apiError,
        hasData: !!apiData && !isLoadingApi, // Tem dados da API e não está carregando
        executeApiRequest,
        refreshData,
        hasRequiredFields,
        missingFields
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}