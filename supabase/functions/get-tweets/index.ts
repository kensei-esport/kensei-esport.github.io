import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWITTER_USERNAME = 'KenseiEsport';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // Unofficial syndication API used by Twitter's own embed widget — free, no auth needed
    const syndicationUrl =
      `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${TWITTER_USERNAME}&limit=10&dnt=true&lang=fr&with_replies=false`;

    const res = await fetch(syndicationUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)',
        'Accept': 'application/json',
        'Referer': 'https://platform.twitter.com/',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Syndication HTTP ${res.status}` }), {
        status: res.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();

    // Normalize tweets from syndication format to our standard format
    const rawTweets: Array<{
      id_str: string;
      full_text?: string;
      text?: string;
      created_at: string;
      favorite_count?: number;
      retweet_count?: number;
      entities?: {
        urls?: Array<{ url: string; display_url: string; expanded_url: string; indices: [number, number] }>;
        media?: Array<{ media_url_https: string; type: string }>;
      };
      extended_entities?: {
        media?: Array<{ media_url_https: string; type: string }>;
      };
    }> = data?.timeline?.instructions
      ?.flatMap((i: { entries?: Array<{ content?: { itemContent?: { tweet_results?: { result?: { legacy?: unknown } } } } }> }) =>
        i.entries
          ?.map((e) => e.content?.itemContent?.tweet_results?.result?.legacy)
          .filter(Boolean) ?? []
      ) ?? [];

    const tweets = rawTweets.slice(0, 10).map((t) => {
      const text = (t.full_text || t.text || '').replace(/https:\/\/t\.co\/\S+$/g, '').trim();
      const media = t.extended_entities?.media || t.entities?.media || [];
      const photo = media.find((m) => m.type === 'photo');
      return {
        id: t.id_str,
        text,
        created_at: t.created_at,
        public_metrics: {
          like_count: t.favorite_count ?? 0,
          retweet_count: t.retweet_count ?? 0,
        },
        photo_url: photo?.media_url_https ?? null,
      };
    });

    return new Response(
      JSON.stringify({ tweets, username: TWITTER_USERNAME }),
      { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});


serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!bearerToken) {
      return new Response(JSON.stringify({ error: 'Missing TWITTER_BEARER_TOKEN' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 1. Resolve user ID from username
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_USERNAME}`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );
    if (!userRes.ok) {
      const err = await userRes.text();
      return new Response(JSON.stringify({ error: 'Failed to resolve user', detail: err }), {
        status: userRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const { data: user } = await userRes.json();

    // 2. Fetch last 10 tweets (excluding replies and retweets)
    const url = new URL(`https://api.twitter.com/2/users/${user.id}/tweets`);
    url.searchParams.set('max_results', '10');
    url.searchParams.set('exclude', 'replies,retweets');
    url.searchParams.set('tweet.fields', 'created_at,public_metrics,entities,attachments');
    url.searchParams.set('expansions', 'attachments.media_keys');
    url.searchParams.set('media.fields', 'url,preview_image_url,type');

    const tweetsRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!tweetsRes.ok) {
      const err = await tweetsRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch tweets', detail: err }), {
        status: tweetsRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const tweetsData = await tweetsRes.json();

    // Attach media map to response
    const mediaMap: Record<string, { url: string; type: string }> = {};
    if (tweetsData.includes?.media) {
      for (const m of tweetsData.includes.media) {
        mediaMap[m.media_key] = {
          url: m.url || m.preview_image_url || '',
          type: m.type,
        };
      }
    }

    return new Response(
      JSON.stringify({ tweets: tweetsData.data ?? [], mediaMap, username: TWITTER_USERNAME }),
      { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
