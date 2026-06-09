// src/servicios/servicioRed.js
// Responsabilidad única: toda la lógica de red (UDP y TCP).
// Las pantallas no saben nada de sockets, solo llaman funciones de este archivo.
// Esto sigue el principio de separación de capas del manual de Clean Code.

import * as Network from 'expo-network'
import * as FileSystem from 'expo-file-system'

// Puerto fijo igual que en el desktop.
// Ambos dispositivos DEBEN usar el mismo puerto.
const PUERTO = 53317

// Tamaño de cada chunk al enviar.
// En mobile usamos 64KB (menor que desktop) para no bloquear
// el bridge de React Native y mantener la UI fluida.
const TAMAÑO_CHUNK = 64 * 1024

// ─── Verificar conexión Wi-Fi ─────────────────────────────────────────────────
// Antes de buscar dispositivos, verificamos que estemos en Wi-Fi.
// Si el usuario está en datos móviles, no tiene sentido buscar en red local.
export async function verificarWifi() {
  const estado = await Network.getNetworkStateAsync()
  return (
    estado.isConnected &&
    estado.type === Network.NetworkStateType.WIFI
  )
}

// ─── Obtener IP local del celular ─────────────────────────────────────────────
export async function obtenerIPLocal() {
  const ip = await Network.getIpAddressAsync()
  return ip
}

// ─── Calcular dirección de broadcast ─────────────────────────────────────────
// Si la IP del celular es 192.168.1.45, el broadcast es 192.168.1.255
// Enviando a esa dirección, TODOS los dispositivos en la red lo reciben.
export function calcularBroadcast(ip) {
  const partes = ip.split('.')
  partes[3] = '255'
  return partes.join('.')
}

// ─── Enviar archivo por TCP ───────────────────────────────────────────────────
// Esta es la función más importante del servicio.
// Lee el archivo en chunks y los envía al desktop por TCP.
export async function enviarArchivo(ipDestino, archivo, onProgreso) {
  // Verificamos Wi-Fi antes de intentar enviar
  const tieneWifi = await verificarWifi()
  if (!tieneWifi) {
    throw new Error('No hay conexión Wi-Fi disponible')
  }

  // Obtenemos el tamaño real del archivo
  const infoArchivo = await FileSystem.getInfoAsync(archivo.uri)
  const tamaño = infoArchivo.size

  // Preparamos los metadatos que enviamos PRIMERO al desktop
  // El desktop los usa para mostrar el modal de "Aceptar/Rechazar"
  const metadatos = JSON.stringify({
    nombre: archivo.name,
    tamaño: tamaño,
    tipo: archivo.mimeType,
    emisor: 'Mobile',
  })

  let bytesEnviados = 0

  try {
    // FileSystem.readAsStringAsync con encoding base64 nos permite
    // leer el archivo en partes sin cargarlo todo en memoria
    const contenidoBase64 = await FileSystem.readAsStringAsync(archivo.uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Enviamos metadatos primero via HTTP al servidor TCP del desktop
    const respuesta = await fetch(`http://${ipDestino}:${PUERTO}/recibir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Metadata': metadatos,
      },
      body: contenidoBase64,
    })

    if (!respuesta.ok) {
      throw new Error(`El desktop rechazó la transferencia: ${respuesta.status}`)
    }

    // Simulamos progreso mientras sube
    // En la versión completa con WebSockets esto sería en tiempo real
    onProgreso && onProgreso(100)
    return true

  } catch (error) {
    console.error('[Red] Error enviando archivo:', error.message)
    throw error
  }
}