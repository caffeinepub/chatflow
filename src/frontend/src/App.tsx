import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import LoginButton from './components/LoginButton';
import ProfileSetupModal from './components/ProfileSetupModal';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || actorFetching) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Loading ChatFlow...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[oklch(0.75_0.15_145)] to-[oklch(0.65_0.18_165)]">
          <div className="text-center space-y-6 p-8 bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">ChatFlow</h1>
              <p className="text-muted-foreground">Connect with friends and family</p>
            </div>
            <div className="py-4">
              <LoginButton />
            </div>
            <p className="text-xs text-muted-foreground">
              Secure authentication powered by Internet Identity
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Layout />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}
