import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

export default function EquipamentosScreen({ navigation }: any) {
  const [pesquisa, setPesquisa] = useState('');
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (texto?: string) => {
    setErro(null);
    try {
      const dados = await api.equipamentos(texto);
      setEquipamentos(dados);
    } catch (err: any) {
      setErro(err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Equipamentos</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por nome, código, cliente..."
          value={pesquisa}
          onChangeText={setPesquisa}
          onSubmitEditing={() => carregar(pesquisa)}
        />
        <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('LeitorQR')}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>QR</Text>
        </TouchableOpacity>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      <FlatList
        data={equipamentos}
        keyExtractor={(item) => item.Codigo}
        ListEmptyComponent={!erro ? <Text style={styles.vazio}>Sem equipamentos para mostrar.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EquipamentoDetalhe', { codigo: item.Codigo })}>
            <Text style={styles.cardTitulo}>{item.Nome}</Text>
            <Text style={styles.cardSub}>{item.Codigo} · {item.Cliente}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, fontSize: 13.5 },
  qrBtn: { width: 44, backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 3 },
});
