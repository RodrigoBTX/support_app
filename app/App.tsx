import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConfigScreen from './src/screens/ConfigScreen';
import LoginScreen from './src/screens/LoginScreen';
import TabsPrincipais from './src/navigation/TabsPrincipais';
import { obterApiUrl } from './src/storage/settings';

const Stack = createNativeStackNavigator();

/**
 * Ecrã inicial "invisível": decide se vai para Config ou Login consoante já
 * exista (ou não) um endereço de API guardado neste dispositivo.
 */
function EcraInicial({ navigation }: any) {
  useEffect(() => {
    (async () => {
      const apiUrl = await obterApiUrl();
      navigation.replace(apiUrl ? 'Login' : 'Config');
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Inicial" component={EcraInicial} />
        <Stack.Screen name="Config" component={ConfigScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={TabsPrincipais} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
