import { useState } from 'react';
import { Plus, Search, FileDown, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientes } from '@/hooks/useClientes';
import { Cliente } from '@/types';
import { exportClientes } from '@/utils/excelExport';
import { useToast } from '@/hooks/use-toast';

export const Clientes = () => {
  const [clientes, setClientes] = useClientes();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const handleExport = () => {
    const sucesso = exportClientes(clientes);
    if (sucesso) {
      toast({
        title: "Exportação concluída",
        description: "Lista de clientes exportada com sucesso!",
      });
    } else {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const adicionarClienteExemplo = () => {
    const novoCliente: Cliente = {
      id: `cliente_${Date.now()}`,
      nome: `Cliente Exemplo ${clientes.length + 1}`,
      email: `cliente${clientes.length + 1}@email.com`,
      telefone: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123',
      dataCadastro: new Date().toISOString(),
      totalCompras: Math.random() * 1000,
      ultimaCompra: new Date().toISOString()
    };
    
    setClientes([...clientes, novoCliente]);
    toast({
      title: "Cliente adicionado",
      description: "Cliente de exemplo criado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={adicionarClienteExemplo}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {clientesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
              </p>
              {!searchTerm && (
                <Button onClick={adicionarClienteExemplo} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{cliente.nome}</h3>
                      <Badge variant="secondary">
                        {cliente.totalCompras.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>📧 {cliente.email}</div>
                      <div>📱 {cliente.telefone}</div>
                      <div>📍 {cliente.endereco}</div>
                    </div>
                    
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>
                        Cadastrado: {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}
                      </span>
                      {cliente.ultimaCompra && (
                        <span>
                          Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estatísticas */}
      {clientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Faturamento Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientes.reduce((acc, c) => acc + c.totalCompras, 0).toLocaleString('pt-BR', { 
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
                {(clientes.reduce((acc, c) => acc + c.totalCompras, 0) / clientes.length).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};