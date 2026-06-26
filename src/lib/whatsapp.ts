import { supabase } from '@/integrations/supabase/client';

export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: { phone, message },
    });
    if (error) {
      console.warn('whatsapp-send error', error);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (e) {
    console.warn('whatsapp-send exception', e);
    return { ok: false, error: e };
  }
}
