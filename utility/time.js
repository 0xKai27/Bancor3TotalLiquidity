const d = new Date();

function time() {
    d.getTime();
}

function date() {
    d.getDate();
};

function month() {
    d.getMonth();
}

function year() {
    d.getFullYear();
}

module.exports = {
    time,
    date,
    month,
    year
}