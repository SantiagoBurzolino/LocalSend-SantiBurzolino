// App.js
// Punto de entrada de la app mobile.
// Su única responsabilidad es configurar la navegación
// y los estilos globales. Nada más.

import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import PantallaRadar from './src/pantallas/PantallaRadar'
import PantallaEnvio from './src/pantallas/PantallaEnvio'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          // Tema oscuro para toda la app
          headerStyle: { backgroundColor: '#1a1a24' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0f0f13' },
        }}
      >
        {/* Pantalla 1: radar de dispositivos */}
        <Stack.Screen
          name="Radar"
          component={PantallaRadar}
          options={{ title: 'LocalSend' }}
        />
        {/* Pantalla 2: seleccionar archivo y enviar */}
        <Stack.Screen
          name="Envio"
          component={PantallaEnvio}
          options={{ title: 'Enviar archivo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}