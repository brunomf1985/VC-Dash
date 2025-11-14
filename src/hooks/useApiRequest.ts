import { useState, useCallback } from 'react';
import { apiService, ApiService } from '@/services/api';

export interface UseApiRequestState {
  loading: boolean;
  data: any | null;
  error: string | null;
  success: boolean;
}

export interface UseApiRequestParams {
  dataInicio: Date;
  dataFim: Date;
  clienteId: number;
  qtdMeses: number;
  faturamentoCliente: number;
  faturamentoCr: number;
  centroResultado?: number;
  tipoConsulta?: number;
}

export function useApiRequest() {
  const [state, setState] = useState<UseApiRequestState>({
    loading: false,
    data: null,
    error: null,
    success: false,
  });

  const executeRequest = useCallback(async (params: UseApiRequestParams) => {
    // Reset do estado
    setState({
      loading: true,
      data: null,
      error: null,
      success: false,
    });

    try {
      // Criar payload da requisição
      // ApiService.createRequestData expects clienteId numeric
      const requestData = ApiService.createRequestData({
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
        clienteId: params.clienteId,
        qtdMeses: params.qtdMeses,
        faturamentoCliente: params.faturamentoCliente,
        faturamentoCr: params.faturamentoCr,
        centroResultado: params.centroResultado,
        tipoConsulta: params.tipoConsulta,
      });
      
      // Executar requisição
      const response = await apiService.getData(requestData);
      
      if (response.success) {
        setState({
          loading: false,
          data: response.data,
          error: null,
          success: true,
        });
      } else {
        setState({
          loading: false,
          data: null,
          error: response.error || 'Erro na requisição',
          success: false,
        });
      }
    } catch (error: any) {
      setState({
        loading: false,
        data: null,
        error: error.message || 'Erro inesperado',
        success: false,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      data: null,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    executeRequest,
    reset,
  };
}