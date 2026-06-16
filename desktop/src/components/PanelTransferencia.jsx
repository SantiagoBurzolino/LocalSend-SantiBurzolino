// src/components/PanelTransferencia.jsx
// Responsabilidad: zona de drag & drop + monitor de transferencia.
// El monitor muestra progreso, velocidad en MB/s y tiempo estimado (ETA).
import { useState, useRef, useEffect } from 'react'
import './PanelTransferencia.css'

// Convierte bytes a unidad legible. Función pura sin efectos secundarios.
function formatearTamaño(bytes) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// Convierte segundos a formato legible (1m 23s, 45s, etc.)
function formatearTiempo(segundos) {
  if (!segundos || segundos === Infinity || segundos < 0) return '...'
  if (segundos < 60) return `${Math.round(segundos)}s`
  const minutos = Math.floor(segundos / 60)
  const segsRestantes = Math.round(segundos % 60)
  return `${minutos}m ${segsRestantes}s`
}

function PanelTransferencias({ progreso, dispositivoSeleccionado, onEnviarArchivo }) {
  const [esDragOver, setEsDragOver] = useState(false)

  // Usamos useRef para guardar el tiempo de inicio de la transferencia.
  // useRef NO re-renderiza el componente cuando cambia, a diferencia de useState.
  // Es perfecto para datos de "medición interna" que no necesitan verse en pantalla.
  const tiempoInicioRef = useRef(null)
  const bytesInicioRef = useRef(0)

  // Calculamos velocidad y ETA cada vez que llega un nuevo chunk
  const [velocidadMBs, setVelocidadMBs] = useState(0)
  const [etaSegundos, setEtaSegundos] = useState(null)

  useEffect(() => {
    // Cuando empieza una transferencia nueva, guardamos el tiempo de inicio
    if (progreso && progreso.progreso > 0 && !tiempoInicioRef.current) {
      tiempoInicioRef.current = Date.now()
      bytesInicioRef.current = progreso.bytesRecibidos
    }

    // Cuando termina, reseteamos
    if (!progreso) {
      tiempoInicioRef.current = null
      bytesInicioRef.current = 0
      setVelocidadMBs(0)
      setEtaSegundos(null)
      return
    }

    // Calculamos la velocidad actual
    if (tiempoInicioRef.current && progreso.bytesRecibidos > 0) {
      // Diferencia de tiempo en segundos desde que empezó
      const segundosTranscurridos = (Date.now() - tiempoInicioRef.current) / 1000

      // Bytes recibidos desde que empezamos a medir
      const bytesDesdeInicio = progreso.bytesRecibidos - bytesInicioRef.current

      if (segundosTranscurridos > 0) {
        // Velocidad = bytes / tiempo, convertida a MB/s
        const velocidad = bytesDesdeInicio / segundosTranscurridos / (1024 * 1024)
        setVelocidadMBs(velocidad)

        // ETA = bytes restantes / velocidad actual (en bytes/s)
        const bytesRestantes = progreso.totalBytes - progreso.bytesRecibidos
        const velocidadBytesPorSegundo = bytesDesdeInicio / segundosTranscurridos
        if (velocidadBytesPorSegundo > 0) {
          setEtaSegundos(bytesRestantes / velocidadBytesPorSegundo)
        }
      }
    }
  }, [progreso])

  function manejarDrop(evento) {
    evento.preventDefault()
    setEsDragOver(false)

    const archivos = Array.from(evento.dataTransfer.files)
    if (archivos.length === 0) return

    // Si no hay dispositivo seleccionado, avisamos al usuario
    if (!dispositivoSeleccionado) {
      alert('Seleccioná un dispositivo de la lista primero')
      return
    }

    // Llamamos al callback que nos pasa App.jsx con el archivo
    if (onEnviarArchivo) {
      onEnviarArchivo(archivos[0], dispositivoSeleccionado)
    }
  }

  return (
    <section className="panel-transferencia">

      <div
        className={`zona-drop ${esDragOver ? 'zona-drop--activa' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setEsDragOver(true) }}
        onDragLeave={() => setEsDragOver(false)}
        onDrop={manejarDrop}
      >
        <span className="zona-drop-icono">{esDragOver ? '📂' : '📁'}</span>
        <p className="zona-drop-texto">
          {esDragOver ? '¡Soltá el archivo!' : 'Arrastrá archivos aquí para enviar'}
        </p>
        <p className="zona-drop-hint">
          {dispositivoSeleccionado
            ? `Enviando a: ${dispositivoSeleccionado.alias}`
            : 'Seleccioná un dispositivo de la lista primero'}
        </p>
      </div>

      {/* Monitor de transferencia: aparece solo durante una transferencia */}
      {progreso && (
        <div className="contenedor-progreso">

          <div className="progreso-header">
            <span className="progreso-titulo">Recibiendo archivo...</span>
            <span className="progreso-porcentaje">{progreso.progreso}%</span>
          </div>

          <div className="barra-progreso-fondo">
            <div
              className="barra-progreso-relleno"
              style={{ width: `${progreso.progreso}%` }}
            />
          </div>

          {/* Fila de métricas: bytes, velocidad y ETA */}
          <div className="progreso-metricas">
            <div className="metrica">
              <span className="metrica-etiqueta">Recibido</span>
              <span className="metrica-valor">
                {formatearTamaño(progreso.bytesRecibidos)} / {formatearTamaño(progreso.totalBytes)}
              </span>
            </div>
            <div className="metrica">
              <span className="metrica-etiqueta">Velocidad</span>
              <span className="metrica-valor">
                {velocidadMBs > 0 ? `${velocidadMBs.toFixed(1)} MB/s` : '...'}
              </span>
            </div>
            <div className="metrica">
              <span className="metrica-etiqueta">Tiempo restante</span>
              <span className="metrica-valor">{formatearTiempo(etaSegundos)}</span>
            </div>
          </div>

        </div>
      )}

    </section>
  )
}

export default PanelTransferencias