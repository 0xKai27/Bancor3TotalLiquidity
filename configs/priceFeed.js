const fetch = require("node-fetch");
const {tokenAddresses} = require("./tokenAddresses");

// Get the prices for each token
async function getPrice() {
    try {
        let tokenPrices = [];

        let contractAddresses = "";

        tokenAddresses.forEach((token) => {
            if (token.symbol != "ETH") {
                if (!contractAddresses) {
                    contractAddresses = token.address;
                } else {
                    contractAddresses += `,${token.address}`
                }
            }
        })

        // Get the price of ETH and append to tokenPrices array
        let ETHresponse = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum`);
        let ETHdata = await ETHresponse.json();
        tokenPrices.push({
            address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            priceInUSD: ETHdata.market_data.current_price.usd
        })

        // Get the token prices and append to tokenPrices array
        let response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddresses}&vs_currencies=usd`);
        let data = await response.json();

        

        tokenAddresses.forEach((token) => {
            if (data[`${token.address.toLowerCase()}`]) {
                tokenPrices.push({
                    address: token.address,
                    priceInUSD: data[`${token.address.toLowerCase()}`].usd
                });
            }
        })
        
        return tokenPrices;
    } catch (err) {
        console.log(err);
    }



}


getPrice()
