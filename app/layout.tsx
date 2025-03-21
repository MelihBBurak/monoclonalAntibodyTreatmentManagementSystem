import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#25292e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Giriş Ekranı',
              headerLeft: () => null,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="about"
            options={{
              title: 'Profil Oluşturma Ekranı',
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              title: 'Profil',
            }}
          />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
});
