import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Clientes } from "./pages/Clientes";
import { Vendas } from "./pages/Vendas";
import { Estoque } from "./pages/Estoque";
import { Relatorios } from "./pages/Relatorios";
import { ExportarDados } from "./pages/ExportarDados";
import { Configuracoes } from "./pages/Configuracoes";
import { ConectarWhatsApp } from "./pages/ConectarWhatsApp";
import { Agendamentos } from "./pages/Agendamentos";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/clientes" element={<Protected><Clientes /></Protected>} />
            <Route path="/vendas" element={<Protected><Vendas /></Protected>} />
            <Route path="/estoque" element={<Protected><Estoque /></Protected>} />
            <Route path="/relatorios" element={<Protected><Relatorios /></Protected>} />
            <Route path="/exportar" element={<Protected><ExportarDados /></Protected>} />
            <Route path="/configuracoes" element={<Protected><Configuracoes /></Protected>} />
            <Route path="/whatsapp" element={<Protected><ConectarWhatsApp /></Protected>} />
            <Route path="/agendamentos" element={<Protected><Agendamentos /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
