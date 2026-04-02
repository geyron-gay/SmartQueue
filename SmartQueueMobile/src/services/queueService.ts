// services/queueService.ts
import axiosClient from '../api/axios';
import * as Location from 'expo-location';

export const queueService = {
  getOffices: async () => {
    const res = await axiosClient.get('/active-sessions');
    return res.data;
  },

  joinQueue: async (data: { purpose: string; department: string; year_level: string }) => {
    const res = await axiosClient.post('/join-queue', data);
    return res.data;
  },

  validateLocation: async (targetLat: number, targetLon: number, maxRadiusKm: number) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    const distance = getPrecisionDistance(
      location.coords.latitude,
      location.coords.longitude,
      targetLat,
      targetLon
    );

    if (distance > maxRadiusKm) {
      throw new Error(`Too far: ${Math.round(distance * 1000)}m away`);
    }
    
    return { distance, location };
  }
};

// Keep your Haversine function here or in utils/geo.ts
const getPrecisionDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};