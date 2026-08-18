import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { api } from '../api/client';

export default function PedidoDetalheScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [pedido, setPedido] = useState<any>(null);
  const [aCarregar, setACarregar] = useState(true);
  const [aAssinar, setAAssinar] = useState(false);
  const assinaturaRef = useRef<any>(null);

  useEffect(() => {
    api.pedidoDetalhe(id).then(setPedido).catch((err) => Alert.alert('Erro', err.message)).finally(() => setACarregar(false));
  }, [id]);

  async function concluirComAssinatura(assinaturaBase64: string) {
    try {
      await api.concluirPedido(id, assinaturaBase64.replace(/^data:image\/\w+;base64,/, ''));
      Alert.alert('Pedido concluído', 'A intervenção foi registada com sucesso.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao concluir', err.message);
    }
  }

  if (aCarregar) return <ActivityIndicator style={{ marginTop: 100 }} />;

  if (aAssinar) {
    return (
      <SignatureScreen
        ref={assinaturaRef}
        onOK={concluirComAssinatura}
        onEmpty={() => Alert.alert('Assinatura em falta', 'Pede ao cliente para assinar antes de confirmar.')}
        descriptionText="Assinatura do cliente"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.estado}>{pedido?.Estado}</Text>
      <Text style={styles.titulo}>{pedido?.EquipamentoNome}</Text>
      <Text style={styles.sub}>Pedido #{pedido?.PedidoId} · {pedido?.Cliente}</Text>

      <Text style={styles.secao}>Descrição</Text>
      <Text style={styles.descricao}>{pedido?.Descricao}</Text>

      {/* Fotos da intervenção: adicionar via expo-image-picker + POST /pedidos/:id/fotos antes de concluir. */}

      <TouchableOpacity style={styles.btnPrimario} onPress={() => setAAssinar(true)}>
        <Text style={styles.btnPrimarioTexto}>Concluir Pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  estado: { fontSize: 11, fontWeight: '700', color: '#d97706', marginBottom: 8 },
  titulo: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 18 },
  secao: { fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 },
  descricao: { fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 20 },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
