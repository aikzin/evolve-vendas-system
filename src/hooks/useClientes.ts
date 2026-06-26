import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Cliente } from '@/types';

const fromRow = (r: any): Cliente => ({
  id: r.id,
  nome: r.nome ?? '',
  email: r.email ?? '',
  telefone: r.telefone ?? '',
  endereco: r.endereco ?? '',
  dataCadastro: r.data_cadastro,
  totalCompras: Number(r.total_compras) || 0,
  ultimaCompra: r.ultima_compra ?? undefined,
});

const toRow = (c: Cliente, user_id: string) => ({
  id: c.id?.length === 36 ? c.id : undefined,
  user_id,
  nome: c.nome,
  email: c.email || null,
  telefone: c.telefone || null,
  endereco: c.endereco || null,
  data_cadastro: c.dataCadastro || new Date().toISOString(),
  total_compras: c.totalCompras || 0,
  ultima_compra: c.ultimaCompra || null,
});

export function useClientes() {
  const { user } = useAuth();
  const [value, setValue] = useState<Cliente[]>([]);
  const prev = useRef<Cliente[]>([]);

  useEffect(() => {
    if (!user) { setValue([]); prev.current = []; return; }
    (async () => {
      const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      const list = (data || []).map(fromRow);
      prev.current = list;
      setValue(list);
    })();
  }, [user?.id]);

  const update = useCallback((next: Cliente[] | ((prev: Cliente[]) => Cliente[])) => {
    if (!user) return;
    setValue((curr) => {
      const newList = typeof next === 'function' ? (next as any)(curr) : next;
      const oldIds = new Set(prev.current.map(c => c.id));
      const newIds = new Set(newList.map((c: Cliente) => c.id));
      const toDelete = [...oldIds].filter(id => !newIds.has(id));
      const toUpsert: Cliente[] = newList.filter((c: Cliente) => {
        const old = prev.current.find(x => x.id === c.id);
        return !old || JSON.stringify(old) !== JSON.stringify(c);
      });
      (async () => {
        if (toDelete.length) await supabase.from('clientes').delete().in('id', toDelete as string[]);
        if (toUpsert.length) {
          const rows = toUpsert.map(c => toRow(c, user.id));
          const { data } = await supabase.from('clientes').upsert(rows as any, { onConflict: 'id' }).select('*');
          if (data) {
            const merged = newList.map((c: Cliente) => {
              const m = data.find((d: any) => d.nome === c.nome && d.user_id === user.id);
              return m ? fromRow(m) : c;
            });
            prev.current = merged;
            setValue(merged);
            return;
          }
        }
        prev.current = newList;
      })();
      return newList;
    });
  }, [user?.id]);

  return [value, update] as const;
}
