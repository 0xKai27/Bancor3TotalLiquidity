const Big = require('big.js');

const {tokenAddresses} = require("../configs/tokenAddresses");

// Addition
function add(x,y) {

    if (x && y) {
        let bigX = new Big(x);
        let bigY = new Big(y);
    
        return bigX.plus(bigY).toFixed();
    }

    return null;

}

// Substraction
function sub(x,y) {

    if (x && y) {
        let bigX = new Big(x);
        let bigY = new Big(y);
    
        return bigX.minus(bigY).toFixed();
    }

    return null;

}

// Multiplication
function mul(x,y) {

    if (x && y) {
        let bigX = new Big(x);
        let bigY = new Big(y);
    
        return bigX.times(bigY).toFixed();
    }

    return null;

}

// Division
function div(x,y) {

    if (x && y) {
        let bigX = new Big(x);
        let bigY = new Big(y);
    
        if (bigY != 0) {
            return bigX.div(bigY).toFixed();
        } 
    }

    return null;

}

// Process the decimals
function processDecimals(str, token) {

    let isNeg;

    if (str) {
        isNeg = str.startsWith("-");
    }

    if (isNeg) {str = str.slice(1, str.length)};

    for (let i = 0; i < tokenAddresses.length; i++) { 
        if (tokenAddresses[i].address == token && tokenAddresses[i].decimals) {
            if (!str || new Big(str) == 0) {
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

    if (isNeg) {str = `-${str}`};

    return str;
}

module.exports = {
    add,
    sub,
    mul,
    div,
    processDecimals
};