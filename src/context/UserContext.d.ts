export interface UserContextType {
  user: any;
  location: string;
  updateLocation: (city: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useUser(): UserContextType;
