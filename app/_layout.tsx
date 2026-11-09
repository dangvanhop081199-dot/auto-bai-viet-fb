import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { AuthScreen } from '@/components/auth-screen';
import { C } from '@/components/bazan-ui';
import { ActivityIndicator } from 'react-native';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isSignedIn, userId, getToken, isLoaded } = useAuth();
  const [readyUser, setReadyUser] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    queryClient.clear();
    setAuthTokenGetter(isSignedIn ? () => getToken() : null);
    setReadyUser(userId ?? null);
    return () => setAuthTokenGetter(null);
  }, [userId, isSignedIn, getToken]);
  if (!isLoaded || readyUser !== (userId ?? null)) return <ActivityIndicator color={C.primary} />;
  if (!isSignedIn) return <AuthScreen />;
  return (
    <Stack screenOptions={{ headerBackTitle: 'Quay lại', headerTintColor: C.primary, headerTitleStyle: { fontFamily: 'BeVietnamPro_600SemiBold' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/[screen]" options={{ title: 'Điều hành' }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Chi tiết bài viết' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!} proxyUrl={process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined} tokenCache={tokenCache}>
          <ClerkLoaded>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
          </ClerkLoaded>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
