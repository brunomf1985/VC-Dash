import { Route, Routes } from "react-router-dom";
import Visaofinanceira from "@/pages/dashboards/visaofinanceira";
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
      <Route path="/dashboards/visaofinanceira" element={<Visaofinanceira />} />
      <Route path="/analises" element={<PlaceholderPage title="Análises" />} />
      <Route path="/comparativos" element={<PlaceholderPage title="Comparativos" />} />
      <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
      <Route path="/perfil" element={<PlaceholderPage title="Meu Perfil" />} />
      <Route path="/sair" element={<PlaceholderPage title="Sair" />} />
    </Routes>
  );
}

export default App;