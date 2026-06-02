// src/components/PanelTransferencia.jsx
// Responsabilidad: zona de drag & drop + barra de progreso.
// Cuando el usuario suelta un archivo acá, lo procesamos.
import { useState } from 'react'
import './PanelTransferencia.css'

// Convierte bytes a una unidad legible (KB, MB, GB)
function formatearTamaño(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function PanelTransferencia({ progreso }) {
  // esDragOver controla el estilo visual cuando el usuario
  // arrastra un archivo sobre la zona drop
  const [esDragOver, setEsDragOver] = useState(false)

  // Se llama cuando el usuario suelta un archivo en la zona
  function manejarDrop(evento) {
    // Prevenimos el comportamiento default del navegador
    // (que abriría el archivo en la ventana)
    evento.preventDefault()
    setEsDragOver(false)

    const archivos = Array.from(evento.dataTransfer.files)
    if (archivos.length === 0) return

    console.log('Archivos dropeados:', archivos.map(a => a.name))
    // TODO: en el siguiente paso enviaremos estos archivos
    // por TCP al dispositivo seleccionado
  }

  return (
    <section className="panel-transferencia">

      {/* Zona de Drag & Drop */}
      <div
        className={`zona-drop ${esDragOver ? 'zona-drop--activa' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setEsDragOver(true) }}
        onDragLeave={() => setEsDragOver(false)}
        onDrop={manejarDrop}
      >
        <span className="zona-drop-icono">
          {esDragOver ? '📂' : '📁'}
        </span>
        <p className="zona-drop-texto">
          {esDragOver
            ? '¡Soltá el archivo!'
            : 'Arrastrá archivos aquí para enviar'}
        </p>
        <p className="zona-drop-hint">
          Seleccioná un dispositivo de la lista primero
        </p>
      </div>

      {/* Barra de progreso: solo se muestra durante una transferencia */}
      {progreso && (
        <div className="contenedor-progreso">
          <div className="progreso-header">
            <span>Recibiendo archivo...</span>
            <span>{progreso.progreso}%</span>
          </div>
          <div className="barra-progreso-fondo">
            <div
              className="barra-progreso-relleno"
              style={{ width: `${progreso.progreso}%` }}
            />
          </div>
          <div className="progreso-detalle">
            <span>{formatearTamaño(progreso.bytesRecibidos)}</span>
            <span>de {formatearTamaño(progreso.totalBytes)}</span>
          </div>
        </div>
      )}

    </section>
  )
}

export default PanelTransferencia