import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { COLORS } from '../utils/styles';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 17,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="about"
            options={{
              title: 'Profil Oluştur',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              title: 'Tedavi Özeti',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="calendar"
            options={{
              title: 'Tedavi Takvimi',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="symptom-log"
            options={{
              title: 'Semptom Kaydı',
              headerBackTitle: 'Takvim',
            }}
          />
          <Stack.Screen
            name="data-manager"
            options={{
              title: 'Veri Yönetimi',
              headerBackTitle: 'Takvim',
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});
