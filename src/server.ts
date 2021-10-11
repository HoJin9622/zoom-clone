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

server.listen(3000, handleListen)
