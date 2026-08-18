import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { limparTudo, limparSessao } from '../storage/settings';

export default function PerfilScreen({ navigation }: any) {
  async function terminarSessao() {
    await limparSessao();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  async function esquecerLigacao() {
    Alert.alert('Alterar configuração', 'Isto vai limpar o endereço da API guardado neste dispositivo. Confirmas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          await limparTudo();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Config' }] });
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfil</Text>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemTitulo}>Os meus dados</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemTitulo}>Notificações</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={esquecerLigacao}>
        <Text style={styles.itemTitulo}>Configuração da ligação</Text>
        <Text style={styles.itemSub}>Endereço da API</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={terminarSessao}>
        <Text style={[styles.itemTitulo, { color: '#dc2626' }]}>Terminar sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  itemSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
});
