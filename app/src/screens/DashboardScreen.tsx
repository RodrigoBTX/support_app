import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { formatarData } from '../utils/formatarData';

type Separador = 'agendadas' | 'realizadas';

export default function DashboardScreen({ navigation }: any) {
  const [separador, setSeparador] = useState<Separador>('agendadas');
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (sep: Separador) => {
    setACarregar(true);
    setErro(null);
    try {
      // sp_ObterPedidosTecnico: Realizada=0 (mais próxima primeiro) ou
      // Realizada=1, Top=5 (mais recente primeiro).
      const dados = sep === 'agendadas' ? await api.pedidosAgendados() : await api.pedidosRealizados(5);
      setIntervencoes(dados);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(separador); }, [carregar, separador]));

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Início</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, separador === 'agendadas' && styles.tabAtivo]}
          onPress={() => setSeparador('agendadas')}
        >
          <Text style={[styles.tabTexto, separador === 'agendadas' && styles.tabTextoAtivo]}>Agendadas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, separador === 'realizadas' && styles.tabAtivo]}
          onPress={() => setSeparador('realizadas')}
        >
          <Text style={[styles.tabTexto, separador === 'realizadas' && styles.tabTextoAtivo]}>Últimas Realizadas</Text>
        </TouchableOpacity>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      <FlatList
        data={intervencoes}
        keyExtractor={(item) => item.mhstamp}
        refreshControl={<RefreshControl refreshing={aCarregar} onRefresh={() => carregar(separador)} />}
        ListEmptyComponent={
          !aCarregar && !erro ? (
            <Text style={styles.vazio}>
              {separador === 'agendadas' ? 'Sem intervenções agendadas de momento.' : 'Ainda não há intervenções concluídas.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PedidoDetalhe', { nopat: item.nopat })}>
            <Text style={styles.cardTitulo}>{item.maquina || item.marca || 'Equipamento'}</Text>
            <Text style={styles.cardSub}>{item.Cliente} · {formatarData(item.data)}</Text>
            <View style={[styles.badge, item.realizada ? styles.badgeConcluida : styles.badgePendente]}>
              <Text style={[styles.badgeTexto, item.realizada ? styles.badgeTextoConcluida : styles.badgeTextoPendente]}>
                {item.realizada ? 'Concluída' : 'Por fazer'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  tabAtivo: { backgroundColor: '#fff', shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabTexto: { fontSize: 12.5, fontWeight: '700', color: '#64748b' },
  tabTextoAtivo: { color: '#2563eb' },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 3 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  badgePendente: { backgroundColor: '#fef3c7' },
  badgeConcluida: { backgroundColor: '#dcfce7' },
  badgeTexto: { fontSize: 9.5, fontWeight: '700' },
  badgeTextoPendente: { color: '#b45309' },
  badgeTextoConcluida: { color: '#15803d' },
});
