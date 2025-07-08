import { useState } from 'react';
import { Plus, FileDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Cliente, Venda } from '@/types';
import { exportVendas } from '@/utils/excelExport';
import { useToast } from '@/hooks/use-toast';

export const Vendas = () => {
  const [vendas, setVendas] = useLocalStorage<Venda[]>('crm_vendas', []);
  const [clientes, setClientes] = useLocalStorage<Cliente[]>('crm_clientes', []);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todos');
  const { toast } = useToast();

  const vendasFiltradas = vendas.filter(venda => {
    const matchStatus = filtroStatus === 'todos' || venda.status === filtroStatus;
    const matchOrigem = filtroOrigem === 'todos' || venda.origemPedido === filtroOrigem;
    return matchStatus && matchOrigem;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'paga': 'default',
      'pendente': 'secondary',
      'cancelada': 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getTipoPagamentoBadge = (tipo: string) => {
    const colors = {
      'dinheiro': 'bg-green-100 text-green-800',
      'pix': 'bg-purple-100 text-purple-800',
      'credito': 'bg-blue-100 text-blue-800',
      'debito': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo as keyof typeof colors]}`}>
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </span>
    );
  };

  const handleExport = () => {
    const sucesso = exportVendas(vendasFiltradas, clientes);
    if (sucesso) {
      toast({
        title: "Exportação concluída",
        description: "Relatório de vendas exportado com sucesso!",
      });
    } else {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const adicionarVendaExemplo = () => {
    // Primeiro, vamos garantir que temos clientes
    if (clientes.length === 0) {
      const clienteExemplo: Cliente = {
        id: `cliente_${Date.now()}`,
        nome: 'Cliente Exemplo',
        email: 'cliente@exemplo.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua das Flores, 123',
        dataCadastro: new Date().toISOString(),
        totalCompras: 0,
        ultimaCompra: new Date().toISOString()
      };
      setClientes([clienteExemplo]);
    }

    const origens = ['whatsapp', 'ligacao', 'instagram', 'facebook', 'presencial'] as const;
    const pagamentos = ['dinheiro', 'pix', 'credito', 'debito'] as const;
    const statuses = ['paga', 'pendente', 'cancelada'] as const;

    const novaVenda: Venda = {
      id: `venda_${Date.now()}`,
      clienteId: clientes[0]?.id || `cliente_${Date.now()}`,
      produtos: [
        {
          produtoId: 'produto_1',
          quantidade: 2,
          precoUnitario: 25.90,
          subtotal: 51.80
        }
      ],
      total: 51.80,
      tipoPagamento: pagamentos[Math.floor(Math.random() * pagamentos.length)],
      origemPedido: origens[Math.floor(Math.random() * origens.length)],
      dataVenda: new Date().toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      observacoes: 'Venda de exemplo'
    };
    
    setVendas([...vendas, novaVenda]);
    
    // Atualizar dados do cliente
    if (clientes[0]) {
      const clienteAtualizado = {
        ...clientes[0],
        totalCompras: clientes[0].totalCompras + novaVenda.total,
        ultimaCompra: novaVenda.dataVenda
      };
      setClientes([clienteAtualizado, ...clientes.slice(1)]);
    }

    toast({
      title: "Venda adicionada",
      description: "Venda de exemplo criada com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendas</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={adicionarVendaExemplo}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Origens</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <div className="grid gap-4">
        {vendasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {vendas.length === 0 ? 'Nenhuma venda cadastrada.' : 'Nenhuma venda encontrada com os filtros aplicados.'}
              </p>
              {vendas.length === 0 && (
                <Button onClick={adicionarVendaExemplo} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Venda
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          vendasFiltradas.map((venda) => {
            const cliente = clientes.find(c => c.id === venda.clienteId);
            
            return (
              <Card key={venda.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Venda #{venda.id.slice(-6)}</h3>
                      {getStatusBadge(venda.status)}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <div className="font-medium">{cliente?.nome || 'Cliente não encontrado'}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Pagamento:</span>
                      <div className="mt-1">{getTipoPagamentoBadge(venda.tipoPagamento)}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Origem:</span>
                      <div className="font-medium capitalize">{venda.origemPedido}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <div className="font-medium">
                        {new Date(venda.dataVenda).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  {venda.observacoes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground text-sm">Observações:</span>
                      <div className="text-sm">{venda.observacoes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Resumo */}
      {vendasFiltradas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendasFiltradas.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendasFiltradas.reduce((acc, v) => acc + v.total, 0).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(vendasFiltradas.reduce((acc, v) => acc + v.total, 0) / vendasFiltradas.length).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vendas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {vendasFiltradas.filter(v => v.status === 'paga').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};