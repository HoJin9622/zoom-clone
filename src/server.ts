import * as http from 'http'
import * as Websocket from 'ws'
import * as express from 'express'

const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (_, res: express.Response) => res.render('home'))
app.get('/*', (_, res: express.Response) => res.redirect('/'))

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const server = http.createServer(app)
const wss = new Websocket.Server({ server })

const sockets: Websocket[] = []

wss.on('connection', (socket) => {
  sockets.push(socket)
  socket['nickname'] = 'Anon'
  console.log('Connected to Brwoser ✅')
  socket.on('close', () => console.log('Disconnected from Browser ❌'))
  socket.on('message', (msg) => {
    const message = JSON.parse(msg.toString())
    switch (message.type) {
      case 'new_message':
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket['nickname']}: ${message.payload}`)
        )
        break
      case 'nickname':
        socket['nickname'] = message.payload
        break
    }
  })
  socket.send('Welcome!')
})

server.listen(3000, handleListen)
