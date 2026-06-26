import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useConfiguracoes<T extends object>(defaultValue: T) {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('configuracoes').select('dados').maybeSingle();
      if (data?.dados && Object.keys(data.dados as object).length) {
        setValue({ ...defaultValue, ...(data.dados as T) });
      } else {
        // garantir linha
        await supabase.from('configuracoes').upsert({ user_id: user.id, dados: defaultValue as any }, { onConflict: 'user_id' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    if (!user) return;
    setValue((curr) => {
      const newVal = typeof next === 'function' ? (next as any)(curr) : next;
      supabase.from('configuracoes').upsert({ user_id: user.id, dados: newVal as any }, { onConflict: 'user_id' }).then(() => {});
      return newVal;
    });
  }, [user?.id]);

  return [value, update] as const;
}
