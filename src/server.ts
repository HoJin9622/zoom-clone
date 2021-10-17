import * as http from 'http'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import * as express from 'express'

const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (_, res: express.Response) => res.render('home'))
app.get('/*', (_, res: express.Response) => res.redirect('/'))

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app)
const wsServer = new Server(httpServer, {
  cors: {
    origin: ['https://admin.socket.io'],
    credentials: true,
  },
})
instrument(wsServer, {
  auth: false,
})

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer
  const publicRooms = []
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key)
    }
  })
  return publicRooms
}

function countRoom(roomName: string) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anon'
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter)
    console.log(`Socket Event:${event}`)
  })
  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName)
    done()
    socket.to(roomName).emit('welcome', socket['nickname'], countRoom(roomName))
    wsServer.sockets.emit('room_change', publicRooms())
  })
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit('bye', socket['nickname'], countRoom(room) - 1)
    )
  })
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms())
  })
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket['nickname']}: ${msg}`)
    done()
  })
  socket.on('nickname', (nickname) => (socket['nickname'] = nickname))
})

// const sockets: Websocket[] = []
// wss.on('connection', (socket) => {
//   sockets.push(socket)
//   socket['nickname'] = 'Anon'
//   console.log('Connected to Brwoser ✅')
//   socket.on('close', () => console.log('Disconnected from Browser ❌'))
//   socket.on('message', (msg) => {
//     const message = JSON.parse(msg.toString())
//     switch (message.type) {
//       case 'new_message':
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket['nickname']}: ${message.payload}`)
//         )
//         break
//       case 'nickname':
//         socket['nickname'] = message.payload
//         break
//     }
//   })
//   socket.send('Welcome!')
// })

httpServer.listen(3000, handleListen)
