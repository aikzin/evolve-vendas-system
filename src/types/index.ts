export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  dataCadastro: string;
  totalCompras: number;
  ultimaCompra?: string;
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  categoria: string;
  descricao?: string;
}

export interface Venda {
  id: string;
  clienteId: string;
  produtos: VendaProduto[];
  total: number;
  tipoPagamento: 'dinheiro' | 'pix' | 'credito' | 'debito';
  origemPedido: 'whatsapp' | 'ligacao' | 'instagram' | 'facebook' | 'presencial';
  dataVenda: string;
  status: 'pendente' | 'paga' | 'cancelada';
  observacoes?: string;
}

export interface VendaProduto {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface KPI {
  vendaTotal: number;
  vendasHoje: number;
  clientesTotal: number;
  produtosEstoqueBaixo: number;
  ticketMedio: number;
  metaMensal: number;
}