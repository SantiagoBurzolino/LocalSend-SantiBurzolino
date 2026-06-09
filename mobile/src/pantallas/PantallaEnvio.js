// src/pantallas/PantallaEnvio.js
// Pantalla de envío: seleccionar archivo y mandarlo al desktop seleccionado.
// Flujo de 3 clicks: seleccionar → confirmar → enviar (como pide la rúbrica)

import { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { enviarArchivo } from '../servicios/servicioRed'

export default function PantallaEnvio({ route }) {
  // Recibimos el dispositivo seleccionado desde PantallaRadar
  const { dispositivo } = route.params

  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [estaEnviando, setEstaEnviando] = useState(false)
  const [progreso, setProgreso] = useState(0)

  // Abre el selector de documentos del sistema
  async function seleccionarDocumento() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        // '*/*' significa cualquier tipo de archivo
        type: '*/*',
        copyToCacheDirectory: true,
      })

      // El usuario canceló la selección
      if (resultado.canceled) return

      setArchivoSeleccionado(resultado.assets[0])
      setProgreso(0)
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el selector de archivos')
    }
  }

  // Abre la galería de fotos
  async function seleccionarImagen() {
    try {
      // Pedimos permiso para acceder a la galería
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos acceso a tu galería para seleccionar imágenes'
        )
        return
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1, // calidad máxima, sin compresión
      })

      if (resultado.canceled) return

      const asset = resultado.assets[0]
      // Adaptamos el formato para que sea compatible con enviarArchivo()
      setArchivoSeleccionado({
        uri: asset.uri,
        name: asset.fileName || `imagen_${Date.now()}.jpg`,
        mimeType: asset.type || 'image/jpeg',
        size: asset.fileSize,
      })
      setProgreso(0)
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería')
    }
  }

  // Envía el archivo al desktop seleccionado
  async function enviar() {
    if (!archivoSeleccionado) {
      Alert.alert('Sin archivo', 'Seleccioná un archivo primero')
      return
    }

    setEstaEnviando(true)
    setProgreso(0)

    try {
      await enviarArchivo(
        dispositivo.ip,
        archivoSeleccionado,
        (porcentaje) => setProgreso(porcentaje)
      )

      Alert.alert('✅ Éxito', `"${archivoSeleccionado.name}" enviado correctamente`)
      setArchivoSeleccionado(null)
      setProgreso(0)

    } catch (error) {
      Alert.alert(
        '❌ Error de envío',
        error.message || 'No se pudo enviar el archivo. Verificá la conexión.'
      )
    } finally {
      setEstaEnviando(false)
    }
  }

  // Formatea bytes a KB/MB/GB legible
  function formatearTamaño(bytes) {
    if (!bytes) return 'Tamaño desconocido'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <View style={estilos.contenedor}>

      {/* Info del dispositivo destino */}
      <View style={estilos.tarjetaDestino}>
        <Text style={estilos.iconoDestino}>🖥️</Text>
        <View>
          <Text style={estilos.aliasDestino}>
            {dispositivo.alias || 'Desktop'}
          </Text>
          <Text style={estilos.ipDestino}>{dispositivo.ip}</Text>
        </View>
      </View>

      {/* Botones de selección */}
      <View style={estilos.botonesSeleccion}>
        <TouchableOpacity
          style={estilos.botonSeleccion}
          onPress={seleccionarDocumento}
          disabled={estaEnviando}
        >
          <Text style={estilos.iconoBoton}>📄</Text>
          <Text style={estilos.textoBoton}>Documento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonSeleccion}
          onPress={seleccionarImagen}
          disabled={estaEnviando}
        >
          <Text style={estilos.iconoBoton}>🖼️</Text>
          <Text style={estilos.textoBoton}>Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Vista previa del archivo seleccionado */}
      {archivoSeleccionado && (
        <View style={estilos.vistaPrevia}>
          <Text style={estilos.nombreArchivo} numberOfLines={1}>
            {archivoSeleccionado.name}
          </Text>
          <Text style={estilos.tamañoArchivo}>
            {formatearTamaño(archivoSeleccionado.size)}
          </Text>
        </View>
      )}

      {/* Barra de progreso durante el envío */}
      {estaEnviando && (
        <View style={estilos.contenedorProgreso}>
          <View style={estilos.barraFondo}>
            <View style={[estilos.barraRelleno, { width: `${progreso}%` }]} />
          </View>
          <Text style={estilos.textoProgreso}>{progreso}%</Text>
        </View>
      )}

      {/* Botón principal de envío */}
      <TouchableOpacity
        style={[
          estilos.botonEnviar,
          (!archivoSeleccionado || estaEnviando) && estilos.botonDeshabilitado
        ]}
        onPress={enviar}
        disabled={!archivoSeleccionado || estaEnviando}
      >
        {estaEnviando
          ? <ActivityIndicator color="white" />
          : <Text style={estilos.textoEnviar}>Enviar archivo</Text>
        }
      </TouchableOpacity>

    </View>
  )
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#0f0f13',
    padding: 20,
    gap: 20,
  },
  tarjetaDestino: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1a1a24',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  iconoDestino: {
    fontSize: 36,
  },
  aliasDestino: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  ipDestino: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  botonesSeleccion: {
    flexDirection: 'row',
    gap: 12,
  },
  botonSeleccion: {
    flex: 1,
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e2e4a',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  iconoBoton: {
    fontSize: 32,
  },
  textoBoton: {
    fontSize: 14,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  vistaPrevia: {
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e2e4a',
    gap: 4,
  },
  nombreArchivo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  tamañoArchivo: {
    fontSize: 13,
    color: '#94a3b8',
  },
  contenedorProgreso: {
    gap: 8,
  },
  barraFondo: {
    height: 8,
    backgroundColor: '#24243a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  textoProgreso: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'right',
  },
  botonEnviar: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 'auto',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoEnviar: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
})