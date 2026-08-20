import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { formatarData } from '../utils/formatarData';

export default function EquipamentoDetalheScreen({ route, navigation }: any) {
  const { codigo } = route.params;
  const [unidades, setUnidades] = useState<any[]>([]);
  const [equipamento, setEquipamento] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // GET /equipamentos/:codigo devolve sempre uma lista (pode haver mais
        // do que uma unidade se "codigo" for um "ref" partilhado).
        const lista = await api.equipamento(codigo);
        setUnidades(lista);
        if (lista.length === 1) {
          setEquipamento(lista[0]);
          const hist = await api.historicoEquipamento(lista[0].mastamp);
          setHistorico(hist);
        }
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setACarregar(false);
      }
    })();
  }, [codigo]);

  if (aCarregar) return <ActivityIndicator style={{ marginTop: 100 }} />;
  if (erro) return <Text style={styles.erro}>{erro}</Text>;

  // Mais do que uma unidade encontrada (ex: leste um QR com uma "ref" partilhada) — escolher qual.
  if (!equipamento && unidades.length > 1) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.nome}>Escolhe a unidade</Text>
        <Text style={styles.codigo}>{unidades.length} equipamentos encontrados para "{codigo}"</Text>
        {unidades.map((u) => (
          <TouchableOpacity
            key={u.mastamp}
            style={styles.card}
            onPress={() => navigation.replace('EquipamentoDetalhe', { codigo: u.mastamp })}
          >
            <Text style={styles.cardTitulo}>{u.design} — Série {u.serie || '—'}</Text>
            <Text style={styles.cardSub}>{u.local || u.morada || '—'} · {u.situacao || '—'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (!equipamento) {
    return <Text style={styles.erro}>Equipamento não encontrado.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.nome}>{equipamento.design}</Text>
      <Text style={styles.codigo}>{equipamento.ref} · Série {equipamento.serie || '—'}</Text>

      <View style={styles.infoRow}><Text style={styles.k}>Tipo</Text><Text style={styles.v}>{equipamento.tipo || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Marca</Text><Text style={styles.v}>{equipamento.marca || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Máquina</Text><Text style={styles.v}>{equipamento.maquina || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Situação</Text><Text style={styles.v}>{equipamento.situacao || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Local</Text><Text style={styles.v}>{equipamento.local || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Morada</Text><Text style={styles.v}>{equipamento.morada || '—'}</Text></View>
      <View style={styles.infoRow}><Text style={styles.k}>Instalação</Text><Text style={styles.v}>{formatarData(equipamento.instal)}</Text></View>

      <Text style={styles.secao}>Histórico de intervenções</Text>
      {historico.length === 0 && <Text style={styles.vazio}>Sem intervenções registadas.</Text>}
      {historico.map((h) => (
        <TouchableOpacity
          key={h.mhstamp}
          style={styles.card}
          onPress={() => navigation.navigate('PedidoDetalhe', { nopat: h.nopat })}
        >
          <Text style={styles.cardTitulo}>{h.tipo || h.mhtipo || 'Intervenção'}</Text>
          <Text style={styles.cardSub}>{formatarData(h.datapat)} · {h.tecnnm || `Técnico ${h.tecnico}`}</Text>
          {!!h.relatorio && <Text style={styles.cardResumo} numberOfLines={2}>{h.relatorio}</Text>}
        </TouchableOpacity>
      ))}
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
  cardResumo: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  erro: { color: '#dc2626', margin: 20, marginTop: 100 },
});
