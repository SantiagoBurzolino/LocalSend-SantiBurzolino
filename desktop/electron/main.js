// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const fs   = require('fs')
const os   = require('os')

// ─── Configuración global ─────────────────────────────────────────────────────
// Puerto fijo igual que LocalSend original.
// Todos los dispositivos de la red deben usar el mismo.
const PUERTO = 53317
const { generarAlias } = require('./generadorAlias')
const ALIAS_DISPOSITIVO = generarAlias()

// ─── Utilidad: obtener IP local ───────────────────────────────────────────────
// Recorre todas las interfaces de red y devuelve la primera IPv4 no interna.
// "No interna" significa que no es 127.0.0.1 (loopback).
function obtenerIPLocal() {
  const interfaces = os.networkInterfaces()
  for (const nombre of Object.keys(interfaces)) {
    for (const interfaz of interfaces[nombre]) {
      if (interfaz.family === 'IPv4' && !interfaz.internal) {
        return interfaz.address
      }
    }
  }
  return '127.0.0.1'
}

// ─── Variables de estado ──────────────────────────────────────────────────────
let ventanaPrincipal
const ipLocal = obtenerIPLocal()

// ─── Servidor HTTP ────────────────────────────────────────────────────────────
// Usamos HTTP porque el mobile puede usar fetch() sin librerías extra.
// Tiene dos rutas:
//   GET  /info    → el mobile nos escanea para descubrirnos
//   POST /recibir → el mobile nos manda el archivo
function iniciarServidorHTTP() {
  const servidor = http.createServer((req, res) => {

    // CORS: necesario para que el mobile (distinta IP) pueda conectarse
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')

    // Preflight: el mobile manda OPTIONS antes de cada POST real
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // ── GET /info ─────────────────────────────────────────────────────────────
    // El mobile llama a esta ruta para saber si hay un LocalSend en esa IP.
    // Si responde con 200, lo agrega a la lista de dispositivos.
    if (req.method === 'GET' && req.url === '/info') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        alias: ALIAS_DISPOSITIVO,
        ip: ipLocal,
        tipoDispositivo: 'desktop',
      }))
      return
    }

    // ── POST /recibir ─────────────────────────────────────────────────────────
    // El mobile manda el archivo acá.
    // Los metadatos vienen en el header X-Metadata como JSON.
    // El cuerpo del request es el contenido binario del archivo.
    if (req.method === 'POST' && req.url === '/recibir') {

      // Parseamos metadatos con fallback por si viene malformado
      let metadatos = {}
      try {
        metadatos = JSON.parse(req.headers['x-metadata'] || '{}')
      } catch {
        metadatos = { nombre: `archivo_${Date.now()}`, tamaño: 0 }
      }

      console.log(`[HTTP] Recibiendo archivo: ${metadatos.nombre}`)

      // Avisamos a React para que muestre el modal de confirmación
      if (ventanaPrincipal) {
        ventanaPrincipal.webContents.send('transferencia-entrante', metadatos)
      }

      // ── Manejo de colisiones de nombre ────────────────────────────────────
      // Si ya existe foto.jpg en Downloads, guardamos foto_1717200000.jpg
      // Así nunca sobreescribimos un archivo existente sin avisar.
      let rutaDestino = path.join(os.homedir(), 'Downloads', metadatos.nombre)
      if (fs.existsSync(rutaDestino)) {
        const extension      = path.extname(metadatos.nombre)
        const nombreSinExtension = path.basename(metadatos.nombre, extension)
        rutaDestino = path.join(
          os.homedir(),
          'Downloads',
          `${nombreSinExtension}_${Date.now()}${extension}`
        )
        console.log(`[HTTP] Colisión detectada → renombrando a: ${path.basename(rutaDestino)}`)
      }

      // createWriteStream escribe al disco chunk por chunk.
      // NUNCA carga el archivo completo en RAM.
      // Funciona igual con un archivo de 1KB que con uno de 10GB.
      const streamEscritura = fs.createWriteStream(rutaDestino)
      let bytesRecibidos = 0

      req.on('data', (chunk) => {
        streamEscritura.write(chunk)
        bytesRecibidos += chunk.length

        // Enviamos el progreso a React para actualizar la barra
        if (metadatos.tamaño && ventanaPrincipal) {
          const progreso = Math.round((bytesRecibidos / metadatos.tamaño) * 100)
          ventanaPrincipal.webContents.send('progreso-transferencia', {
            progreso,
            bytesRecibidos,
            totalBytes: metadatos.tamaño,
          })
        }
      })

      req.on('end', () => {
        streamEscritura.end()
        console.log(`[HTTP] Archivo guardado en: ${rutaDestino}`)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))

        // Avisamos a React que la transferencia terminó
        if (ventanaPrincipal) {
          ventanaPrincipal.webContents.send('transferencia-completa', {
            nombre: metadatos.nombre,
            ruta: rutaDestino,
          })
        }
      })

      req.on('error', (error) => {
        console.error('[HTTP] Error recibiendo archivo:', error.message)
        streamEscritura.destroy()
        res.writeHead(500)
        res.end()
      })

      return
    }

    // Cualquier otra ruta devuelve 404
    res.writeHead(404)
    res.end()
  })

  servidor.listen(PUERTO, '0.0.0.0', () => {
    console.log(`[HTTP] Servidor escuchando en puerto ${PUERTO}`)
    console.log(`[HTTP] IP local: ${ipLocal}`)
    console.log(`[HTTP] Alias: ${ALIAS_DISPOSITIVO}`)
  })

  // EADDRINUSE = el puerto ya está ocupado por otra instancia de la app
  servidor.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[HTTP] Error: el puerto ${PUERTO} ya está en uso.`)
      console.error('[HTTP] Cerrá la otra instancia de LocalSend y volvé a intentar.')
    } else {
      console.error(`[HTTP] Error inesperado: ${error.message}`)
    }
  })
}

// ─── Ventana principal ────────────────────────────────────────────────────────
function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      // preload.js es el único lugar donde Node puede hablar con React
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // React no puede importar módulos de Node
      nodeIntegration: false,  // refuerza la separación de procesos
    },
  })

  if (process.env.NODE_ENV === 'development') {
    ventanaPrincipal.loadURL('http://localhost:5173')
    ventanaPrincipal.webContents.openDevTools()
  } else {
    ventanaPrincipal.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─── Ciclo de vida de la app ──────────────────────────────────────────────────
app.whenReady().then(() => {
  crearVentana()
  iniciarServidorHTTP()  // único servidor, reemplaza UDP + TCP anteriores

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
// Estas funciones las llama React via window.electronAPI (definido en preload.js)

ipcMain.handle('obtener-info-dispositivo', () => {
  return { ip: ipLocal, alias: ALIAS_DISPOSITIVO }
})

ipcMain.handle('aceptar-transferencia', () => {
  return { aceptado: true }
})

ipcMain.handle('rechazar-transferencia', () => {
  return { aceptado: false }
})