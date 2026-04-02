// hooks/useActiveTickets.ts
import { useState, useCallback } from 'react';
import axiosClient from '../api/axios';

export const useActiveTickets = (userId: string | null) => {
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await axiosClient.get('user/active-tickets');
      setActiveTickets(response.data.tickets);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { activeTickets, loading, fetchTickets, setActiveTickets };
};