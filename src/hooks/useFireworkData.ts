import { useEffect, useState } from 'react';
import { supabase, FireworkData } from '../lib/supabaseClient';

/**
 * Hook to fetch latest N firework records and subscribe to realtime inserts.
 */
export const useFireworkData = (limit = 20) => {
  const [fireworks, setFireworks] = useState<FireworkData[]>([]);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('fireworks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!ignore && data) setFireworks(data.reverse()); // older first
      if (error) console.error('Supabase fetch error', error.message);
    };
    fetchInitial();

    // realtime
    const channel = supabase.channel('public:fireworks');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fireworks' }, (payload) => {
      setFireworks((prev) => [...prev, payload.new as FireworkData].slice(-limit));
    });
    channel.subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return fireworks;
};
