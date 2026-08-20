import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { limparTudo, limparSessao, obterUtilizador, Utilizador } from '../storage/settings';

export default function PerfilScreen({ navigation }: any) {
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null);

  useFocusEffect(
    useCallback(() => {
      obterUtilizador().then(setUtilizador);
    }, [])
  );

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

      <View style={styles.cartaoUtilizador}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{(utilizador?.abreviatura || utilizador?.nome || '?').slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nomeUtilizador}>{utilizador?.nome || 'A carregar...'}</Text>
          <Text style={styles.usernameUtilizador}>{utilizador?.username}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MeusDados')}>
        <Text style={styles.itemTitulo}>Os meus dados</Text>
        <Text style={styles.itemSub}>Nome, número de técnico, email</Text>
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
  cartaoUtilizador: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 22,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 15 },
  nomeUtilizador: { fontSize: 14.5, fontWeight: '700', color: '#0f172a' },
  usernameUtilizador: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  itemSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
});
