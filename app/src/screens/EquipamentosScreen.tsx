import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

/**
 * A mesma "ref" (modelo) pode ter várias unidades físicas (séries diferentes,
 * em locais/situações diferentes) — ver ma.ref vs ma.mastamp/ma.serie no
 * CONTRATO_SPS.md. Por isso agrupamos por ref: a lista mostra um cartão por
 * modelo, e ao tocar expande para as unidades individuais (mastamp).
 */
function agruparPorRef(equipamentos: any[]) {
  const grupos = new Map<string, any[]>();
  for (const eq of equipamentos) {
    const chave = eq.ref || eq.mastamp;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(eq);
  }
  return Array.from(grupos.entries()).map(([ref, unidades]) => ({ ref, unidades }));
}

export default function EquipamentosScreen({ navigation }: any) {
  const [pesquisa, setPesquisa] = useState('');
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
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

  // Carrega sempre que o ecrã ganha foco, com a pesquisa atual (ex: voltar
  // do detalhe de um equipamento deve manter o filtro escrito).
  useFocusEffect(useCallback(() => { carregar(pesquisa || undefined); }, [carregar, pesquisa]));

  // Pesquisa em tempo real: espera 350ms depois de parares de escrever antes
  // de ir à API, para não disparar um pedido a cada letra.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregar(pesquisa || undefined);
    }, 350);
    return () => clearTimeout(temporizador);
  }, [pesquisa, carregar]);

  const grupos = useMemo(() => agruparPorRef(equipamentos), [equipamentos]);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Equipamentos</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por referência, série..."
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
        data={grupos}
        keyExtractor={(grupo) => grupo.ref}
        ListEmptyComponent={!erro ? <Text style={styles.vazio}>Sem equipamentos para mostrar.</Text> : null}
        renderItem={({ item: grupo }) => {
          const principal = grupo.unidades[0];
          const aberto = expandido === grupo.ref;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => {
                  if (grupo.unidades.length === 1) {
                    navigation.navigate('EquipamentoDetalhe', { codigo: principal.mastamp });
                  } else {
                    setExpandido(aberto ? null : grupo.ref);
                  }
                }}
              >
                <Text style={styles.cardTitulo}>{principal.design || principal.ref}</Text>
                <Text style={styles.cardSub}>
                  {grupo.ref} · {grupo.unidades.length} unidade{grupo.unidades.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>

              {aberto && grupo.unidades.map((unidade: any) => (
                <TouchableOpacity
                  key={unidade.mastamp}
                  style={styles.unidadeRow}
                  onPress={() => navigation.navigate('EquipamentoDetalhe', { codigo: unidade.mastamp })}
                >
                  <Text style={styles.unidadeSerie}>Série {unidade.serie || '—'}</Text>
                  <Text style={styles.unidadeInfo}>{unidade.local || unidade.morada || '—'} · {unidade.situacao || '—'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, height: 46, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, fontSize: 14.5 },
  qrBtn: { width: 46, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 3 },
  unidadeRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 10, marginTop: 8 },
  unidadeSerie: { fontSize: 12.5, fontWeight: '700', color: '#2563eb' },
  unidadeInfo: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
