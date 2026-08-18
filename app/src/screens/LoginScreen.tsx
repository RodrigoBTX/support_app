import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as Application from 'expo-application';
import { api } from '../api/client';
import { guardarToken } from '../storage/settings';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  async function entrar() {
    if (!username || !password) return;
    setAEntrar(true);
    try {
      const deviceId = Application.getAndroidId?.() || `${Platform.OS}-${Date.now()}`;
      const resposta = await api.login({
        username,
        password,
        deviceId,
        deviceName: Platform.OS,
        platform: Platform.OS,
        appVersion: '0.1.0',
      });
      await guardarToken(resposta.token);
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert('Não foi possível entrar', err.message);
    } finally {
      setAEntrar(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appNome}>Gestão de Suporte</Text>
      <Text style={styles.appSub}>Equipamentos & Pedidos de Assistência</Text>

      <Text style={styles.label}>Utilizador</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btnPrimario} onPress={entrar} disabled={aEntrar}>
        <Text style={styles.btnPrimarioTexto}>{aEntrar ? 'A entrar...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Config')} style={{ marginTop: 20 }}>
        <Text style={styles.link}>Alterar configuração da ligação</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 96, alignItems: 'stretch' },
  appNome: { fontSize: 19, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  appSub: { fontSize: 12.5, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 32 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 16 },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#2563eb', fontWeight: '600', fontSize: 12.5, textAlign: 'center' },
});
