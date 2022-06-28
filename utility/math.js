const Big = require('big.js');

const {tokenAddresses} = require("../configs/tokenAddresses");

// Addition
function add(x,y) {
    let bigX = new Big(x);
    let bigY = new Big(y);

    return bigX.plus(bigY).toFixed();
}

// Substraction
function sub(x,y) {
    let bigX = new Big(x);
    let bigY = new Big(y);

    return bigX.minus(bigY).toFixed();
}

// Multiplication
function mul(x,y) {
    let bigX = new Big(x);
    let bigY = new Big(y);

    return bigX.times(bigY).toFixed();
}

// Division
function div(x,y) {
    let bigX = new Big(x);
    let bigY = new Big(y);

    return bigX.div(bigY).toFixed();
}

// Process the decimals
function processDecimals(str, token) {
    for (let i = 0; i < tokenAddresses.length; i++) {
        if (tokenAddresses[i].address == token && tokenAddresses[i].decimals) {
            if (!str || new Big(str).toFixed(0) == "0") {
                str = "-";
            } else if (str.length <= tokenAddresses[i].decimals) {
                str = "0." + str.padStart(tokenAddresses[i].decimals, "0");
            } else if (str.includes(".")) {
                continue;
            } else {
                str = str.slice(0, str.length - tokenAddresses[i].decimals) + "." + str.slice(-tokenAddresses[i].decimals, str.length);
            }
        }
    }

    // Change precision to 15 digits
    if (str != "-") {
        str = new Big(str).toPrecision(15);
    }

    // Remove trailing zeroes
    while (str.endsWith("0")) {
        str = str.slice(0, str.length-1);
    }

    return str;
}

module.exports = {
    add,
    sub,
    mul,
    div,
    processDecimals
};