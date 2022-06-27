const time = new Date();

function fullDate() {
    let fullDate = time.toISOString().slice(0, 10);
    return fullDate;
}

function timestamp() {
    let timestamp = time.toISOString().slice(11, 13) + time.toISOString().slice(14, 16) + time.toISOString().slice(17, 19);
    return timestamp;
}

timestamp()

module.exports = {
    time,
    fullDate,
    timestamp
}