import { createContext, useContext } from "react";

// Export the context so UserProvider can use it
export const UserContext = createContext();

// Custom hook for the context
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};