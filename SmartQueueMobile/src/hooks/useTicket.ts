// hooks/useTicket.ts
import { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { TicketData } from '../types/ticket';

export const useTicket = (id: string | undefined) => {
const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!id) return;

    try {
      const result = await ticketService.getStatus(id);
      setData(result);
    } catch (error) {
      console.error("❌ Ticket fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [id]);

  return {
    data,
    loading,
    fetchStatus,
    setData
  };
};