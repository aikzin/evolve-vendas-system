import { useState } from 'react';
import { Plus, Search, FileDown, Edit, Trash, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProdutos } from '@/hooks/useProdutos';
import { Produto } from '@/types';
import { exportProdutos } from '@/utils/excelExport';
import { useToast } from '@/hooks/use-toast';

export const Estoque = () => {
  const [produtos, setProdutos] = useProdutos();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const sucesso = exportProdutos(produtos);
    if (sucesso) {
      toast({
        title: "Exportação concluída",
        description: "Lista de produtos exportada com sucesso!",
      });
    } else {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const adicionarProdutoExemplo = () => {
    const categorias = ['Eletrônicos', 'Roupas', 'Casa', 'Alimentação', 'Livros'];
    const nomes = ['Produto Premium', 'Item Especial', 'Artigo Popular', 'Mercadoria Top', 'Produto Exclusivo'];
    
    const novoProduto: Produto = {
      id: `produto_${Date.now()}`,
      nome: `${nomes[Math.floor(Math.random() * nomes.length)]} ${produtos.length + 1}`,
      preco: Math.random() * 200 + 10,
      estoque: Math.floor(Math.random() * 50) + 1,
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      descricao: 'Produto de alta qualidade'
    };
    
    setProdutos([...produtos, novoProduto]);
    toast({
      title: "Produto adicionado",
      description: "Produto de exemplo criado com sucesso!",
    });
  };

  const getEstoqueBadge = (estoque: number) => {
    if (estoque === 0) return <Badge variant="destructive">Sem Estoque</Badge>;
    if (estoque < 10) return <Badge variant="secondary">Estoque Baixo</Badge>;
    return <Badge className="bg-success text-success-foreground">Em Estoque</Badge>;
  };

  const produtosEstoqueBaixo = produtos.filter(p => p.estoque < 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={adicionarProdutoExemplo}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Alertas de Estoque */}
      {produtosEstoqueBaixo.length > 0 && (
        <Card className="border-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {produtosEstoqueBaixo.length} produto(s) com estoque baixo
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <div className="grid gap-4">
        {produtosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
              </p>
              {!searchTerm && (
                <Button onClick={adicionarProdutoExemplo} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Produto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          produtosFiltrados.map((produto) => (
            <Card key={produto.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{produto.nome}</h3>
                      {getEstoqueBadge(produto.estoque)}
                      <Badge variant="outline">{produto.categoria}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço:</span>
                        <div className="font-medium text-lg text-primary">
                          {produto.preco.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Estoque:</span>
                        <div className="font-medium text-lg">
                          {produto.estoque} unidades
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <div className="font-medium text-lg">
                          {(produto.preco * produto.estoque).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {produto.descricao && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {produto.descricao}
                      </div>
                    )}
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

      {/* Estatísticas do Estoque */}
      {produtos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{produtos.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Valor do Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {produtos.reduce((acc, p) => acc + (p.preco * p.estoque), 0).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unidades Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {produtos.reduce((acc, p) => acc + p.estoque, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {produtosEstoqueBaixo.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};