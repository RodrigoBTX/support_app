import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

/**
 * Lê o QR code de um equipamento e navega diretamente para o detalhe.
 * O texto lido pode ser um mastamp, um serie ou um ref — sp_ObterEquipamentos
 * resolve qualquer um dos três (ver CONTRATO_SPS.md).
 */
export default function LeitorQRScreen({ navigation }: any) {
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [lido, setLido] = useState(false);

  if (!permissao) return <View style={styles.container} />;
  if (!permissao.granted) {
    pedirPermissao();
    return (
      <View style={styles.container}>
        <Text style={styles.texto}>A pedir permissão de câmara...</Text>
      </View>
    );
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={({ data }) => {
        if (lido) return;
        setLido(true);
        navigation.replace('EquipamentoDetalhe', { codigo: data });
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  texto: { color: '#fff' },
});
