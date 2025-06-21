import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

/**
 * Ana layout bileşeni
 * Uygulamanın navigasyon yapısını ve genel düzenini tanımlar
 * Tüm sayfalar için ortak header stilleri ve navigasyon ayarları
 */
export default function Layout() {
  return (
    // SafeAreaProvider - iOS'ta notch ve home indicator alanlarını yönetir
    <SafeAreaProvider>
      {/* GestureHandlerRootView - React Native Gesture Handler için gerekli wrapper */}
      <GestureHandlerRootView style={styles.container}>
        {/* Stack Navigator - Sayfalar arası geçişleri yönetir */}
        <Stack
          screenOptions={{
            // Tüm sayfalar için ortak header stili
            headerStyle: {
              backgroundColor: '#25292e', // Koyu gri header arka planı
            },
            headerTintColor: '#fff', // Header metin rengi (beyaz)
            headerTitleStyle: {
              fontWeight: 'bold', // Header başlık kalın yazı
            },
          }}
        >
          {/* Ana giriş sayfası - header gizli */}
          <Stack.Screen
            name="index"
            options={{
              title: 'Giriş Ekranı',
              headerLeft: () => null, // Geri butonu yok
              headerShown: false, // Header tamamen gizli
            }}
          />
          {/* Tedavi bilgileri form sayfası */}
          <Stack.Screen
            name="about"
            options={{
              title: 'Profil Oluşturma Ekranı',
            }}
          />
          {/* Profil özet sayfası */}
          <Stack.Screen
            name="profile"
            options={{
              title: 'Profil',
            }}
          />
          {/* Takvim sayfası */}
          <Stack.Screen
            name="calendar"
            options={{
              title: 'Takvim',
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// Layout stilleri
const styles = StyleSheet.create({
  // Ana container - tüm uygulamayı kaplar
  container: {
    flex: 1,
    backgroundColor: '#25292e', // Koyu gri arka plan
  },
});
