const { workerData } = require('worker_threads');
const redis = require('redis');
const { sleep } = require('./util');
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(redis);

class Processor {
    /*     thread = undefined;
        isGenerator = false;
        client = undefined;
        lastMessage = 0;
        channel = undefined;
        errors = undefined;
        state = undefined;
        signal = undefined;
        lag = 0; */
    constructor(config, workerData) {
        this.thread = workerData.thread;
        this.channel = config.channel;
        this.errors = config.errors;
        this.state = config.state;
        this.signal = config.signal;
        this.lag = config.lag;
        this.client = redis.createClient({
            host: 'redis',
            retry_strategy: function (options) {
                return Math.max(options.attempt * 100, config.timeout - config.lag);
            }
        });

        this.client.on("error", function (err) {
            console.log(`Error in thread ${workerData.thread}: `, err);
        });

        this.client.on("message", function (channel, message) {
            console.log('message', this.thread, channel, message)
            if (channel !== this.channel) return;

            /*  const num = Number(message);
             if (isNaN(num) || num > 8) {
                 client.lpushAsync(this.errors, {
                     thread: this.thread,
                     error: isNaN(num) ? 'not a number' : 'number too big',
                     time: Date.now()
                 })
                     .catch(err => console.log(err));
                 console.log(isNaN(num) ? 'not a number' : 'number too big', num)
                 return;
             }
             this.client.lpopAsync(this.state, function (err, result) {
                 if (err || !result) {
                     this.client.setAsync(this.state, 1)
                         .catch(err => console.log(err));
                 } else {
                     this.client.incrAsync(this.state)
                         .catch(err => console.log(err));
                 }*/
        })
    }


    async run() {
        this.client.subscribe(this.channel);
        while (true) {
            if (this.thread == 0) {
                console.log('tock')
                this.client.lpushAsync(this.signal, Math.floor(Math.random() * 11))
            }
            await sleep(1000, 0)
        }
        this.client.unsubscribe(this.channel);
    }

    close() {
        this.client.quit();
    }
}

new Processor(config, workerData).run();