import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DeashboardPage"; // Importe a nova página
import IndexPage from "@/pages/index";
import DefaultLayout from "./layouts/default";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <DefaultLayout>
      <h1 className="text-4xl font-bold">{title}</h1>
    </DefaultLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      {/* Adicione a nova rota para o dashboard */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/analises" element={<PlaceholderPage title="Análises" />} />
      <Route path="/comparativos" element={<PlaceholderPage title="Comparativos" />} />
      <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
      <Route path="/perfil" element={<PlaceholderPage title="Meu Perfil" />} />
      <Route path="/sair" element={<PlaceholderPage title="Sair" />} />
    </Routes>
  );
}

export default App;