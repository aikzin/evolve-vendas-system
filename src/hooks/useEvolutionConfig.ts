import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const DEFAULT: EvolutionConfig = { apiUrl: '', apiKey: '', instanceName: 'vendacrm' };

export function useEvolutionConfig() {
  const { user } = useAuth();
  const [value, setValue] = useState<EvolutionConfig>(DEFAULT);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('configuracoes').select('dados').maybeSingle();
      const dados: any = data?.dados || {};
      setValue({ ...DEFAULT, ...(dados.evolution || {}) });
    })();
  }, [user?.id]);

  const update = useCallback((next: EvolutionConfig | ((p: EvolutionConfig) => EvolutionConfig)) => {
    if (!user) return;
    setValue((curr) => {
      const v = typeof next === 'function' ? (next as any)(curr) : next;
      (async () => {
        const { data } = await supabase.from('configuracoes').select('dados').maybeSingle();
        const dados: any = data?.dados || {};
        await supabase.from('configuracoes').upsert(
          { user_id: user.id, dados: { ...dados, evolution: v } },
          { onConflict: 'user_id' }
        );
      })();
      return v;
    });
  }, [user?.id]);

  return [value, update] as const;
}
