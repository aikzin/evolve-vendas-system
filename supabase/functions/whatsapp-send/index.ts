import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { phone, message } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone and message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: cfg } = await supabase.from('configuracoes').select('dados').maybeSingle();
    const dados: any = cfg?.dados || {};
    const evo = dados?.evolution || {};
    const apiUrl: string = evo.apiUrl || dados?.whatsapp?.apiUrl || '';
    const apiKey: string = evo.apiKey || dados?.whatsapp?.apiKey || '';
    const instance: string = evo.instanceName || dados?.whatsapp?.instanceName || 'vendacrm';

    if (!apiUrl || !apiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const base = apiUrl.replace(/\/$/, '');

    const resp = await fetch(`${base}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: cleanPhone, text: message }),
    });
    const body = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `Evolution API ${resp.status}`, body }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, body }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
