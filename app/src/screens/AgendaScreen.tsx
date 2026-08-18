import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { api } from '../api/client';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgendaScreen() {
  const [data] = useState(hojeISO());
  const [itens, setItens] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.agenda(data).then(setItens).catch((err) => setErro(err.message));
  }, [data]);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Agenda — {data}</Text>
      {erro && <Text style={styles.erro}>{erro}</Text>}
      <FlatList
        data={itens}
        keyExtractor={(item) => String(item.PedidoId)}
        ListEmptyComponent={!erro ? <Text style={styles.vazio}>Sem marcações para hoje.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.hora}>{item.HoraInicio} — {item.HoraFim}</Text>
            <Text style={styles.cardTitulo}>{item.EquipamentoNome}</Text>
            <Text style={styles.cardSub}>{item.Cliente}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  hora: { fontSize: 11, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
});
