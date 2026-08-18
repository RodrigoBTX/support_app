import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { guardarApiUrl, obterApiUrl } from '../storage/settings';
import { api } from '../api/client';

/**
 * Ecrã de primeiro acesso. Só pede o endereço da API — a ligação ao SQL Server
 * fica inteiramente do lado do servidor (ver backend/README). "Testar Ligação"
 * confirma que a API está acessível e que ela própria consegue falar com a BD.
 */
export default function ConfigScreen({ navigation }: any) {
  const [apiUrl, setApiUrl] = useState('');
  const [estado, setEstado] = useState<'idle' | 'testando' | 'ok' | 'falhou'>('idle');

  async function testarLigacao() {
    setEstado('testando');
    try {
      const url = apiUrl.trim().replace(/\/$/, '');
      await guardarApiUrl(url);
      const resultado = await api.health();
      setEstado(resultado.sqlServer === 'ok' ? 'ok' : 'falhou');
    } catch (err: any) {
      setEstado('falhou');
      Alert.alert('Falha na ligação', err.message);
    }
  }

  async function guardarEContinuar() {
    if (estado !== 'ok') {
      Alert.alert('Testa a ligação primeiro', 'Confirma que a API responde antes de continuar.');
      return;
    }
    navigation.replace('Login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Configuração da Ligação</Text>
      <Text style={styles.descricao}>
        Define o endereço da API deste cliente. Isto só precisa de ser feito uma vez neste dispositivo.
      </Text>

      <Text style={styles.label}>Endereço da API</Text>
      <TextInput
        style={styles.input}
        placeholder="https://suporte.cliente.pt"
        value={apiUrl}
        onChangeText={setApiUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity style={styles.btnSecundario} onPress={testarLigacao} disabled={!apiUrl || estado === 'testando'}>
        <Text style={styles.btnSecundarioTexto}>{estado === 'testando' ? 'A testar...' : 'Testar Ligação'}</Text>
      </TouchableOpacity>

      {estado === 'ok' && <Text style={styles.statusOk}>● Ligação estabelecida</Text>}
      {estado === 'falhou' && <Text style={styles.statusFalhou}>● Não foi possível ligar</Text>}

      <TouchableOpacity style={styles.btnPrimario} onPress={guardarEContinuar}>
        <Text style={styles.btnPrimarioTexto}>Guardar e Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 72 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  descricao: { fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 24, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 16 },
  btnSecundario: { borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 12, padding: 13, alignItems: 'center' },
  btnSecundarioTexto: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusOk: { color: '#16a34a', fontWeight: '600', fontSize: 12, marginTop: 12 },
  statusFalhou: { color: '#dc2626', fontWeight: '600', fontSize: 12, marginTop: 12 },
});
