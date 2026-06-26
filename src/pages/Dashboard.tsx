import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientes } from '@/hooks/useClientes';
import { useVendas } from '@/hooks/useVendas';
import { useProdutos } from '@/hooks/useProdutos';
import { Cliente, Venda, Produto, KPI } from '@/types';
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--warning))'];

export const Dashboard = () => {
  const [clientes] = useClientes();
  const [vendas] = useVendas();
  const [produtos] = useProdutos();
  const [kpis, setKpis] = useState<KPI>({
    vendaTotal: 0,
    vendasHoje: 0,
    clientesTotal: 0,
    produtosEstoqueBaixo: 0,
    ticketMedio: 0,
    metaMensal: 50000
  });

  useEffect(() => {
    // Calcular KPIs
    const hoje = new Date().toDateString();
    const vendasHoje = vendas.filter(v => new Date(v.dataVenda).toDateString() === hoje);
    const vendaTotal = vendas.reduce((acc, v) => acc + v.total, 0);
    const ticketMedio = vendas.length > 0 ? vendaTotal / vendas.length : 0;
    const produtosEstoqueBaixo = produtos.filter(p => p.estoque < 10).length;

    setKpis({
      vendaTotal,
      vendasHoje: vendasHoje.reduce((acc, v) => acc + v.total, 0),
      clientesTotal: clientes.length,
      produtosEstoqueBaixo,
      ticketMedio,
      metaMensal: 50000
    });
  }, [clientes, vendas, produtos]);

  // Dados para gráficos
  const vendasPorDia = vendas.reduce((acc: any, venda) => {
    const data = new Date(venda.dataVenda).toLocaleDateString('pt-BR');
    acc[data] = (acc[data] || 0) + venda.total;
    return acc;
  }, {});

  const dadosGrafico = Object.entries(vendasPorDia).map(([data, valor]) => ({
    data,
    vendas: valor
  })).slice(-7); // Últimos 7 dias

  const vendasPorOrigem = vendas.reduce((acc: any, venda) => {
    acc[venda.origemPedido] = (acc[venda.origemPedido] || 0) + 1;
    return acc;
  }, {});

  const dadosPizza = Object.entries(vendasPorOrigem).map(([origem, quantidade]) => ({
    name: origem.charAt(0).toUpperCase() + origem.slice(1),
    value: quantidade
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Vendas Total"
          value={kpis.vendaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          subtitle={`Meta: ${kpis.metaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
          icon={DollarSign}
          trend={{
            value: 12.5,
            isPositive: true
          }}
        />
        
        <KPICard
          title="Vendas Hoje"
          value={kpis.vendasHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          subtitle={`${vendas.filter(v => new Date(v.dataVenda).toDateString() === new Date().toDateString()).length} vendas`}
          icon={ShoppingCart}
          trend={{
            value: 8.2,
            isPositive: true
          }}
        />
        
        <KPICard
          title="Total Clientes"
          value={kpis.clientesTotal}
          subtitle="Clientes cadastrados"
          icon={Users}
          trend={{
            value: 5.4,
            isPositive: true
          }}
        />
        
        <KPICard
          title="Estoque Baixo"
          value={kpis.produtosEstoqueBaixo}
          subtitle="Produtos com estoque < 10"
          icon={kpis.produtosEstoqueBaixo > 0 ? AlertTriangle : Package}
          trend={{
            value: -2.1,
            isPositive: false
          }}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vendas dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Vendas'
                ]} />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Médio */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {kpis.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm text-muted-foreground">Ticket Médio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">
                {vendas.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Vendas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {((kpis.vendaTotal / kpis.metaMensal) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Meta Mensal</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};