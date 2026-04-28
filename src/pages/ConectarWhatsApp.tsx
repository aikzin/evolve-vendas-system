import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  QrCode,
  Power,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'error';

interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const defaultConfig: WhatsAppConfig = {
  apiUrl: '',
  apiKey: '',
  instanceName: 'vendacrm',
};

export const ConectarWhatsApp = () => {
  const [config, setConfig] = useLocalStorage<WhatsAppConfig>('whatsapp_config', defaultConfig);
  const [formConfig, setFormConfig] = useState<WhatsAppConfig>(config);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormConfig(config);
  }, [config]);

  const isConfigured = Boolean(config.apiUrl && config.apiKey && config.instanceName);

  const saveConfig = () => {
    setConfig(formConfig);
    toast({
      title: 'Configuração salva',
      description: 'As credenciais da Evolution API foram salvas.',
    });
  };

  const checkStatus = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const res = await fetch(
        `${config.apiUrl.replace(/\/$/, '')}/instance/connectionState/${config.instanceName}`,
        { headers: { apikey: config.apiKey } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const state = data?.instance?.state ?? data?.state;
      if (state === 'open') {
        setStatus('connected');
        setQrCode(null);
      } else if (state === 'connecting') {
        setStatus('connecting');
      } else {
        setStatus('disconnected');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Falha ao verificar status');
    }
  }, [config, isConfigured]);

  const connect = async () => {
    if (!isConfigured) {
      toast({
        title: 'Configure primeiro',
        description: 'Preencha URL, API Key e nome da instância antes de conectar.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setStatus('connecting');
    setErrorMessage('');
    try {
      const base = config.apiUrl.replace(/\/$/, '');
      // Tenta criar a instância (ignora erro se já existir)
      await fetch(`${base}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          instanceName: config.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      }).catch(() => null);

      // Busca QR Code
      const res = await fetch(`${base}/instance/connect/${config.instanceName}`, {
        headers: { apikey: config.apiKey },
      });
      if (!res.ok) throw new Error(`Erro ao gerar QR Code (HTTP ${res.status})`);
      const data = await res.json();
      const qr = data?.base64 || data?.qrcode?.base64 || data?.qr;
      if (qr) {
        setQrCode(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
        setStatus('qr');
      } else {
        // Pode já estar conectado
        await checkStatus();
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Não foi possível conectar à Evolution API');
      toast({
        title: 'Erro ao conectar',
        description: err?.message || 'Verifique as credenciais e a URL.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const base = config.apiUrl.replace(/\/$/, '');
      await fetch(`${base}/instance/logout/${config.instanceName}`, {
        method: 'DELETE',
        headers: { apikey: config.apiKey },
      });
      setStatus('disconnected');
      setQrCode(null);
      toast({ title: 'Desconectado', description: 'WhatsApp desconectado com sucesso.' });
    } catch (err: any) {
      toast({
        title: 'Erro ao desconectar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling enquanto QR Code está ativo ou conectando
  useEffect(() => {
    if (!isConfigured) return;
    if (status === 'qr' || status === 'connecting') {
      const id = setInterval(checkStatus, 4000);
      return () => clearInterval(id);
    }
  }, [status, checkStatus, isConfigured]);

  // Checa status inicial
  useEffect(() => {
    if (isConfigured) checkStatus();
  }, [isConfigured, checkStatus]);

  const statusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Conectando...
          </Badge>
        );
      case 'qr':
        return (
          <Badge variant="secondary">
            <QrCode className="h-3.5 w-3.5 mr-1" /> Aguardando leitura do QR
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <XCircle className="h-3.5 w-3.5 mr-1" /> Desconectado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="h-7 w-7 text-primary" />
            Conectar WhatsApp
          </h1>
          <p className="text-muted-foreground mt-2">
            Conecte seu WhatsApp via Evolution API para enviar e receber mensagens automáticas.
          </p>
        </div>
        <div className="flex items-center gap-2">{statusBadge()}</div>
      </div>

      {!isConfigured && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuração necessária</AlertTitle>
          <AlertDescription>
            Preencha os dados da sua Evolution API abaixo. Se ainda não tem uma, você pode subir uma
            gratuitamente no Railway ou em um VPS.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração da Evolution API</CardTitle>
            <CardDescription>Credenciais de acesso ao seu servidor Evolution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                placeholder="https://sua-evolution.railway.app"
                value={formConfig.apiUrl}
                onChange={(e) => setFormConfig({ ...formConfig, apiUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sua-api-key-global"
                value={formConfig.apiKey}
                onChange={(e) => setFormConfig({ ...formConfig, apiKey: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                placeholder="vendacrm"
                value={formConfig.instanceName}
                onChange={(e) => setFormConfig({ ...formConfig, instanceName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Identificador único para essa conexão do WhatsApp.
              </p>
            </div>
            <Button onClick={saveConfig} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Salvar configuração
            </Button>
          </CardContent>
        </Card>

        {/* QR Code / Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status da conexão</CardTitle>
            <CardDescription>
              {status === 'connected'
                ? 'Seu WhatsApp está conectado e pronto para uso.'
                : status === 'qr'
                ? 'Escaneie o QR Code com o WhatsApp do seu celular.'
                : 'Conecte para começar a enviar mensagens.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center bg-muted/40 border border-dashed border-border rounded-lg aspect-square p-4">
              {status === 'qr' && qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-full h-full object-contain rounded-md"
                />
              ) : status === 'connected' ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <p className="font-medium">WhatsApp conectado</p>
                  <p className="text-sm text-muted-foreground">
                    Instância: <span className="font-mono">{config.instanceName}</span>
                  </p>
                </div>
              ) : status === 'connecting' ? (
                <div className="text-center space-y-2">
                  <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground">Conectando...</p>
                </div>
              ) : status === 'error' ? (
                <div className="text-center space-y-2">
                  <XCircle className="h-16 w-16 text-destructive mx-auto" />
                  <p className="font-medium">Falha na conexão</p>
                  <p className="text-sm text-muted-foreground break-all px-4">{errorMessage}</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Clique em "Gerar QR Code" para iniciar.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {status === 'connected' ? (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={disconnect}
                  disabled={loading}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={connect}
                  disabled={loading || !isConfigured}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Gerar QR Code
                </Button>
              )}
              <Button
                variant="outline"
                onClick={checkStatus}
                disabled={loading || !isConfigured}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como escanear o QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Abra o WhatsApp no seu celular.</li>
            <li>
              Toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong> e
              selecione <strong>Aparelhos conectados</strong>.
            </li>
            <li>
              Toque em <strong>Conectar um aparelho</strong>.
            </li>
            <li>Aponte a câmera do celular para o QR Code exibido acima.</li>
            <li>Aguarde alguns segundos até o status mudar para "Conectado".</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConectarWhatsApp;
