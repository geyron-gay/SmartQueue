import * as Location from 'expo-location';
import { useState, useEffect } from 'react';

interface UserLocation {
  latitude: number;
  longitude: number;
}
// 1. Add the distance calculation helper
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// 2. Updated Hook
export const useWalkAlert = (peopleAhead: number, officeCoords: UserLocation) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      // Logic: Only watch if they are next (1) or 2 people ahead
      if (peopleAhead > 2 || peopleAhead === 0) {
        setDistance(null);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 2, // Update every 2 meters to save battery
        },
        (loc) => {
          const d = getDistance(
            loc.coords.latitude,
            loc.coords.longitude,
            officeCoords.latitude,
            officeCoords.longitude
          );
          setDistance(Math.round(d));
        }
      );
    };

    startWatching();

    return () => subscription?.remove();
  }, [peopleAhead]); // Re-run when queue moves

  return { distance, errorMsg };
};