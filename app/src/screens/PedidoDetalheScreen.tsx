import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { api } from '../api/client';
import { formatarData } from '../utils/formatarData';

/**
 * route.params.nopat — o pedido (pa). O pedido pode ter várias intervenções
 * (mh); o técnico escolhe uma para iniciar/continuar/concluir.
 */
export default function PedidoDetalheScreen({ route, navigation }: any) {
  const { nopat } = route.params;
  const [pedido, setPedido] = useState<any>(null);
  const [aCarregar, setACarregar] = useState(true);
  const [intervencaoAtiva, setIntervencaoAtiva] = useState<any>(null);
  const [relatorio, setRelatorio] = useState('');
  const [fotos, setFotos] = useState<{ uri: string; nome: string }[]>([]);
  const [aAssinar, setAAssinar] = useState(false);
  const [aProcessar, setAProcessar] = useState(false);

  async function carregar() {
    try {
      const dados = await api.pedidoDetalhe(nopat);
      setPedido(dados);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => { carregar(); }, [nopat]);

  async function iniciar(intervencao: any) {
    try {
      await api.iniciarIntervencao(nopat, intervencao.mhstamp);
      setIntervencaoAtiva(intervencao);
      await carregar();
    } catch (err: any) {
      Alert.alert('Erro ao iniciar', err.message);
    }
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão em falta', 'Autoriza o acesso à câmara para tirar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (resultado.canceled) return;
    const uri = resultado.assets[0].uri;
    setFotos((atual) => [...atual, { uri, nome: `foto_${atual.length + 1}.jpg` }]);
  }

  async function enviarFotosPendentes(mhstamp: string) {
    for (const foto of fotos) {
      await api.enviarFoto(nopat, mhstamp, foto.uri, foto.nome);
    }
  }

  async function concluirComAssinatura(assinaturaBase64: string) {
    if (!intervencaoAtiva) return;
    setAProcessar(true);
    try {
      await enviarFotosPendentes(intervencaoAtiva.mhstamp);
      await api.concluirIntervencao(
        nopat,
        intervencaoAtiva.mhstamp,
        relatorio,
        assinaturaBase64.replace(/^data:image\/\w+;base64,/, '')
      );
      Alert.alert('Intervenção concluída', 'Ficou tudo registado com sucesso.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao concluir', err.message);
    } finally {
      setAProcessar(false);
    }
  }

  if (aCarregar) return <ActivityIndicator style={{ marginTop: 100 }} />;
  if (!pedido) return <Text style={styles.erro}>Pedido não encontrado.</Text>;

  if (aAssinar) {
    return (
      <SignatureScreen
        onOK={concluirComAssinatura}
        onEmpty={() => Alert.alert('Assinatura em falta', 'Pede ao cliente para assinar antes de confirmar.')}
        descriptionText="Assinatura do cliente"
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.estado}>{pedido.situacao || pedido.status}</Text>
      <Text style={styles.titulo}>{pedido.maquina || pedido.marca}</Text>
      <Text style={styles.sub}>Pedido #{pedido.nopat} · {pedido.nome}</Text>

      <Text style={styles.secao}>Problema</Text>
      <Text style={styles.descricao}>{pedido.problema || 'Sem descrição.'}</Text>

      <Text style={styles.secao}>Intervenções</Text>
      {(pedido.intervencoes || []).length === 0 && (
        <Text style={styles.vazio}>Sem intervenções registadas para este pedido.</Text>
      )}
      {(pedido.intervencoes || []).map((interv: any) => {
        const ativa = intervencaoAtiva?.mhstamp === interv.mhstamp;
        return (
          <View key={interv.mhstamp} style={[styles.card, ativa && styles.cardAtivo]}>
            <Text style={styles.cardTitulo}>{interv.tipo || interv.mhtipo || 'Intervenção'}</Text>
            <Text style={styles.cardSub}>
              {formatarData(interv.data)} · {interv.hora || '—'}
              {interv.realizada ? ' · Concluída' : ' · Por fazer'}
            </Text>
            {!interv.realizada && !ativa && (
              <TouchableOpacity style={styles.btnSecundario} onPress={() => iniciar(interv)}>
                <Text style={styles.btnSecundarioTexto}>Iniciar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {intervencaoAtiva && (
        <View style={styles.painelAtivo}>
          <Text style={styles.secao}>Relatório desta intervenção</Text>
          <TextInput
            style={styles.input}
            value={relatorio}
            onChangeText={setRelatorio}
            multiline
            placeholder="Descreve o trabalho realizado..."
          />

          <Text style={styles.secao}>Fotos ({fotos.length})</Text>
          <View style={styles.fotosRow}>
            {fotos.map((f, i) => (
              <Image key={i} source={{ uri: f.uri }} style={styles.miniatura} />
            ))}
            <TouchableOpacity style={styles.btnFoto} onPress={escolherFoto}>
              <Text style={{ fontSize: 22, color: '#2563eb' }}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.btnPrimario}
            onPress={() => setAAssinar(true)}
            disabled={aProcessar}
          >
            <Text style={styles.btnPrimarioTexto}>{aProcessar ? 'A concluir...' : 'Concluir Intervenção'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  estado: { fontSize: 11, fontWeight: '700', color: '#d97706', marginBottom: 8 },
  titulo: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 18 },
  secao: { fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  descricao: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  vazio: { color: '#94a3b8', fontSize: 13 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 14, padding: 13, marginBottom: 10 },
  cardAtivo: { borderColor: '#2563eb', backgroundColor: '#eaf1ff' },
  cardTitulo: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 11, color: '#64748b', marginTop: 3 },
  btnSecundario: { marginTop: 10, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  btnSecundarioTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
  painelAtivo: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, padding: 13, fontSize: 13.5, minHeight: 80, textAlignVertical: 'top' },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  miniatura: { width: 64, height: 64, borderRadius: 10 },
  btnFoto: { width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  erro: { color: '#dc2626', margin: 20, marginTop: 100 },
});
