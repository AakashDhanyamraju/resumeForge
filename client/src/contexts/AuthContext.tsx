import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    emailVerified?: boolean;
    role: "admin" | "content_manager" | "user";
    aiEnabled: boolean;
    aiModel: string;
}

interface AuthContextType {
    user: User | null | undefined; // undefined = loading, null = not logged in, User = logged in
    login: () => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await fetch("/auth/me", { credentials: "include" });
            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        // Just refresh user state, actual login logic handled in components
        await fetchUser();
    };

    const logout = async () => {
        try {
            await fetch("/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            setUser(null);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, checkAuth: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
