import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tweets, error } = await supabase
      .from('tweets')
      .select('id, tweet_id, text, photo_url, likes, retweets, posted_at')
      .order('posted_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    const normalized = (tweets ?? []).map(t => ({
      id: t.tweet_id || t.id,
      text: t.text,
      photo_url: t.photo_url ?? null,
      created_at: t.posted_at,
      public_metrics: { like_count: t.likes, retweet_count: t.retweets },
    }));

    return new Response(
      JSON.stringify({ tweets: normalized, username: 'KenseiEsport' }),
      { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
