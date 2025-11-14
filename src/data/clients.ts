// Lista de clientes com ID e nome para mapeamento
export interface ClientData {
  id: number;
  key: string;
  label: string;
}

export const availableClients: ClientData[] = [
  {
    id: 1,
    key: "SUPERMERCADO GUEDES (2 LOJAS) - UDI",
    label: "SUPERMERCADO GUEDES (2 LOJAS) - UDI"
  },
  {
    id: 2,
    key: "FARMACIA CENTRAL - CENTRO",
    label: "FARMACIA CENTRAL - CENTRO"
  },
  {
    id: 3,
    key: "PADARIA DO JOÃO - BAIRRO",
    label: "PADARIA DO JOÃO - BAIRRO"
  },
  {
    id: 4,
    key: "LOJA DE ROUPAS - SHOPPING",
    label: "LOJA DE ROUPAS - SHOPPING"
  }
];

// Função helper para encontrar cliente por nome/key
export const findClientById = (id: number): ClientData | undefined => {
  return availableClients.find(client => client.id === id);
};

// Função helper para encontrar ID por nome/key
export const findClientByKey = (key: string): ClientData | undefined => {
  return availableClients.find(client => client.key === key);
};