// src/pantallas/PantallaRadar.js
// Pantalla principal del mobile.
// Muestra el radar de dispositivos y permite seleccionar uno para enviarle.
// Responsabilidad única: UI del radar. La lógica está en useDescubrimiento.

import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { useDescubrimiento } from '../hooks/useDescubrimiento'

export default function PantallaRadar({ navigation }) {
  const { dispositivos, esBuscando, error, ipLocal, refrescar } = useDescubrimiento()

  // Al tocar un dispositivo, navegamos a la pantalla de envío
  // Le pasamos la info del dispositivo como parámetro de navegación
  function seleccionarDispositivo(dispositivo) {
    navigation.navigate('Envio', { dispositivo })
  }

  function renderizarDispositivo({ item }) {
    return (
      <TouchableOpacity
        style={estilos.tarjetaDispositivo}
        onPress={() => seleccionarDispositivo(item)}
        activeOpacity={0.7}
      >
        <Text style={estilos.iconoDispositivo}>🖥️</Text>
        <View style={estilos.infoDispositivo}>
          <Text style={estilos.aliasDispositivo}>
            {item.alias || 'Desktop'}
          </Text>
          <Text style={estilos.ipDispositivo}>{item.ip}</Text>
        </View>
        <Text style={estilos.flechaDispositivo}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={estilos.contenedor}>

      {/* Info de este dispositivo */}
      <View style={estilos.infoLocal}>
        <View style={estilos.ledActivo} />
        <Text style={estilos.textoInfoLocal}>
          Este dispositivo: {ipLocal || 'obteniendo IP...'}
        </Text>
      </View>

      {/* Error de Wi-Fi */}
      {error && (
        <View style={estilos.contenedorError}>
          <Text style={estilos.textoError}>⚠️ {error}</Text>
        </View>
      )}

      {/* Indicador de búsqueda */}
      {esBuscando && dispositivos.length === 0 && (
        <View style={estilos.contenedorBuscando}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={estilos.textoBuscando}>Escaneando la red...</Text>
          <Text style={estilos.textoHint}>
            Asegurate que el desktop tenga LocalSend abierto
          </Text>
        </View>
      )}

      {/* Lista de dispositivos encontrados */}
      <FlatList
        data={dispositivos}
        keyExtractor={(item) => item.ip}
        renderItem={renderizarDispositivo}
        // RefreshControl permite hacer pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={esBuscando}
            onRefresh={refrescar}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          !esBuscando && (
            <View style={estilos.listaVacia}>
              <Text style={estilos.iconoVacio}>📡</Text>
              <Text style={estilos.textoVacio}>
                No se encontraron dispositivos
              </Text>
              <Text style={estilos.textoHint}>
                Deslizá hacia abajo para buscar de nuevo
              </Text>
            </View>
          )
        }
      />
    </View>
  )
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  infoLocal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a24',
    borderBottomWidth: 1,
    borderBottomColor: '#2e2e4a',
  },
  ledActivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  textoInfoLocal: {
    fontSize: 13,
    color: '#94a3b8',
  },
  contenedorError: {
    margin: 16,
    padding: 14,
    backgroundColor: '#2d1515',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  textoError: {
    color: '#ef4444',
    fontSize: 14,
  },
  contenedorBuscando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  textoBuscando: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  textoHint: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  tarjetaDispositivo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e2e4a',
    gap: 12,
  },
  iconoDispositivo: {
    fontSize: 32,
  },
  infoDispositivo: {
    flex: 1,
  },
  aliasDispositivo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  ipDispositivo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  flechaDispositivo: {
    fontSize: 22,
    color: '#6366f1',
    fontWeight: '700',
  },
  listaVacia: {
    alignItems: 'center',
    padding: 60,
    gap: 12,
  },
  iconoVacio: {
    fontSize: 48,
  },
  textoVacio: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
  },
})