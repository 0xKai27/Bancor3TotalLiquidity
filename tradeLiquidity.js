const {Parser} = require('json2csv');
const fs = require('fs');

const {PoolCollection} = require("./configs/contractInfo");
const {tokenAddresses} = require("./configs/tokenAddresses");
const {web3, provider} = require("./configs/web3");
const {exportPath} = require("./configs/exportPath");

async function async() {
    // Get the ETH account
    const accounts = await web3.eth.getAccounts();
    console.log(`Accounts: ${accounts[0]}`)

    // Log the pool type to ensure connection success
    const poolType = await PoolCollection.methods.poolType().call();
    console.log(`Pool Type: ${poolType}`);

    try {
        let currentBlockNumber = await web3.eth.getBlockNumber();
        console.log(`Block Number: ${currentBlockNumber}`)
        let startingBlock = currentBlockNumber - 172800*3 // 172800 blocks in a month, 15s block time

        const pastEvents = await PoolCollection.getPastEvents("TotalLiquidityUpdated", {
            fromBlock: startingBlock,
            toBlock: "latest"
        })

        let latestEvents = []

        // Initialize latestEvents with the unique set of tokens 
        pastEvents.filter((event) => {
            var i = latestEvents.findIndex(x => (x.returnValues.pool == event.returnValues.pool));
            if(i <= -1){
                    latestEvents.push(event);
            }
            return null;
        })

        // Update latest event per token
        for (let i = 0; i < pastEvents.length; i++) {
            for (let j = 0; j < latestEvents.length; j++) {
                if (pastEvents[i].returnValues.pool == latestEvents[j].returnValues.pool && pastEvents[i].blockNumber > latestEvents[j].blockNumber) {
                    latestEvents[j] = pastEvents[i];
                }
            }
        }

        // Specify column headers to export
        let fields = [
            {
                label: "Contract Address",
                value: "address"
            },
            {
                label: "Block Hash",
                value: "blockHash"
            },
            {
                label: "Block Number",
                value: "blockNumber"
            },
            {
                label: "Pool",
                value: "returnValues.pool"
            },
            {
                label: "Master Vault Balances",
                value: "returnValues.liquidity"
            },
            {
                label: "Staked Balance",
                value: "returnValues.stakedBalance"
            },
            {
                label: "Pool Token Supply",
                value: "returnValues.poolTokenSupply"
            }
        ]
        let opts = { fields };
        let parser = new Parser(opts)
        let csv = parser.parse(latestEvents, opts)

        csv = replaceWithTokenSymbol(csv);
        exportCsv(csv);


    } catch(err) {
        console.log(err)
    }
}


// Replace the token addresses with the more readable token symbol
function replaceWithTokenSymbol(csv) {
    for (let i = 0; i < tokenAddresses.length; i++) {
        csv = csv.replace(tokenAddresses[i].address, tokenAddresses[i].symbol);
    }
    return csv;
}

// Export to local drive
function exportCsv(csv) {
    fs.writeFile(exportPath, csv, err => {
        if (err) {
            console.log(err);
        }
    })    
}

async();

provider.engine.stop();