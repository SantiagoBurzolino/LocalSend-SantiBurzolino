// src/components/PanelDispositivos.jsx
// Responsabilidad única: mostrar la lista de dispositivos en la red.
// No sabe nada de UDP ni de transferencias. Solo muestra datos.
import './PanelDispositivos.css'

// Función pura que elige el ícono según el tipo de dispositivo
// Separada del componente porque no necesita estado ni efectos
function iconoDispositivo(tipo) {
  if (tipo === 'mobile') return '📱'
  if (tipo === 'desktop') return '🖥️'
  return '💻'
}

function PanelDispositivos({ dispositivos }) {
  return (
    <aside className="panel-dispositivos">
      <div className="panel-header">
        <span className="panel-titulo">Dispositivos en red</span>
        <span className="panel-contador">{dispositivos.length}</span>
      </div>

      {/* Si no hay dispositivos, mostramos un estado vacío */}
      {dispositivos.length === 0 ? (
        <div className="estado-vacio">
          <span className="estado-vacio-icono">📡</span>
          <p>Buscando dispositivos...</p>
          <p className="estado-vacio-hint">
            Asegurate de estar en la misma red Wi-Fi
          </p>
        </div>
      ) : (
        <ul className="lista-dispositivos">
          {dispositivos.map((dispositivo) => (
            // Usamos la IP como key porque es única en la red local
            <li key={dispositivo.ip} className="item-dispositivo">
              <span className="dispositivo-icono">
                {iconoDispositivo(dispositivo.tipo)}
              </span>
              <div className="dispositivo-info">
                <span className="dispositivo-alias">{dispositivo.alias}</span>
                <span className="dispositivo-ip">{dispositivo.ip}</span>
              </div>
              <div className="dispositivo-estado activo" />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

export default PanelDispositivos