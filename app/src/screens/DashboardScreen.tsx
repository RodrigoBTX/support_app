import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

export default function DashboardScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro(null);
    try {
      const dados = await api.pedidosAgendados();
      setPedidos(dados);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Próximos Agendados</Text>
      {erro && <Text style={styles.erro}>{erro}</Text>}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => String(item.PedidoId)}
        refreshControl={<RefreshControl refreshing={aCarregar} onRefresh={carregar} />}
        ListEmptyComponent={!aCarregar && !erro ? <Text style={styles.vazio}>Sem pedidos agendados de momento.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>{item.EquipamentoNome}</Text>
            <Text style={styles.cardSub}>{item.Cliente} · {item.DataHora}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 3 },
});
