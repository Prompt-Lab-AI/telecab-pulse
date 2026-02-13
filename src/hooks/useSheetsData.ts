import { useState, useEffect, useCallback } from 'react';
import { fetchAllSheets, PapData, VendaData, MetaData } from '@/lib/sheets';
import { useToast } from '@/hooks/use-toast';

export function useSheetsData(refreshInterval = 30000) {
  const [paps, setPaps] = useState<PapData[]>([]);
  const [vendas, setVendas] = useState<VendaData[]>([]);
  const [metas, setMetas] = useState<MetaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllSheets();
      setPaps(data.paps);
      setVendas(data.vendas);
      setMetas(data.metas);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      toast({
        title: 'Erro ao atualizar dados',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { paps, vendas, metas, loading, lastUpdate, refetch: fetchData };
}
