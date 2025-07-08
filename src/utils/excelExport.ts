import * as XLSX from 'xlsx';
import { Cliente, Venda, Produto } from '@/types';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Dados') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Criar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, fullFilename);
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

export const exportClientes = (clientes: Cliente[]) => {
  const data = clientes.map(cliente => ({
    'ID': cliente.id,
    'Nome': cliente.nome,
    'Email': cliente.email,
    'Telefone': cliente.telefone,
    'Endereço': cliente.endereco,
    'Data Cadastro': new Date(cliente.dataCadastro).toLocaleDateString('pt-BR'),
    'Total Compras': cliente.totalCompras.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }),
    'Última Compra': cliente.ultimaCompra ? 
      new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR') : 'Nunca'
  }));
  
  return exportToExcel(data, 'clientes', 'Clientes');
};

export const exportVendas = (vendas: Venda[], clientes: Cliente[]) => {
  const data = vendas.map(venda => {
    const cliente = clientes.find(c => c.id === venda.clienteId);
    return {
      'ID Venda': venda.id,
      'Cliente': cliente?.nome || 'Cliente não encontrado',
      'Total': venda.total.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      'Tipo Pagamento': venda.tipoPagamento.charAt(0).toUpperCase() + venda.tipoPagamento.slice(1),
      'Origem': venda.origemPedido.charAt(0).toUpperCase() + venda.origemPedido.slice(1),
      'Data': new Date(venda.dataVenda).toLocaleDateString('pt-BR'),
      'Status': venda.status.charAt(0).toUpperCase() + venda.status.slice(1),
      'Observações': venda.observacoes || ''
    };
  });
  
  return exportToExcel(data, 'vendas', 'Vendas');
};

export const exportProdutos = (produtos: Produto[]) => {
  const data = produtos.map(produto => ({
    'ID': produto.id,
    'Nome': produto.nome,
    'Preço': produto.preco.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }),
    'Estoque': produto.estoque,
    'Categoria': produto.categoria,
    'Descrição': produto.descricao || ''
  }));
  
  return exportToExcel(data, 'estoque', 'Produtos');
};