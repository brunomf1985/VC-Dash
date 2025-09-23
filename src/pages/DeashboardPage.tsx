// src/pages/dashboard/DashboardPage.tsx
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import data from './exemplo.json';
import { Faturamento } from "./types";
import { PageTransition } from "@/components/PageTransiotion";

export default function DashboardPage() {
  const receitaTotal = data.recebimentos.find(item => item.nome === "TOTAL RECEBIMENTOS")?.saldo_total || 0;
  const despesas = data.custos_operacionais_percentual.find(item => item.nome === "CUSTO TOTAL")?.saldo_total || 0;
  const lucroOperacional = data.evolucao_resultados_valor.find(item => item.nome === "RESULTADO OPERACIONAL")?.saldo_total || 0;

  const faturamentoColumns: ColDef<Faturamento>[] = [
    { headerName: "Descrição", field: "nome", flex: 2 },
    {
      headerName: "Total",
      field: "saldo_total",
      flex: 1,
      valueFormatter: (p: ValueFormatterParams) => {
        if (p.value == null) return ''; // Retorna string vazia se o valor for nulo/indefinido
        return `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      headerName: "Média Mensal",
      field: "media",
      flex: 1,
      valueFormatter: (p: ValueFormatterParams) => {
        if (p.value == null) return ''; // Retorna string vazia se o valor for nulo/indefinido
        return `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
  ];

  return (
    <DefaultLayout>
       <PageTransition>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="w-full text-center">
          <h1 className={title()}>Dashboard VC</h1>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <h4 className="font-bold text-large">Receita Total</h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">R$ {receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h4 className="font-bold text-large">Despesas</h4>
            </CardHeader>
            <CardBody>
                <p className="text-3xl font-bold">{despesas.toFixed(2)}%</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h4 className="font-bold text-large">Lucro Operacional</h4>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-bold">R$ {lucroOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardBody>
          </Card>
        </div>

        <div className="ag-theme-alpine w-full mt-8" style={{ height: 400 }}>
            <h2 className={title({size: 'sm'})}>Faturamento</h2>
            <AgGridReact
                rowData={data.faturamento}
                columnDefs={faturamentoColumns}
            />
        </div>
      </section>
      </PageTransition>
    </DefaultLayout>
  );
}