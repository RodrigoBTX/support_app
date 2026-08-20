import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { obterUtilizador, Utilizador } from '../storage/settings';

/**
 * Dados do técnico autenticado, tal como vieram do sp_ValidarUtilizador
 * (join de u_appacessos com cm4): nome, abreviatura (cmdesc), número de
 * técnico (cm) e email.
 */
export default function MeusDadosScreen({ navigation }: any) {
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null);

  useEffect(() => {
    obterUtilizador().then(setUtilizador);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
        <Text style={styles.voltar}>‹ Perfil</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Os meus dados</Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>{(utilizador?.abreviatura || utilizador?.nome || '?').slice(0, 2).toUpperCase()}</Text>
      </View>

      <View style={styles.infoRow}><Text style={styles.k}>Nome</Text><Text style={styles.v}>{utilizador?.nome || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Abreviatura</Text><Text style={styles.v}>{utilizador?.abreviatura || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Nº Técnico</Text><Text style={styles.v}>{utilizador?.tecnicoId ?? '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Email</Text><Text style={styles.v}>{utilizador?.email || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Utilizador</Text><Text style={styles.v}>{utilizador?.username || '—'}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  voltar: { color: '#2563eb', fontWeight: '700', fontSize: 13.5 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  k: { color: '#64748b', fontSize: 12.5 },
  v: { color: '#0f172a', fontWeight: '600', fontSize: 12.5 },
});
