// utils/errorHandler.ts
import { Alert } from 'react-native';

export type ApiError = {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
};

export const handleApiError = (error: ApiError, context?: string): boolean => {
  // Return true if error was handled, false otherwise
  
  switch (error.status) {
    case 403:
      Alert.alert(
        "Queue Restricted",
        error.message || "You don't have permission to join this queue."
      );
      return true;
      
    case 422:
      console.log("Validation Errors:", error.errors);
      const messages = error.errors 
        ? Object.values(error.errors).flat().join('\n')
        : "Please check your input.";
      Alert.alert("Validation Error", messages);
      return true;
      
    case 401:
      // Let AuthContext handle session expiry
      return false;
      
    default:
      Alert.alert("Error", error.message || "Something went wrong.");
      return true;
  }
};