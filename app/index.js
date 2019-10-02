const { Worker } = require('worker_threads');
const config = require('./config');
const pool = new Array();

function run() {
    for (let i = 0; i < config.workers; i++) {
        pool.push(new Worker('./service.js', { workerData: { thread: i } }));
    }
}

run();


/* const http = require('http')
const redis = require('ioredis')
const mysql = require('mysql2')
const { parse: parseURL } = require('url')

const redisClient = redis.createClient({
    host: 'redis'
})
redisClient.on('error', err => {
    console.log(err)
})
const redisNS = 'test:docker:'

const pool = mysql.createPool({
    host: 'mysql',
    database: 'forum',
    user: 'Chuck',
    password: '123@abc'
}).promise()

const server = http.createServer(async (req, res) => {
    const url = parseURL(req.url)
    const resObj = {
        error: '',
        count: -1,
        userInfo: {}
    }
    try {
        if (url.path === '/') {
            const incrRes = await redisClient.multi().incr(`${redisNS}count`).exec()
            if (!incrRes[0][0]) {
                resObj.count = incrRes[0][1]
            }
            const [rows, fields] = await pool.query('SELECT name, nickname, avatar, email, create_time FROM users WHERE id = ?', [1])
            console.log(rows, fields)
            if (rows.length) {
                resObj.userInfo = rows[0]
            }
        }
    } catch (err) {
        console.log(err)
        resObj.error = err.message || 'unknow error'
    } finally {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(resObj))
    }
})

server.listen(5200)
 */