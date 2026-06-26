import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Produto } from '@/types';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const fromRow = (r: any): Produto & { estoqueMinimo?: number } => ({
  id: r.id,
  nome: r.nome ?? '',
  preco: Number(r.preco) || 0,
  estoque: Number(r.estoque) || 0,
  categoria: r.categoria ?? '',
  descricao: r.descricao ?? undefined,
  // @ts-ignore extra
  estoqueMinimo: Number(r.estoque_minimo) || 0,
});

const toRow = (p: any, user_id: string) => ({
  id: p.id?.length === 36 ? p.id : undefined,
  user_id,
  nome: p.nome,
  preco: p.preco || 0,
  estoque: p.estoque || 0,
  estoque_minimo: p.estoqueMinimo ?? 10,
  categoria: p.categoria || null,
  descricao: p.descricao || null,
});

export function useProdutos() {
  const { user } = useAuth();
  const [value, setValue] = useState<Produto[]>([]);
  const prev = useRef<Produto[]>([]);

  useEffect(() => {
    if (!user) { setValue([]); prev.current = []; return; }
    (async () => {
      const { data } = await supabase.from('produtos_estoque').select('*').order('created_at', { ascending: false });
      const list = (data || []).map(fromRow);
      prev.current = list;
      setValue(list);
    })();
  }, [user?.id]);

  const update = useCallback((next: Produto[] | ((prev: Produto[]) => Produto[])) => {
    if (!user) return;
    setValue((curr) => {
      const newList = typeof next === 'function' ? (next as any)(curr) : next;
      const oldIds = new Set(prev.current.map(c => c.id));
      const newIds = new Set(newList.map((c: Produto) => c.id));
      const toDelete = [...oldIds].filter(id => !newIds.has(id));
      const toUpsert = newList.filter((c: Produto) => {
        const old = prev.current.find(x => x.id === c.id);
        return !old || JSON.stringify(old) !== JSON.stringify(c);
      });
      (async () => {
        if (toDelete.length) await supabase.from('produtos_estoque').delete().in('id', toDelete as string[]);
        if (toUpsert.length) {
          const rows = toUpsert.map((p: Produto) => toRow(p, user.id));
          const { data } = await supabase.from('produtos_estoque').upsert(rows as any, { onConflict: 'id' }).select('*');
          if (data) {
            const merged = newList.map((c: Produto) => {
              const m = data.find((d: any) => d.nome === c.nome);
              return m ? fromRow(m) : c;
            });
            prev.current = merged as any;
            setValue(merged as any);
          }
          // Alerta de estoque baixo
          try {
            const { data: cfg } = await supabase.from('configuracoes').select('dados').maybeSingle();
            const dados: any = cfg?.dados || {};
            const numero = dados?.alertaEstoqueNumero || dados?.whatsapp?.numeroTelefone;
            const ativo = dados?.estoque?.alertasAutomaticos !== false;
            if (ativo && numero) {
              for (const p of toUpsert as any[]) {
                const minimo = p.estoqueMinimo ?? 10;
                if (p.estoque <= minimo) {
                  await sendWhatsAppMessage(numero, `⚠️ Estoque baixo: *${p.nome}* (${p.estoque} unidades, mínimo ${minimo}).`);
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
