import { useState } from 'react';
import { Save, Settings, Bell, Database, Palette, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useToast } from '@/hooks/use-toast';

interface ConfiguracoesSistema {
  nomeEmpresa: string;
  metaMensal: number;
  moeda: string;
  notificacoes: {
    vendas: boolean;
    estoqueBaixo: boolean;
    metasMensais: boolean;
  };
  whatsapp: {
    habilitado: boolean;
    numeroTelefone: string;
    mensagemPadrao: string;
  };
  estoque: {
    limiteBaixoEstoque: number;
    alertasAutomaticos: boolean;
  };
  tema: string;
}

const configuracoesIniciais: ConfiguracoesSistema = {
  nomeEmpresa: 'Minha Empresa',
  metaMensal: 50000,
  moeda: 'BRL',
  notificacoes: {
    vendas: true,
    estoqueBaixo: true,
    metasMensais: true,
  },
  whatsapp: {
    habilitado: false,
    numeroTelefone: '',
    mensagemPadrao: 'Olá! Seu pedido foi confirmado. Obrigado pela preferência!'
  },
  estoque: {
    limiteBaixoEstoque: 10,
    alertasAutomaticos: true,
  },
  tema: 'claro'
};

export const Configuracoes = () => {
  const [config, setConfig] = useLocalStorage<ConfiguracoesSistema>('crm_configuracoes', configuracoesIniciais);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleChange = (campo: string, valor: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      if (campo.includes('.')) {
        const [categoria, subcampo] = campo.split('.');
        if (categoria === 'notificacoes') {
          newConfig.notificacoes = { ...newConfig.notificacoes, [subcampo]: valor };
        } else if (categoria === 'whatsapp') {
          newConfig.whatsapp = { ...newConfig.whatsapp, [subcampo]: valor };
        } else if (categoria === 'estoque') {
          newConfig.estoque = { ...newConfig.estoque, [subcampo]: valor };
        }
      } else {
        (newConfig as any)[campo] = valor;
      }
      
      return newConfig;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // As configurações já são salvas automaticamente pelo useLocalStorage
    setHasChanges(false);
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram salvas com sucesso!",
    });
  };

  const resetConfiguracoes = () => {
    setConfig(configuracoesIniciais);
    setHasChanges(true);
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas para os valores padrão.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Personalize o sistema de acordo com suas necessidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetConfiguracoes}>
            Resetar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
              <Input
                id="nomeEmpresa"
                value={config.nomeEmpresa}
                onChange={(e) => handleChange('nomeEmpresa', e.target.value)}
                placeholder="Digite o nome da sua empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="metaMensal">Meta Mensal (R$)</Label>
              <Input
                id="metaMensal"
                type="number"
                value={config.metaMensal}
                onChange={(e) => handleChange('metaMensal', parseFloat(e.target.value) || 0)}
                placeholder="50000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações de Vendas</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas quando uma nova venda for realizada
              </p>
            </div>
            <Switch
              checked={config.notificacoes.vendas}
              onCheckedChange={(checked) => handleChange('notificacoes.vendas', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas de Estoque Baixo</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas quando produtos estiverem com estoque baixo
              </p>
            </div>
            <Switch
              checked={config.notificacoes.estoqueBaixo}
              onCheckedChange={(checked) => handleChange('notificacoes.estoqueBaixo', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Acompanhamento de Metas</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas sobre o progresso das metas mensais
              </p>
            </div>
            <Switch
              checked={config.notificacoes.metasMensais}
              onCheckedChange={(checked) => handleChange('notificacoes.metasMensais', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Business */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Integração WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar integração com WhatsApp Business
              </p>
            </div>
            <Switch
              checked={config.whatsapp.habilitado}
              onCheckedChange={(checked) => handleChange('whatsapp.habilitado', checked)}
            />
          </div>
          
          {config.whatsapp.habilitado && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="telefone">Número do WhatsApp</Label>
                <Input
                  id="telefone"
                  value={config.whatsapp.numeroTelefone}
                  onChange={(e) => handleChange('whatsapp.numeroTelefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="mensagemPadrao">Mensagem Padrão</Label>
                <Textarea
                  id="mensagemPadrao"
                  value={config.whatsapp.mensagemPadrao}
                  onChange={(e) => handleChange('whatsapp.mensagemPadrao', e.target.value)}
                  placeholder="Digite a mensagem padrão para confirmação de pedidos"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Controle de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="limiteBaixoEstoque">Limite para Estoque Baixo</Label>
            <Input
              id="limiteBaixoEstoque"
              type="number"
              value={config.estoque.limiteBaixoEstoque}
              onChange={(e) => handleChange('estoque.limiteBaixoEstoque', parseInt(e.target.value) || 0)}
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Produtos com estoque abaixo deste valor serão marcados como "estoque baixo"
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar alertas automáticos quando produtos atingirem estoque baixo
              </p>
            </div>
            <Switch
              checked={config.estoque.alertasAutomaticos}
              onCheckedChange={(checked) => handleChange('estoque.alertasAutomaticos', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tema">Tema do Sistema</Label>
            <Select value={config.tema} onValueChange={(value) => handleChange('tema', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">Claro</SelectItem>
                <SelectItem value="escuro">Escuro</SelectItem>
                <SelectItem value="automatico">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Versão:</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Última atualização:</span>
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desenvolvido por:</span>
            <span>VendaCRM</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};