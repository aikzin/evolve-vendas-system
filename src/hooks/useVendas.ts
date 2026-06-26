import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Venda } from '@/types';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const fromRow = (r: any): Venda => ({
  id: r.id,
  clienteId: r.cliente_id ?? '',
  produtos: r.produtos ?? [],
  total: Number(r.total) || 0,
  tipoPagamento: r.tipo_pagamento,
  origemPedido: r.origem_pedido,
  dataVenda: r.data_venda,
  status: r.status,
  observacoes: r.observacoes ?? undefined,
});

const toRow = (v: Venda, user_id: string) => ({
  id: v.id?.length === 36 ? v.id : undefined,
  user_id,
  cliente_id: v.clienteId && v.clienteId.length === 36 ? v.clienteId : null,
  produtos: v.produtos || [],
  total: v.total || 0,
  tipo_pagamento: v.tipoPagamento,
  origem_pedido: v.origemPedido,
  data_venda: v.dataVenda || new Date().toISOString(),
  status: v.status,
  observacoes: v.observacoes || null,
});

export function useVendas() {
  const { user } = useAuth();
  const [value, setValue] = useState<Venda[]>([]);
  const prev = useRef<Venda[]>([]);

  useEffect(() => {
    if (!user) { setValue([]); prev.current = []; return; }
    (async () => {
      const { data } = await supabase.from('vendas').select('*').order('data_venda', { ascending: false });
      const list = (data || []).map(fromRow);
      prev.current = list;
      setValue(list);
    })();
  }, [user?.id]);

  const update = useCallback((next: Venda[] | ((prev: Venda[]) => Venda[])) => {
    if (!user) return;
    setValue((curr) => {
      const newList = typeof next === 'function' ? (next as any)(curr) : next;
      const oldIds = new Set(prev.current.map(c => c.id));
      const newIds = new Set(newList.map((c: Venda) => c.id));
      const toDelete = [...oldIds].filter(id => !newIds.has(id));
      const toUpsert = newList.filter((c: Venda) => {
        const old = prev.current.find(x => x.id === c.id);
        return !old || JSON.stringify(old) !== JSON.stringify(c);
      });
      (async () => {
        if (toDelete.length) await supabase.from('vendas').delete().in('id', toDelete as string[]);
        if (toUpsert.length) {
          const rows = toUpsert.map((v: Venda) => toRow(v, user.id));
          await supabase.from('vendas').upsert(rows as any, { onConflict: 'id' });
          // Confirmação WhatsApp para vendas pagas novas
          try {
            for (const v of toUpsert as Venda[]) {
              const old = prev.current.find(x => x.id === v.id);
              if ((!old || old.status !== 'paga') && v.status === 'paga' && v.clienteId) {
                const { data: cli } = await supabase.from('clientes').select('telefone, nome').eq('id', v.clienteId).maybeSingle();
                if (cli?.telefone) {
                  const total = v.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  await sendWhatsAppMessage(cli.telefone, `Olá ${cli.nome || ''}! Sua compra de ${total} foi confirmada. Obrigado pela preferência! ✅`);
                }
              }
            }
          } catch {}
        }
        prev.current = newList;
      })();
      return newList;
    });
  }, [user?.id]);

  return [value, update] as const;
}
