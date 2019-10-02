async function sleep(ms = 100, dispersion = 0) {
    ms = Math.max(0, ms);
    if (dispersion < 0) {
        dispersion = ms / 2;
    }
    ms = getRandomIntWithDispersion(ms, dispersion);
    const start = Date.now();
    return new Promise(r => setTimeout(() => r(Date.now() - start), ms));
}


function getRandomIntBetween(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min) + min);
}

function getRandomIntWithDispersion(base, dispersion = 0.1) {
    if (dispersion == 0) {
        return base;
    } else if (dispersion <= 1) {
        dispersion *= base;
    }

    return getRandomIntBetween(base - dispersion, base + dispersion);
}


module.exports = { sleep }