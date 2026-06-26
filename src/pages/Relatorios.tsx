import { useState } from 'react';
import { FileDown, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientes } from '@/hooks/useClientes';
import { useVendas } from '@/hooks/useVendas';
import { useProdutos } from '@/hooks/useProdutos';
import { Cliente, Venda, Produto } from '@/types';
import { exportClientes, exportVendas, exportProdutos } from '@/utils/excelExport';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export const Relatorios = () => {
  const [clientes] = useClientes();
  const [vendas] = useVendas();
  const [produtos] = useProdutos();
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30');
  const { toast } = useToast();

  // Filtrar vendas por período
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - parseInt(periodoSelecionado));
  const vendasPeriodo = vendas.filter(v => new Date(v.dataVenda) >= dataLimite);

  // Dados para gráficos
  const vendasPorMes = vendasPeriodo.reduce((acc: any, venda) => {
    const mes = new Date(venda.dataVenda).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    acc[mes] = (acc[mes] || 0) + venda.total;
    return acc;
  }, {});

  const dadosVendasMes = Object.entries(vendasPorMes).map(([mes, total]) => ({
    mes,
    total
  }));

  const vendasPorCategoria = produtos.reduce((acc: any, produto) => {
    const vendasProduto = vendasPeriodo.filter(v => 
      v.produtos.some(p => p.produtoId === produto.id)
    );
    const totalVendas = vendasProduto.reduce((sum, v) => sum + v.total, 0);
    
    if (totalVendas > 0) {
      acc[produto.categoria] = (acc[produto.categoria] || 0) + totalVendas;
    }
    return acc;
  }, {});

  const dadosCategoria = Object.entries(vendasPorCategoria).map(([categoria, valor]) => ({
    name: categoria,
    value: valor
  }));

  const clientesTopCompras = clientes
    .sort((a, b) => b.totalCompras - a.totalCompras)
    .slice(0, 5)
    .map(cliente => ({
      nome: cliente.nome,
      total: cliente.totalCompras
    }));

  const handleExportAll = () => {
    let sucessos = 0;
    
    if (exportClientes(clientes)) sucessos++;
    if (exportVendas(vendas, clientes)) sucessos++;
    if (exportProdutos(produtos)) sucessos++;
    
    if (sucessos === 3) {
      toast({
        title: "Exportação completa",
        description: "Todos os relatórios foram exportados com sucesso!",
      });
    } else {
      toast({
        title: "Exportação parcial",
        description: `${sucessos} de 3 relatórios foram exportados.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportAll}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      {/* Resumo do Período */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendasPeriodo.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {periodoSelecionado} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendasPeriodo.reduce((acc, v) => acc + v.total, 0).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendasPeriodo.length > 0 
                ? (vendasPeriodo.reduce((acc, v) => acc + v.total, 0) / vendasPeriodo.length).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })
                : 'R$ 0,00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {vendasPeriodo.length > 0 
                ? ((vendasPeriodo.filter(v => v.status === 'paga').length / vendasPeriodo.length) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas pagas vs total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosVendasMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Faturamento'
                ]} />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Faturamento'
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clientesTopCompras.length > 0 ? (
            <div className="space-y-4">
              {clientesTopCompras.map((cliente, index) => (
                <div key={cliente.nome} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{cliente.nome}</span>
                  </div>
                  <span className="font-bold">
                    {cliente.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente cadastrado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};