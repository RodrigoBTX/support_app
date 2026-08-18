import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import EquipamentosScreen from '../screens/EquipamentosScreen';
import EquipamentoDetalheScreen from '../screens/EquipamentoDetalheScreen';
import LeitorQRScreen from '../screens/LeitorQRScreen';
import AgendaScreen from '../screens/AgendaScreen';
import NovoPedidoScreen from '../screens/NovoPedidoScreen';
import PedidoDetalheScreen from '../screens/PedidoDetalheScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Tab = createBottomTabNavigator();
const StackEquipamentos = createNativeStackNavigator();
const StackRaiz = createNativeStackNavigator();

function EquipamentosStack() {
  return (
    <StackEquipamentos.Navigator screenOptions={{ headerShown: false }}>
      <StackEquipamentos.Screen name="EquipamentosLista" component={EquipamentosScreen} />
      <StackEquipamentos.Screen name="LeitorQR" component={LeitorQRScreen} />
    </StackEquipamentos.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb' }}>
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Equipamentos" component={EquipamentosStack} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

/** Stack de topo para permitir navegar de qualquer tab para ecrãs de detalhe/ação. */
export default function TabsPrincipais() {
  return (
    <StackRaiz.Navigator screenOptions={{ headerShown: false }}>
      <StackRaiz.Screen name="Tabs" component={Tabs} />
      <StackRaiz.Screen name="EquipamentoDetalhe" component={EquipamentoDetalheScreen} />
      <StackRaiz.Screen name="NovoPedido" component={NovoPedidoScreen} />
      <StackRaiz.Screen name="PedidoDetalhe" component={PedidoDetalheScreen} />
    </StackRaiz.Navigator>
  );
}
