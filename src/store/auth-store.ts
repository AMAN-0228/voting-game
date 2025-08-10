import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types for auth state
export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface AuthState {
  // User data
  user: User | null
  isAuthenticated: boolean
  
  // Auth flow states
  isLoading: boolean
  isRegistering: boolean
  isLoggingIn: boolean
  
  // Error states
  authError: string | null
  registrationError: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setIsAuthenticated: (authenticated: boolean) => void
  
  setIsLoading: (loading: boolean) => void
  setIsRegistering: (registering: boolean) => void
  setIsLoggingIn: (loggingIn: boolean) => void
  
  setAuthError: (error: string | null) => void
  setRegistrationError: (error: string | null) => void
  
  // Auth actions
  login: (user: User) => void
  logout: () => void
  
  // Reset functions
  clearErrors: () => void
  resetAuthState: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        
        isLoading: false,
        isRegistering: false,
        isLoggingIn: false,
        
        authError: null,
        registrationError: null,
        
        // Actions
        setUser: (user) => set({ 
          user,
          isAuthenticated: !!user 
        }),
        
        setIsAuthenticated: (authenticated) => set({ 
          isAuthenticated: authenticated 
        }),
        
        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsRegistering: (registering) => set({ isRegistering: registering }),
        setIsLoggingIn: (loggingIn) => set({ isLoggingIn: loggingIn }),
        
        setAuthError: (error) => set({ authError: error }),
        setRegistrationError: (error) => set({ registrationError: error }),
        
        // Auth actions
        login: (user) => set({
          user,
          isAuthenticated: true,
          authError: null,
          isLoggingIn: false,
        }),
        
        logout: () => set({
          user: null,
          isAuthenticated: false,
          authError: null,
          isLoading: false,
          isLoggingIn: false,
        }),
        
        clearErrors: () => set({
          authError: null,
          registrationError: null,
        }),
        
        resetAuthState: () => set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isRegistering: false,
          isLoggingIn: false,
          authError: null,
          registrationError: null,
        }),
      }),
      {
        name: 'auth-store',
        // Only persist user data and authentication status
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)
