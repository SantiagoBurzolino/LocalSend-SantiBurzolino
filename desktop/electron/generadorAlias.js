// electron/generadorAlias.js
// Responsabilidad única: generar y persistir el alias amigable del dispositivo.
// Separado del main.js porque sigue el principio SRP del manual de Clean Code.
// Un alias como "Cheerful Orange" es más intuitivo que "192.168.1.15" o "PC-213-04"

const os = require('os')

// Listas de adjetivos y colores para generar el alias.
// Usamos arrays constantes porque nunca cambian en runtime.
const ADJETIVOS = [
  'Cheerful', 'Brave', 'Calm', 'Dazzling', 'Eager',
  'Fancy', 'Gentle', 'Happy', 'Jolly', 'Kind',
  'Lively', 'Mighty', 'Noble', 'Proud', 'Quick',
  'Radiant', 'Swift', 'Vivid', 'Witty', 'Zesty',
]

const COLORES = [
  'Apple', 'Azure', 'Coral', 'Crimson', 'Emerald',
  'Fuchsia', 'Golden', 'Indigo', 'Ivory', 'Jade',
  'Lavender', 'Maroon', 'Mint', 'Navy', 'Olive',
  'Orange', 'Peach', 'Ruby', 'Sapphire', 'Teal',
]

// Genera un índice numérico estable basado en el hostname.
// Así el mismo dispositivo siempre genera el mismo alias,
// pero dispositivos distintos generan aliases distintos.
// Esto es un hash simple: sumamos los códigos ASCII del hostname.
function generarIndiceEstable(texto, longitud) {
  let suma = 0
  for (let i = 0; i < texto.length; i++) {
    suma += texto.charCodeAt(i)
  }
  // Usamos módulo para que el índice nunca supere el tamaño del array
  return suma % longitud
}

// Función principal: devuelve siempre el mismo alias para este dispositivo
function generarAlias() {
  const hostname = os.hostname()

  const indiceAdjetivo = generarIndiceEstable(hostname, ADJETIVOS.length)
  // Para el color usamos hostname invertido para que no coincida con el adjetivo
  const indiceColor = generarIndiceEstable(
    hostname.split('').reverse().join(''),
    COLORES.length
  )

  return `${ADJETIVOS[indiceAdjetivo]} ${COLORES[indiceColor]}`
}

module.exports = { generarAlias }