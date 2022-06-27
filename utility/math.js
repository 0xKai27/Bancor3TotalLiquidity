const Big = require('big.js');

const {tokenAddresses} = require("../configs/tokenAddresses");

// Process the decimals
function processDecimals(str, token) {
    for (let i = 0; i < tokenAddresses.length; i++) {
        if (tokenAddresses[i].address == token && tokenAddresses[i].decimals) {
            if (!str || new Big(str).toFixed(0) == 0) {
                str = "-";
            } else if (str.length <= tokenAddresses[i].decimals) {
                str = "0." + str.padStart(tokenAddresses[i].decimals, "0");
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

module.exports = {processDecimals};