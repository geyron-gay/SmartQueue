// services/ticketService.ts
import axiosClient from '../api/axios';

export const ticketService = {
  getStatus: async (id: string) => {
    const res = await axiosClient.get(`/queues/status/${id}`);
    return res.data;
  },

  cancelTicket: async (id: number) => {
    return await axiosClient.put(`/queues/${id}/cancel`, {
      status: "cancelled"
    });
  }
};