import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../api/client';

export default function EquipamentoDetalheScreen({ route, navigation }: any) {
  const { codigo } = route.params;
  const [equipamento, setEquipamento] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [dadosEquip, dadosHist] = await Promise.all([
          api.equipamento(codigo),
          api.historicoEquipamento(codigo),
        ]);
        setEquipamento(dadosEquip);
        setHistorico(dadosHist);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setACarregar(false);
      }
    })();
  }, [codigo]);

  if (aCarregar) return <ActivityIndicator style={{ marginTop: 100 }} />;
  if (erro) return <Text style={styles.erro}>{erro}</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.nome}>{equipamento?.Nome}</Text>
      <Text style={styles.codigo}>{equipamento?.Codigo} · {equipamento?.Cliente}</Text>

      <View style={styles.infoRow}><Text style={styles.k}>Nº Série</Text><Text style={styles.v}>{equipamento?.NumeroSerie}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Localização</Text><Text style={styles.v}>{equipamento?.Localizacao}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Instalado em</Text><Text style={styles.v}>{equipamento?.DataInstalacao}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Estado</Text><Text style={styles.v}>{equipamento?.Estado}</Text></View>

      <Text style={styles.secao}>Últimas intervenções</Text>
      {historico.length === 0 && <Text style={styles.vazio}>Sem intervenções registadas.</Text>}
      {historico.map((h) => (
        <View key={h.PedidoId} style={styles.card}>
          <Text style={styles.cardTitulo}>{h.Tipo}</Text>
          <Text style={styles.cardSub}>{h.DataHora} · {h.TecnicoNome}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NovoPedido', { equipamentoCodigo: equipamento?.Codigo })}
      >
        <Text style={styles.fabTexto}>+ Novo Pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  nome: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  codigo: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  k: { color: '#64748b', fontSize: 12.5 },
  v: { color: '#0f172a', fontWeight: '600', fontSize: 12.5 },
  secao: { fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  vazio: { color: '#94a3b8', fontSize: 13 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardTitulo: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11, color: '#64748b', marginTop: 3 },
  fab: { backgroundColor: '#2563eb', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  fabTexto: { color: '#fff', fontWeight: '700' },
  erro: { color: '#dc2626', margin: 20, marginTop: 100 },
});
