// src/components/ModalConfirmacion.jsx
// Responsabilidad: mostrar el diálogo cuando alguien quiere enviarnos un archivo.
// Recibe los metadatos del archivo y dos callbacks: onAceptar y onRechazar.
// No sabe nada de red ni de cómo se procesa la transferencia.
import './ModalConfirmacion.css'

function formatearTamaño(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ModalConfirmacion({ metadatos, onAceptar, onRechazar }) {
  return (
    // El overlay oscurece el fondo para enfocar la atención en el modal
    <div className="modal-overlay">
      <div className="modal-caja">

        <div className="modal-icono">📨</div>

        <h2 className="modal-titulo">Transferencia entrante</h2>

        <div className="modal-info">
          <div className="modal-fila">
            <span className="modal-etiqueta">Archivo</span>
            <span className="modal-valor">{metadatos.nombre}</span>
          </div>
          <div className="modal-fila">
            <span className="modal-etiqueta">Tamaño</span>
            <span className="modal-valor">{formatearTamaño(metadatos.tamaño)}</span>
          </div>
          <div className="modal-fila">
            <span className="modal-etiqueta">De</span>
            <span className="modal-valor">{metadatos.emisor || 'Dispositivo desconocido'}</span>
          </div>
        </div>

        <div className="modal-acciones">
          <button className="btn-rechazar" onClick={onRechazar}>
            Rechazar
          </button>
          <button className="btn-aceptar" onClick={onAceptar}>
            Aceptar
          </button>
        </div>

      </div>
    </div>
  )
}

export default ModalConfirmacion