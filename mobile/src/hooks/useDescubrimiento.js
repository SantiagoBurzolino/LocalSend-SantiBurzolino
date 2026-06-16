// src/hooks/useDescubrimiento.js
// Custom hook que encapsula la lógica de descubrimiento de dispositivos.
// Siguiendo el manual de React: los hooks viven fuera de los componentes
// y encapsulan estado + efectos reutilizables.

import { useState, useEffect, useCallback } from 'react'
import { verificarWifi, obtenerIPLocal } from '../servicios/servicioRed'

const PUERTO = 53317
// Tiempo entre cada intento de descubrimiento (3 segundos)
const INTERVALO_BEACON = 3000

export function useDescubrimiento() {
  const [dispositivos, setDispositivos] = useState([])
  const [esBuscando, setEsBuscando] = useState(false)
  const [error, setError] = useState(null)
  const [ipLocal, setIpLocal] = useState(null)

  // Busca dispositivos enviando requests HTTP a IPs comunes de la red
  // En la versión con UDP nativo esto sería un broadcast real
  const buscarDispositivos = useCallback(async () => {
    setEsBuscando(true)
    setError(null)

    try {
      const tieneWifi = await verificarWifi()
      if (!tieneWifi) {
        setError('Conectate a Wi-Fi para buscar dispositivos')
        setEsBuscando(false)
        return
      }

      const ip = await obtenerIPLocal()
      setIpLocal(ip)
      

      // Calculamos el rango de IPs a escanear
      // Si nuestra IP es 10.56.2.21, escaneamos 10.56.2.1 a 10.56.2.20
      // y 10.56.2.22 en adelante
const partes = ip.split('.')
      const baseIP = `${partes[0]}.${partes[1]}`

      const promesas = []

      // Bucle externo: Escaneamos las subredes del 0 al 10 (ajustá esto según tu red)
      for (let subred = 0; subred <= 10; subred++) {
        
        // Bucle interno: Escaneamos las IPs de cada subred
        for (let i = 1; i <= 99; i++) {
          const ipObjetivo = `${baseIP}.${subred}.${i}`
          if (ipObjetivo === ip) continue // saltamos nuestra propia IP

          // Intentamos conectar al puerto 53317 de cada IP
          promesas.push(
            fetch(`http://${ipObjetivo}:${PUERTO}/info`, {
              signal: AbortSignal.timeout(800),
            })
            .then(async (res) => {
              if (res.ok) {
                const datos = await res.json()
                return { ip: ipObjetivo, ...datos }
              }
              return null
            })
            .catch(() => null)
          )
        }
      }

      // Corremos todos los scans en paralelo
      const resultados = await Promise.all(promesas)

      // Filtramos los nulls (IPs que no respondieron)
      const encontrados = resultados.filter(Boolean)

      setDispositivos(encontrados)
    } catch (err) {
      setError('Error al buscar dispositivos: ' + err.message)
    } finally {
      setEsBuscando(false)
    }
  }, [])

  // Buscamos automáticamente al montar el hook
  useEffect(() => {
    buscarDispositivos()

    // Repetimos la búsqueda cada 3 segundos (como los beacons UDP)
    const intervalo = setInterval(buscarDispositivos, INTERVALO_BEACON)

    // Limpiamos el intervalo cuando el componente se desmonta
    // Esto evita memory leaks
    return () => clearInterval(intervalo)
  }, [buscarDispositivos])

  return {
    dispositivos,
    esBuscando,
    error,
    ipLocal,
    // Exponemos la función para que el usuario pueda refrescar manualmente
    refrescar: buscarDispositivos,
  }
}