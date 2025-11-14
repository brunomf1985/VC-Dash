# 📡 Implementação de Requisições API - VC Dashboard

Esta implementação permite fazer requisições para a API externa seguindo o padrão Delphi fornecido.

## 🔧 **Estrutura Criada**

### 1. **Serviço de API** (`/src/services/api.ts`)
```typescript
// Exemplo de uso direto
import { apiService, ApiService } from '@/services/api';

const requestData = ApiService.createRequestData({
  dataInicio: new Date('2025-01-01'),
  dataFim: new Date('2025-08-31'),
  clienteId: 1, // ID numérico do cliente
  qtdMeses: 8,
  faturamentoCliente: 150000.50,
  faturamentoCr: 200000.00,
  centroResultado: 0, // Use 0 para evitar erros - outros valores podem não estar configurados no backend
  tipoConsulta: 2
});

const response = await apiService.getData(requestData);
```

### 2. **Hook Reativo** (`/src/hooks/useApiRequest.ts`)
```typescript
// Exemplo de uso no componente
import { useApiRequest } from '@/hooks/useApiRequest';

function MeuComponente() {
  const { loading, data, error, success, executeRequest, reset } = useApiRequest();

  const handleRequest = async () => {
    await executeRequest({
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2025-08-31'),
      clienteId: 1, // ID numérico do cliente
      qtdMeses: 8,
      faturamentoCliente: 100000,
      faturamentoCr: 120000,
      centroResultado: 0, // Sempre use 0 - backend pode não aceitar outros valores
      tipoConsulta: 2
    });
  };

  return (
    <div>
      <button onClick={handleRequest} disabled={loading}>
        {loading ? 'Carregando...' : 'Executar'}
      </button>
      
      {success && <div>Sucesso: {JSON.stringify(data)}</div>}
      {error && <div>Erro: {error}</div>}
    </div>
  );
}
```

## 📦 **Payloads da Requisição**

### **Estrutura do JSON enviado:**
```json
{
  "data_inicio": "01.01.2025",
  "data_fim": "31.08.2025", 
  "cliente": 1,
  "qtd_meses": 8,
  "faturamento_cliente": 150000.50,
  "faturamento_cr": 200000.00,
  "cr": 123,
  "tipoConsulta": 2
}
```

### **Endpoint:**
- **URL**: `https://wmsapp.vallysys.com.br:9000/rel_resumo_ia/getData`
- **Method**: POST
- **Content-Type**: application/json
- **Accept**: application/json
- **Timeout**: 300000ms (5 minutos)

## 🎯 **Integração com Filtros Existentes**

O exemplo em `ApiRequestExample.tsx` mostra como integrar com o sistema de filtros:

```typescript
import { useFilter } from '@/hooks/useFilter';
import { useApiRequest } from '@/hooks/useApiRequest';

function ComponenteIntegrado() {
  const { filteredData, dateFilter } = useFilter();
  const { executeRequest } = useApiRequest();
  
  // Extrai dados automáticamente dos filtros
  const faturamentoCliente = filteredData.faturamento?.find(
    (item: any) => item.nome.trim() === 'TOTAL VENDAS'
  )?.saldo_total || 0;
  
  const handleRequest = () => {
    executeRequest({
      dataInicio: new Date(dateFilter.startDate || '2025-01-01'),
      dataFim: new Date(dateFilter.endDate || '2025-08-31'),
      cliente: 'Cliente Selecionado',
      qtdMeses: 8,
      faturamentoCliente,
      faturamentoCr: 200000,
    });
  };
}
```

## 🔄 **Estados da Requisição**

| Estado | Descrição | Quando Usar |
|--------|-----------|-------------|
| `loading` | Requisição em andamento | Mostrar spinner/loading |
| `success` | Requisição bem-sucedida | Exibir dados retornados |
| `error` | Erro na requisição | Mostrar mensagem de erro |
| `data` | Dados retornados | Processar resposta da API |

## 🚀 **Como Usar em Qualquer Componente**

### **1. Importar o hook:**
```typescript
import { useApiRequest } from '@/hooks/useApiRequest';
```

### **2. Usar no componente:**
```typescript
const { loading, data, error, success, executeRequest } = useApiRequest();
```

### **3. Executar requisição:**
```typescript
await executeRequest({
  dataInicio: new Date('2025-01-01'),
  dataFim: new Date('2025-08-31'),
  clienteId: 1, // ID numérico do cliente
  qtdMeses: 8,
  faturamentoCliente: 100000,
  faturamentoCr: 120000,
  centroResultado: 0, // SEMPRE usar 0 para evitar erro 500
});
```

## ⚠️ **Tratamento de Erros**

A implementação trata automaticamente:

- **Timeout**: 5 minutos de timeout
- **Erro de Conexão**: Problemas de rede
- **HTTP Status**: Status codes de erro
- **JSON inválido**: Resposta mal formatada

## 🧪 **Página de Teste**

Acesse `/api-test` para ver um exemplo completo funcionando com:
- ✅ Integração com filtros
- ✅ Validação de campos
- ✅ Estados de loading/error/success
- ✅ Exibição da resposta da API

## 🔧 **Customização**

### **Alterar URL base:**
```typescript
// Em /src/services/api.ts
private readonly baseUrl = 'https://sua-nova-url.com';
```

### **Alterar timeout:**
```typescript
// Em /src/services/api.ts
private readonly timeout = 60000; // 1 minuto
```

### **Adicionar headers personalizados:**
```typescript
// Em /src/services/api.ts
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer token',
  'Custom-Header': 'valor'
},
```

---

## 🎯 **Próximos Passos**

1. **Testar** a implementação na página `/api-test`
2. **Integrar** nos dashboards existentes conforme necessário
3. **Personalizar** campos e validações específicas
4. **Adicionar** novos endpoints seguindo o mesmo padrão