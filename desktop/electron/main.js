
const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const dgram = require('dgram')        
const net = require('net')            
const fs = require('fs')              
const os = require('os')              // para obtener la IP local




const PUERTO = 53317



const ALIAS_DISPOSITIVO = `PC-${os.hostname()}`




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


let ventanaPrincipal
let servidorUDP
let servidorTCP
const ipLocal = obtenerIPLocal()




function iniciarServidorUDP() {
  
  servidorUDP = dgram.createSocket('udp4')

  
  
  servidorUDP.on('message', (msg, info) => {
    try {
      
      const datos = JSON.parse(msg.toString())

      
      if (datos.tipo === 'discovery' && info.address !== ipLocal) {
        console.log(`[UDP] Beacon recibido de ${info.address}: ${datos.alias}`)

        
        if (ventanaPrincipal) {
          ventanaPrincipal.webContents.send('dispositivo-encontrado', {
            ip: info.address,
            alias: datos.alias,
            tipo: datos.tipoDispositivo || 'mobile',
          })
        }

        
        const respuesta = Buffer.from(JSON.stringify({
          tipo: 'discovery-response',
          alias: ALIAS_DISPOSITIVO,
          ip: ipLocal,
          tipoDispositivo: 'desktop',
        }))

        
        servidorUDP.send(respuesta, info.port, info.address)
      }
    } catch (error) {
      
      console.log('[UDP] Paquete no reconocido, ignorando...')
    }
  })

  servidorUDP.on('error', (error) => {
    console.error('[UDP] Error en servidor:', error.message)
    servidorUDP.close()
  })


  servidorUDP.bind(PUERTO, '0.0.0.0', () => {
    console.log(`[UDP] Servidor escuchando en puerto ${PUERTO}`)
    console.log(`[UDP] IP local detectada: ${ipLocal}`)
  })
}


function iniciarServidorTCP() {
  servidorTCP = net.createServer((socket) => {
    console.log(`[TCP] Conexión entrante de ${socket.remoteAddress}`)

    
    let metadatos = null          
    let archivoStream = null      
    let bytesRecibidos = 0        

    
    socket.on('data', (chunk) => {
      
      if (!metadatos) {
        try {
          metadatos = JSON.parse(chunk.toString())
          console.log(`[TCP] Recibiendo archivo: ${metadatos.nombre} (${metadatos.tamaño} bytes)`)

          
          if (ventanaPrincipal) {
            ventanaPrincipal.webContents.send('transferencia-entrante', metadatos)
          }

          
          const rutaDestino = path.join(
            os.homedir(),
            'Downloads',
            metadatos.nombre
          )

         
          archivoStream = fs.createWriteStream(rutaDestino)

          archivoStream.on('finish', () => {
            console.log(`[TCP] Archivo guardado: ${rutaDestino}`)
            if (ventanaPrincipal) {
              ventanaPrincipal.webContents.send('transferencia-completa', {
                nombre: metadatos.nombre,
                ruta: rutaDestino,
              })
            }
          })

        } catch (error) {
          console.error('[TCP] Error parseando metadatos:', error.message)
          socket.destroy()
        }
        return
      }

    
      if (archivoStream) {
        archivoStream.write(chunk)
        bytesRecibidos += chunk.length

       
        const progreso = Math.round((bytesRecibidos / metadatos.tamaño) * 100)
        if (ventanaPrincipal) {
          ventanaPrincipal.webContents.send('progreso-transferencia', {
            progreso,
            bytesRecibidos,
            totalBytes: metadatos.tamaño,
          })
        }
      }
    })

    
    socket.on('end', () => {
      if (archivoStream) {
        
        archivoStream.end()
      }
    })

    socket.on('error', (error) => {
      console.error('[TCP] Error en socket:', error.message)
      if (archivoStream) archivoStream.destroy()
    })
  })

  servidorTCP.listen(PUERTO, '0.0.0.0', () => {
    console.log(`[TCP] Servidor escuchando en puerto ${PUERTO}`)
  })
}


function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    ventanaPrincipal.loadURL('http://localhost:5173')
    ventanaPrincipal.webContents.openDevTools()
  } else {
    ventanaPrincipal.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}


app.whenReady().then(() => {
  crearVentana()
  iniciarServidorUDP()  
  iniciarServidorTCP()  

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (servidorUDP) servidorUDP.close()
  if (servidorTCP) servidorTCP.close()
  if (process.platform !== 'darwin') app.quit()
})


ipcMain.handle('obtener-info-dispositivo', () => {
  return { ip: ipLocal, alias: ALIAS_DISPOSITIVO }
})


ipcMain.handle('aceptar-transferencia', () => {
  return { aceptado: true }
})


ipcMain.handle('rechazar-transferencia', () => {
  return { aceptado: false }
})