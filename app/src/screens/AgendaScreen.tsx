import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { api } from '../api/client';

const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // semana começa em segunda
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function paraISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function primeiroDiaDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function ultimoDiaDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Gera a grelha do calendário (6 semanas x 7 dias), com dias do mês anterior/seguinte para preencher. */
function gerarGrelha(mesVisivel: Date) {
  const primeiro = primeiroDiaDoMes(mesVisivel);
  const ultimo = ultimoDiaDoMes(mesVisivel);
  // getDay(): 0=Domingo..6=Sábado -> converter para semana começada em Segunda (0=Segunda..6=Domingo)
  const offsetInicio = (primeiro.getDay() + 6) % 7;

  const dias: { data: Date; noMes: boolean }[] = [];
  for (let i = offsetInicio; i > 0; i--) {
    dias.push({ data: new Date(primeiro.getFullYear(), primeiro.getMonth(), 1 - i), noMes: false });
  }
  for (let dia = 1; dia <= ultimo.getDate(); dia++) {
    dias.push({ data: new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), dia), noMes: true });
  }
  while (dias.length % 7 !== 0 || dias.length < 35) {
    const ultimaData = dias[dias.length - 1].data;
    dias.push({ data: new Date(ultimaData.getFullYear(), ultimaData.getMonth(), ultimaData.getDate() + 1), noMes: false });
  }
  return dias;
}

export default function AgendaScreen({ navigation }: any) {
  const hojeISO = paraISO(new Date());
  const [mesVisivel, setMesVisivel] = useState(() => primeiroDiaDoMes(new Date()));
  const [diaSelecionado, setDiaSelecionado] = useState(hojeISO);
  const [itens, setItens] = useState<any[]>([]);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarMes = useCallback(async (mes: Date) => {
    setACarregar(true);
    setErro(null);
    try {
      const inicio = paraISO(primeiroDiaDoMes(mes));
      const fim = paraISO(ultimoDiaDoMes(mes));
      const dados = await api.agenda(inicio, fim);
      setItens(dados);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => { carregarMes(mesVisivel); }, [mesVisivel, carregarMes]);

  const diasComItens = useMemo(() => {
    const set = new Set<string>();
    for (const item of itens) {
      if (item.Data) set.add(String(item.Data).slice(0, 10));
    }
    return set;
  }, [itens]);

  const itensDoDia = useMemo(
    () => itens.filter((item) => String(item.Data).slice(0, 10) === diaSelecionado),
    [itens, diaSelecionado]
  );

  const grelha = useMemo(() => gerarGrelha(mesVisivel), [mesVisivel]);

  function mudarMes(delta: number) {
    const novo = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1);
    setMesVisivel(novo);
    setDiaSelecionado(paraISO(novo));
  }

  const tituloDia = useMemo(() => {
    const [ano, mes, dia] = diaSelecionado.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [diaSelecionado]);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Agenda</Text>

      <View style={styles.calendario}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => mudarMes(-1)}><Text style={styles.calNav}>‹</Text></TouchableOpacity>
          <Text style={styles.calMes}>{MESES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}</Text>
          <TouchableOpacity onPress={() => mudarMes(1)}><Text style={styles.calNav}>›</Text></TouchableOpacity>
        </View>

        <View style={styles.calGrid}>
          {DIAS_SEMANA.map((d, i) => (
            <Text key={i} style={styles.calDow}>{d}</Text>
          ))}
          {grelha.map(({ data, noMes }, i) => {
            const iso = paraISO(data);
            const temItens = diasComItens.has(iso);
            const selecionado = iso === diaSelecionado;
            const ehHoje = iso === hojeISO;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.calDia, selecionado && styles.calDiaSelecionado, ehHoje && !selecionado && styles.calDiaHoje]}
                onPress={() => setDiaSelecionado(iso)}
              >
                <Text style={[styles.calDiaTexto, !noMes && styles.calDiaOutroMes, selecionado && styles.calDiaTextoSelecionado, ehHoje && !selecionado && styles.calDiaTextoHoje]}>
                  {data.getDate()}
                </Text>
                {temItens && <View style={[styles.ponto, selecionado && styles.pontoSelecionado]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      <Text style={styles.listaTitulo}>{tituloDia}</Text>

      <FlatList
        data={itensDoDia}
        keyExtractor={(item, index) => item.MxStamp || item.MhId || String(index)}
        ListEmptyComponent={!erro && !aCarregar ? <Text style={styles.vazio}>Sem marcações neste dia.</Text> : null}
        renderItem={({ item }) => {
          const ehIntervencao = item.Origem === 'Intervencao';
          return (
            <TouchableOpacity
              style={styles.card}
              disabled={!ehIntervencao}
              onPress={() => ehIntervencao && navigation.navigate('PedidoDetalhe', { nopat: item.MhNopat })}
            >
              <Text style={styles.hora}>{item.HoraInicio || '—'} — {item.HoraFim || '—'}</Text>
              <Text style={styles.cardTitulo}>
                {ehIntervencao ? (item.MhNome || 'Intervenção') : (item.MxTexto || item.MxClNome || 'Marcação')}
              </Text>
              <Text style={styles.cardSub}>
                {ehIntervencao ? 'Intervenção de assistência' : (item.MxClNome || 'Marcação geral')}
              </Text>
              <View style={[styles.badge, ehIntervencao ? styles.badgeIntervencao : styles.badgeMarcacao]}>
                <Text style={[styles.badgeTexto, ehIntervencao ? styles.badgeTextoIntervencao : styles.badgeTextoMarcacao]}>
                  {ehIntervencao ? 'Intervenção' : 'Marcação'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },

  calendario: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 12, marginBottom: 16 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  calMes: { fontSize: 13.5, fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' },
  calNav: { color: '#2563eb', fontWeight: '700', fontSize: 17, width: 26, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 10, color: '#94a3b8', fontWeight: '700', paddingBottom: 4 },
  calDia: { width: `${100 / 7}%`, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calDiaSelecionado: { backgroundColor: '#2563eb' },
  calDiaHoje: { borderWidth: 1.5, borderColor: '#2563eb' },
  calDiaTexto: { fontSize: 12.5, color: '#334155' },
  calDiaOutroMes: { color: '#cbd5e1' },
  calDiaTextoSelecionado: { color: '#fff', fontWeight: '700' },
  calDiaTextoHoje: { color: '#2563eb', fontWeight: '700' },
  ponto: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: '#f59e0b' },
  pontoSelecionado: { backgroundColor: '#fff' },

  listaTitulo: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'capitalize', marginBottom: 10 },
  erro: { color: '#dc2626', fontSize: 12.5, marginBottom: 12 },
  vazio: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  hora: { fontSize: 11, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  cardTitulo: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  badgeIntervencao: { backgroundColor: '#eaf1ff' },
  badgeMarcacao: { backgroundColor: '#fef3c7' },
  badgeTexto: { fontSize: 9.5, fontWeight: '700' },
  badgeTextoIntervencao: { color: '#2563eb' },
  badgeTextoMarcacao: { color: '#b45309' },
});
