const path = require('path')
const config = require('./config')
const uuid = require('uuid/v4')

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')

const loki = require('lokijs')
const dbPath = path.join(__dirname, 'data', config.dbFile)
const db = new loki(dbPath, {
    autoload: true,
    autosave: true,
    autosaveInterval: 4000,
    autoloadCallback: dbInit
})

app.use(bodyParser.json())
app.use(fileUpload())

let users;
function dbInit () {
    console.log('- initializing loki data store')
    users = db.getCollection('users')
    if (users) {
        console.log(`    restoring data store from ${dbPath}`)
    } else {
        console.log(`    creating empty data store in ${dbPath}`)
        users = db.addCollection('users')
    }

    return registerRoutes()
}

function registerRoutes () {
    console.log('- configuring api endpoints')

    console.log('    GET /users')
    app.get('/users', auth, (req, res) => (
        res.json(users.data.map(n => ({
            username: n.username,
            id: n['$loki']
        })))
    ))

    console.log('    POST /users')
    app.post('/users', (req, res) => {
        const username = req.body.username
        if (!username) return res.status(400).send('username is required')
        if (users.findOne({ username })) return res.status(409).send('username is already taken')

        const access_token = uuid()
        const user = users.insert({ username, access_token, snaps: [] })
        return res.json(user)
    })

    console.log('    POST /users/:id/snap')
    app.post('/users/:id/snap', auth, (req, res) => {
        const imageData = req.files.snap.data.toString('base64')
        const recipient = users.findOne(req.params.id)
        recipient.snaps.push({
            id: uuid(),
            from: req.user['$loki'],
            data: imageData
        })
        users.update(recipient)
        return res.status(204).send()
    })

    console.log('    GET /snaps')
    app.get('/snaps', auth, (req, res) => {
        return res.json(req.user.snaps.map(n => ({
            from: n.from,
            url: `${config.snapUrl}/${n.id}`
        })))
    })

    console.log('    GET /snaps/:id')
    app.get('/snaps/:id', auth, (req, res) => {
        const snap = req.user.snaps.find(n => n.id == req.params.id)
        if (!snap) return res.status(404).send(`Can\'t find snap with id ${req.params.id}`)
        const image = Buffer.from(snap.data, 'base64')

        // delete the snap after it was downloaded
        const index = req.user.snaps.findIndex(n => n.id == req.params.id)
        req.user.snaps.splice(index, 1)
        users.update(req.user)
        
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': image.length
        })
        res.end(image);
    })

    console.log(`\nNow listening for connections on port ${config.port}`)
    return server.listen(config.port, config.host)
}

function auth (req, res, next) {
    const header = req.header('Authorization')
    if (!header) return res.status(401).send('Must send Authorization type bearer')

    const components = header.split('Bearer ')
    if (components.length != 2) return res.status(401).send('Malformed Authorization header')

    const access_token = components[1]
    const user = users.findOne({ access_token })
    if (!user) return res.status(403).send('Invalid access_token to access to this resource')

    req.user = user
    return next()
}

console.log('\nStarting up the snapchat clone api')

