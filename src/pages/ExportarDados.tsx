import { useState } from 'react';
import { FileDown, Database, Users, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Cliente, Venda, Produto } from '@/types';
import { exportClientes, exportVendas, exportProdutos } from '@/utils/excelExport';
import { useToast } from '@/hooks/use-toast';

export const ExportarDados = () => {
  const [clientes] = useLocalStorage<Cliente[]>('crm_clientes', []);
  const [vendas] = useLocalStorage<Venda[]>('crm_vendas', []);
  const [produtos] = useLocalStorage<Produto[]>('crm_produtos', []);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (tipo: string, exportFunction: () => boolean) => {
    setIsExporting(tipo);
    
    try {
      const sucesso = exportFunction();
      
      if (sucesso) {
        toast({
          title: "Exportação concluída",
          description: `Dados de ${tipo} exportados com sucesso!`,
        });
      } else {
        toast({
          title: "Erro na exportação",
          description: `Não foi possível exportar os dados de ${tipo}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro durante a exportação.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportAll = async () => {
    setIsExporting('todos');
    
    let sucessos = 0;
    let erros = 0;
    
    try {
      if (exportClientes(clientes)) sucessos++; else erros++;
      if (exportVendas(vendas, clientes)) sucessos++; else erros++;
      if (exportProdutos(produtos)) sucessos++; else erros++;
      
      if (sucessos === 3) {
        toast({
          title: "Exportação completa",
          description: "Todos os dados foram exportados com sucesso!",
        });
      } else if (sucessos > 0) {
        toast({
          title: "Exportação parcial",
          description: `${sucessos} de 3 relatórios foram exportados. ${erros} falharam.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar nenhum dado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro durante a exportação completa.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Exportar lista completa de clientes com dados de contato e histórico de compras',
      icon: Users,
      count: clientes.length,
      action: () => exportClientes(clientes),
      color: 'text-blue-600'
    },
    {
      id: 'vendas',
      title: 'Vendas',
      description: 'Exportar relatório de vendas com detalhes de pagamento e origem',
      icon: ShoppingCart,
      count: vendas.length,
      action: () => exportVendas(vendas, clientes),
      color: 'text-green-600'
    },
    {
      id: 'produtos',
      title: 'Estoque',
      description: 'Exportar lista de produtos com preços e quantidades em estoque',
      icon: Package,
      count: produtos.length,
      action: () => exportProdutos(produtos),
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exportar Dados</h1>
          <p className="text-muted-foreground mt-2">
            Exporte seus dados para planilhas Excel para análise externa
          </p>
        </div>
        <Button 
          onClick={handleExportAll}
          disabled={isExporting !== null}
          size="lg"
        >
          <Database className="h-4 w-4 mr-2" />
          {isExporting === 'todos' ? 'Exportando...' : 'Exportar Tudo'}
        </Button>
      </div>

      {/* Resumo dos Dados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{clientes.length}</div>
                <div className="text-sm text-muted-foreground">Clientes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{vendas.length}</div>
                <div className="text-sm text-muted-foreground">Vendas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{produtos.length}</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opções de Exportação */}
      <div className="grid gap-6">
        {exportOptions.map((option) => (
          <Card key={option.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <option.icon className={`h-6 w-6 ${option.color}`} />
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{option.count}</div>
                  <div className="text-xs text-muted-foreground">registros</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Formato: Microsoft Excel (.xlsx)
                </div>
                <Button
                  onClick={() => handleExport(option.title.toLowerCase(), option.action)}
                  disabled={isExporting !== null || option.count === 0}
                  variant="outline"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {isExporting === option.id ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações sobre Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações sobre Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Formato dos Arquivos</div>
              <div className="text-sm text-muted-foreground">
                Todos os dados são exportados no formato Excel (.xlsx) compatível com Microsoft Excel, Google Sheets e LibreOffice.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Nome dos Arquivos</div>
              <div className="text-sm text-muted-foreground">
                Os arquivos são nomeados automaticamente com a data atual (ex: clientes_2024-01-15.xlsx).
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Formatação de Dados</div>
              <div className="text-sm text-muted-foreground">
                Valores monetários são formatados em Real (BRL) e datas no padrão brasileiro (DD/MM/AAAA).
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};