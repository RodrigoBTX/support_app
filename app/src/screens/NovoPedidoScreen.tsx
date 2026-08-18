import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../api/client';

const PRIORIDADES = ['Baixa', 'Normal', 'Urgente'];

export default function NovoPedidoScreen({ route, navigation }: any) {
  const { equipamentoCodigo } = route.params || {};
  const [tipo, setTipo] = useState('Avaria / Reparação');
  const [prioridade, setPrioridade] = useState('Normal');
  const [descricao, setDescricao] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function criar() {
    if (!equipamentoCodigo || !descricao) {
      Alert.alert('Falta informação', 'Descreve o pedido antes de continuar.');
      return;
    }
    setAEnviar(true);
    try {
      const resultado = await api.criarPedido({ equipamentoCodigo, tipo, prioridade, descricao });
      navigation.replace('PedidoDetalhe', { id: resultado.PedidoId });
    } catch (err: any) {
      Alert.alert('Erro ao criar pedido', err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo Pedido de Assistência</Text>
      <Text style={styles.label}>Equipamento</Text>
      <Text style={styles.equipamentoValor}>{equipamentoCodigo}</Text>

      <Text style={styles.label}>Tipo de pedido</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} />

      <Text style={styles.label}>Prioridade</Text>
      <View style={styles.prioridadeRow}>
        {PRIORIDADES.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.prioridadeChip, prioridade === p && styles.prioridadeChipAtivo]}
            onPress={() => setPrioridade(p)}
          >
            <Text style={[styles.prioridadeTexto, prioridade === p && styles.prioridadeTextoAtivo]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        placeholder="Descreve o problema ou o trabalho a realizar..."
      />

      {/* Fotos: adicionar via expo-image-picker, enviadas depois em POST /pedidos/:id/fotos assim que o pedido existir. */}

      <TouchableOpacity style={styles.btnPrimario} onPress={criar} disabled={aEnviar}>
        <Text style={styles.btnPrimarioTexto}>{aEnviar ? 'A criar...' : 'Criar Pedido'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 4 },
  equipamentoValor: { fontSize: 13.5, fontWeight: '600', color: '#0f172a', marginBottom: 14 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 14 },
  prioridadeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  prioridadeChip: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  prioridadeChipAtivo: { borderColor: '#2563eb', backgroundColor: '#eaf1ff' },
  prioridadeTexto: { fontSize: 11.5, fontWeight: '700', color: '#64748b' },
  prioridadeTextoAtivo: { color: '#2563eb' },
  btnPrimario: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
