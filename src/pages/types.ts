// src/pages/dashboard/types.ts
export interface Faturamento {
  tipo_registro?: string;
  percent?: string;     
  dre_conta?: number;  
  nome: string;
  saldo_jan_2025: number;
  saldo_fev_2025: number;
  saldo_mar_2025: number;
  saldo_abr_2025: number;
  saldo_mai_2025: number;
  saldo_jun_2025: number;
  saldo_jul_2025: number;
  saldo_ago_2025: number;
  saldo_total?: number;
  media: number;
  media_seg?: number; 
  media_sist?: number;  
}

export interface MonthlyRecord {
  nome: string;
  [key: string]: any;
}