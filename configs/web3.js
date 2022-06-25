const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');

const provider = new HDWalletProvider(
    // Insert mmemonic here
    '',
    // Insert provider URL here
    ''
)
const web3 = new Web3(provider);

module.exports = {web3, provider}