// src/App.jsx
import { useState, useEffect } from 'react'
import PanelDispositivos from './components/PanelDispositivos'
import PanelTransferencia from './components/PanelTransferencia'
import ModalConfirmacion from './components/ModalConfirmacion'
import './App.css'

// App.jsx es el componente raíz. Solo orquesta los demás componentes,
// no tiene lógica de negocio propia. Sigue el principio de
// Responsabilidad Única: su único trabajo es decidir qué se muestra.
function App() {
  // Lista de dispositivos encontrados en la red via UDP
  const [dispositivos, setDispositivos] = useState([])

  // Info de esta PC (IP y alias), obtenida del proceso Main
  const [infoLocal, setInfoLocal] = useState({ ip: '...', alias: '...' })

  // Cuando hay una transferencia entrante, guardamos sus metadatos acá
  // para mostrarlo en el modal de confirmación
  const [transferenciaEntrante, setTransferenciaEntrante] = useState(null)

  // Estado del progreso de la transferencia activa
  const [progreso, setProgreso] = useState(null)

  useEffect(() => {
    // Al montar la app, le pedimos al Main nuestra IP y alias
    // window.electronAPI es lo que expusimos en preload.js
    window.electronAPI.obtenerInfoDispositivo().then(setInfoLocal)

    // Nos suscribimos a los eventos que puede mandar el Main

    // Cuando UDP detecta un nuevo dispositivo, lo agregamos a la lista
    window.electronAPI.onDispositivoEncontrado((dispositivo) => {
      setDispositivos((prev) => {
        // Evitamos duplicados: si ya existe esa IP, no la agregamos
        const yaExiste = prev.some((d) => d.ip === dispositivo.ip)
        if (yaExiste) return prev
        return [...prev, dispositivo]
      })
    })

    // Cuando entra una transferencia, guardamos los metadatos
    // para que el ModalConfirmacion los muestre
    window.electronAPI.onTransferenciaEntrante((metadatos) => {
      setTransferenciaEntrante(metadatos)
    })

    // Actualizamos la barra de progreso con cada chunk recibido
    window.electronAPI.onProgresoTransferencia((datos) => {
      setProgreso(datos)
    })

    // Cuando termina la transferencia, limpiamos el estado
    window.electronAPI.onTransferenciaCompleta(() => {
      setProgreso(null)
      setTransferenciaEntrante(null)
    })
  }, []) 
  // El array vacío [] significa que este efecto corre UNA sola vez
  // cuando el componente se monta. Como un constructor.

  return (
    <div className="app-contenedor">

      {/* Header con info de esta PC */}
      <header className="app-header">
        <div className="header-info">
          <div className="indicador-activo" title="Servidor activo" />
          <span className="header-alias">{infoLocal.alias}</span>
          <span className="header-ip">{infoLocal.ip}</span>
        </div>
        <h1 className="header-titulo">LocalSend</h1>
      </header>

      {/* Contenido principal: dos columnas */}
      <main className="app-main">

        {/* Panel izquierdo: dispositivos encontrados en la red */}
        <PanelDispositivos dispositivos={dispositivos} />

        {/* Panel derecho: zona de drag & drop y progreso */}
        <PanelTransferencia progreso={progreso} />

      </main>

      {/* Modal que aparece cuando alguien quiere enviarnos un archivo */}
      {transferenciaEntrante && (
        <ModalConfirmacion
          metadatos={transferenciaEntrante}
          onAceptar={() => {
            window.electronAPI.aceptarTransferencia()
            setTransferenciaEntrante(null)
          }}
          onRechazar={() => {
            window.electronAPI.rechazarTransferencia()
            setTransferenciaEntrante(null)
          }}
        />
      )}

    </div>
  )
}

export default App