import { Route, Routes } from "react-router-dom";

import Perfil from "./pages/Perfil/perfil";
import DefaultLayout from "./layouts/default";
import Login from "./pages/Login/login";

import IndexPage from "@/pages/index";
import Visaofinanceira from "@/pages/dashboards/visaofinanceira";

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
      <Route element={<Login />} path="*" />
      <Route element={<Visaofinanceira />} path="/dashboards/visaofinanceira" />
      <Route element={<PlaceholderPage title="Análises" />} path="/analises" />
      <Route
        element={<PlaceholderPage title="Comparativos" />}
        path="/comparativos"
      />
      <Route
        element={<PlaceholderPage title="Relatórios" />}
        path="/relatorios"
      />
      <Route element={<Perfil />} path="/Perfil/perfil" />
    </Routes>
  );
}

export default App;
