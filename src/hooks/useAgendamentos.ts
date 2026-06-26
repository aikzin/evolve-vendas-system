import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export interface Agendamento {
  id: string;
  clienteId?: string | null;
  titulo: string;
  descricao?: string;
  dataHora: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido';
  lembreteEnviado?: boolean;
}

const fromRow = (r: any): Agendamento => ({
  id: r.id,
  clienteId: r.cliente_id,
  titulo: r.titulo,
  descricao: r.descricao ?? undefined,
  dataHora: r.data_hora,
  status: r.status,
  lembreteEnviado: r.lembrete_enviado,
});

export function useAgendamentos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Agendamento[]>([]);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('agendamentos').select('*').order('data_hora', { ascending: true });
    setItems((data || []).map(fromRow));
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);

  const criar = async (a: Omit<Agendamento, 'id'>) => {
    if (!user) return;
    const { data } = await supabase.from('agendamentos').insert({
      user_id: user.id,
      cliente_id: a.clienteId || null,
      titulo: a.titulo,
      descricao: a.descricao || null,
      data_hora: a.dataHora,
      status: a.status,
    }).select('*').maybeSingle();
    if (data) {
      setItems((arr) => [...arr, fromRow(data)].sort((x, y) => x.dataHora.localeCompare(y.dataHora)));
      // confirmação imediata via whatsapp
      try {
        if (a.clienteId) {
          const { data: cli } = await supabase.from('clientes').select('telefone, nome').eq('id', a.clienteId).maybeSingle();
          if (cli?.telefone) {
            const quando = new Date(a.dataHora).toLocaleString('pt-BR');
            await sendWhatsAppMessage(cli.telefone, `Olá ${cli.nome || ''}! Seu agendamento *${a.titulo}* foi marcado para ${quando}. 📅`);
          }
        }
      } catch {}
    }
  };

  const cancelar = async (id: string) => {
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
    setItems(arr => arr.map(x => x.id === id ? { ...x, status: 'cancelado' } : x));
  };

  const remover = async (id: string) => {
    await supabase.from('agendamentos').delete().eq('id', id);
    setItems(arr => arr.filter(x => x.id !== id));
  };

  return { items, criar, cancelar, remover, reload };
}
