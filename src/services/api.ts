// Serviço de API para comunicação com o backend
export interface ApiRequestData {
  data_inicio: string; // formato: dd.mm.yyyy
  data_fim: string; // formato: dd.mm.yyyy
  cliente: number; // ID do cliente
  qtd_meses: number;
  faturamento_cliente: number;
  faturamento_cr: number;
  cr: number;
  tipoConsulta: number;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class ApiService {
  private readonly baseUrl = 'https://wmsapp.vallysys.com.br:9000';
  private readonly timeout = 300000; // 5 minutos

  // Método principal para fazer a requisição
  async getData(requestData: ApiRequestData): Promise<ApiResponse> {
    try {
      console.log("=== DEBUG REQUISIÇÃO API ===");
      console.log("URL:", `${this.baseUrl}/rel_resumo_ia/getData`);
      console.log("Payload sendo enviado:", JSON.stringify(requestData, null, 2));
      console.log("Tipos dos campos:");
      Object.entries(requestData).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = ${value}`);
      });
      console.log("===========================");

      const response = await fetch(`${this.baseUrl}/rel_resumo_ia/getData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(this.timeout),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Response error body:", errorText);
        
        // Se o erro for sobre "Ticket Médio", tentar continuar com dados parciais
        if (errorText.includes('Ticket Médio')) {
          console.warn('Erro relacionado ao Ticket Médio, tentando continuar com dados parciais');
          return {
            success: false,
            error: `Dados de Ticket Médio não disponíveis: ${errorText}`,
          };
        }
        
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error('Erro na requisição API:', error);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Timeout na requisição (5 minutos)';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Erro de conexão com o servidor';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Método helper para formatar datas no formato dd.mm.yyyy
  static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Método helper para criar o payload da requisição
  static createRequestData(params: {
    dataInicio: Date;
    dataFim: Date;
    clienteId: number; // agora espera ID numérico
    qtdMeses: number;
    faturamentoCliente: number;
    faturamentoCr: number;
    centroResultado?: number;
    tipoConsulta?: number;
  }): ApiRequestData {
    console.log("=== DEBUG createRequestData ===");
    console.log("Parâmetros recebidos:", params);
    
    // Validação básica apenas para campos obrigatórios
    if (!params.dataInicio || !params.dataFim) {
      console.error("Datas obrigatórias estão ausentes!");
      throw new Error("Datas de início e fim são obrigatórias");
    }
    
    if (typeof params.clienteId !== 'number') {
      console.error("ClienteId deve ser um número:", params.clienteId);
      throw new Error("ID do cliente deve ser um número");
    }
    
    const payload = {
      data_inicio: this.formatDate(params.dataInicio),
      data_fim: this.formatDate(params.dataFim),
      cliente: params.clienteId,
      qtd_meses: params.qtdMeses || 12,
      faturamento_cliente: params.faturamentoCliente || 0,
      faturamento_cr: params.faturamentoCr || 0,
      cr: params.centroResultado ?? 0, // Usar ?? para permitir 0 explícito
      tipoConsulta: params.tipoConsulta || 2,
    };
    
    console.log("Payload criado:", payload);
    console.log("=== FIM DEBUG createRequestData ===");
    
    return payload;
  }
}

export { ApiService };
export const apiService = new ApiService();