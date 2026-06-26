import { useState } from 'react';
import { Plus, Calendar, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useClientes } from '@/hooks/useClientes';
import { useToast } from '@/hooks/use-toast';

export const Agendamentos = () => {
  const { items, criar, cancelar, remover } = useAgendamentos();
  const [clientes] = useClientes();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', dataHora: '', clienteId: '' });

  const handleCriar = async () => {
    if (!form.titulo || !form.dataHora) {
      toast({ title: 'Preencha título e data', variant: 'destructive' });
      return;
    }
    await criar({
      titulo: form.titulo,
      descricao: form.descricao,
      dataHora: new Date(form.dataHora).toISOString(),
      clienteId: form.clienteId || null,
      status: 'agendado',
    });
    setForm({ titulo: '', descricao: '', dataHora: '', clienteId: '' });
    setOpen(false);
    toast({ title: 'Agendamento criado' });
  };

  const statusBadge = (s: string) => {
    const map: any = {
      agendado: 'secondary', confirmado: 'default', cancelado: 'destructive', concluido: 'outline',
    };
    return <Badge variant={map[s]}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={form.clienteId} onValueChange={v => setForm({ ...form, clienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data e hora</Label>
                <Input type="datetime-local" value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <Button onClick={handleCriar} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum agendamento.</CardContent></Card>
        ) : items.map(a => {
          const cli = clientes.find(c => c.id === a.clienteId);
          return (
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{a.titulo}</h3>
                      {statusBadge(a.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>📅 {new Date(a.dataHora).toLocaleString('pt-BR')}</div>
                      {cli && <div>👤 {cli.nome}</div>}
                      {a.descricao && <div>{a.descricao}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {a.status !== 'cancelado' && (
                      <Button variant="outline" size="sm" onClick={() => cancelar(a.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => remover(a.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
