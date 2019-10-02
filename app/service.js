const { workerData } = require('worker_threads');
const redis = require('redis');
const { sleep } = require('./util');
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(redis);

class Processor {
    constructor(workerData) {
        this.thread = workerData.thread;
        this.pubClient = this.createClient(config.timeout - config.lag);
        this.subClient = this.createClient(config.timeout - config.lag);
    }

    createClient(maxTimeout) {
        const client = redis.createClient({
            host: 'redis',
            retry_strategy: function (options) {
                return Math.max(options.attempt * 100, maxTimeout);
            }
        });
        client.on("error", function (err) {
            console.log(`Error in thread ${this.thread}: `, err);
        });
        return client;
    }

    async run() {
        while (true) {
            // if we are waiting for another generator, downgrade to worker
            const generator = await this.subClient.getAsync(config.generator);
            const nextGenerator = await this.subClient.getAsync(config.nextGenerator);
            const receivedMessageTime = await this.subClient.getAsync(config.lastReceived);
            if ((generator == this.thread && nextGenerator == null) || nextGenerator == this.thread) {
                await this.pubClient.delAsync(config.nextGenerator);
                await this.pubClient.setAsync(config.generator, this.thread);
                // 5% each time for the generator fail
                if (Math.floor(Math.random() * 10) === 0) {
                    // go to sleep till timeout - generator was broken
                    console.log('generator', this.thread, 'broken')
                    await sleep(config.timeout, config.lag)
                    continue;
                }
                const num = Math.floor(Math.random() * 11);
                this.pubClient.lpushAsync(config.signal, num)
                    .then(() => {
                        console.log('PUSH #', this.thread, num)
                    })
                    .catch(e => console.log(`Error in thread ${this.thread}: `, err));
            } else {
                this.subClient.lpopAsync(config.signal)
                    .then(async res => {
                        // no new data after timeout!                    
                        if (res === null) {
                            const now = Date.now()
                            if ((now - receivedMessageTime) > config.delay) {
                                console.log('too long waiting #', this.thread)
                                // make generator working next step
                                const code = await this.subClient.getAsync(config.nextGenerator);
                                if (code === null) {
                                    await this.pubClient.setAsync(config.nextGenerator, this.thread)
                                }
                            }
                            return
                        }
                        await this.pubClient.setAsync(config.lastReceived, Date.now());
                        if (res > 8) {
                            this.pubClient.lpushAsync(config.errors, JSON.stringify({
                                thread: this.thread,
                                error: 'number too big',
                                time: Date.now()
                            }))
                                .catch(err => console.log(err));
                            console.log('number too big')
                            return;
                        };
                        this.subClient.getAsync(config.state)
                            .then(() => {
                                this.pubClient.incrAsync(config.state)
                                    .then(res => console.log('incremented', res))
                                    .catch(err => console.log(err))
                            })
                            .catch(() => this.pubClient.setAsync(config.state, 1)
                                .then(res => console.log('incremented', 1))
                                .catch(err => console.log(err)));

                    })
                    .catch(err => console.log('pop error', this.thread, err))

            }
            await sleep(config.cycle, config.lag)
        }
    }

    close() {
        this.pubClient.quit();
        this.subClient.quit();
    }
}

new Processor(workerData).run();