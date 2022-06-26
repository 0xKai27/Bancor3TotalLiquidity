const {Parser} = require('json2csv');
const fs = require('fs');
const Big = require('big.js');
const ERC20ABI = require('erc-20-abi')

const {PoolCollection, PendingWithdrawals, BancorNetworkInfo} = require("./configs/contractInfo");
const {tokenAddresses} = require("./configs/tokenAddresses");
const {web3, provider} = require("./configs/web3");
const {exportPath} = require("./configs/exportPath");

async function getTotalLiquidity() {

    console.log("Getting Bancor3 total liquidity");

    try {
        let currentBlockNumber = await web3.eth.getBlockNumber();
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
        
        let totalLiquidity = [];

        // Get the token pending withdrawal amounts
        console.log("Getting pending withdrawal request amounts");
        let pendingWithdrawalsAmounts = await pendingWithdrawalsTokenAmounts();

        // Join the pending withdrawal amounts with the events object
        for (let i = 0; i < latestEvents.length; i++) {
            for (let j = 0; j < pendingWithdrawalsAmounts.length; j++) {
                if (latestEvents[i].returnValues.pool == pendingWithdrawalsAmounts[j].pool) {
                    totalLiquidity.push({
                        blockHash: latestEvents[i].blockHash,
                        blockNumber: latestEvents[i].blockNumber,
                        pool: latestEvents[i].returnValues.pool,
                        masterVaultBalances: latestEvents[i].returnValues.liquidity,
                        stakedBalance: latestEvents[i].returnValues.stakedBalance,
                        poolTokenSupply: latestEvents[i].returnValues.poolTokenSupply,
                        pendingWithdrawalsPoolTokenAmount: pendingWithdrawalsAmounts[j].poolTokenAmount,
                        pendingWithdrawalsReserveTokenAmount: pendingWithdrawalsAmounts[j].reserveTokenAmount
                    })
                }
            }
        }
        
        // Get the pool trading liquidity
        console.log("Getting pool trading liquidity");
        let poolTradingLiquidity = await getPoolTradingLiquidity();

        // Join the total liquidity with the pool trading liquidity
        for (let i = 0; i < totalLiquidity.length; i++) {
            for (let j = 0; j < poolTradingLiquidity.length; j++) {
                if (totalLiquidity[i].pool == poolTradingLiquidity[j].pool) {
                    totalLiquidity[i].bntTradingLiquidity = poolTradingLiquidity[j].bntTradingLiquidity,
                    totalLiquidity[i].baseTokenTradingLiquidity = poolTradingLiquidity[j].baseTokenTradingLiquidity
                }
            }
        }

        // Process decimal points
        for (let i = 0; i < totalLiquidity.length; i++) {
            totalLiquidity[i].masterVaultBalances = processDecimals(totalLiquidity[i].masterVaultBalances, totalLiquidity[i].pool);
            totalLiquidity[i].stakedBalance = processDecimals(totalLiquidity[i].stakedBalance, totalLiquidity[i].pool);
            totalLiquidity[i].poolTokenSupply = processDecimals(totalLiquidity[i].poolTokenSupply, totalLiquidity[i].pool);
            totalLiquidity[i].bntTradingLiquidity = processDecimals(totalLiquidity[i].bntTradingLiquidity, "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C"); //BNT address
            totalLiquidity[i].baseTokenTradingLiquidity = processDecimals(totalLiquidity[i].baseTokenTradingLiquidity, totalLiquidity[i].pool);
            totalLiquidity[i].pendingWithdrawalsPoolTokenAmount = processDecimals(totalLiquidity[i].pendingWithdrawalsPoolTokenAmount, totalLiquidity[i].pool);
            totalLiquidity[i].pendingWithdrawalsReserveTokenAmount = processDecimals(totalLiquidity[i].pendingWithdrawalsReserveTokenAmount, totalLiquidity[i].pool);
        }

        console.log("Exporting total liquidity to CSV");
        // Specify column headers to export to CSV
        let fields = [
            // {
            //     label: "Block Hash",
            //     value: "blockHash"
            // },
            // {
            //     label: "Block Number",
            //     value: "blockNumber"
            // },
            {
                label: "Pool",
                value: "pool"
            },
            {
                label: "Master Vault Balances",
                value: "masterVaultBalances"
            },
            {
                label: "Staked Balance",
                value: "stakedBalance"
            },
            {
                label: "Pool Token Supply",
                value: "poolTokenSupply"
            },
            {
                label: "Pool BNT Trading Liquidity",
                value: "bntTradingLiquidity"
            },
            {
                label: "Pool Base Trading Liquidity",
                value: "baseTokenTradingLiquidity"
            },
            {
                label: "Pool Tokens Pending Withdrawals",
                value: "pendingWithdrawalsPoolTokenAmount"
            },
            {
                label: "Reserve Tokens Pending Withdrawals",
                value: "pendingWithdrawalsReserveTokenAmount"
            }
        ]

        // Process and export to CSV
        let csv = json2csv(totalLiquidity, fields);
        csv = replaceWithTokenSymbol(csv);
        exportCsv(csv, exportPath.tradingLiquidity);

        // Uncomment the below if you want to generate the pending withdrawal contract pool token balances
        // console.log("Getting PendingWithdrawals contract balances");
        // await pendingWithdrawalsPoolTokenBalances();  

    } catch(err) {
        console.log(err)
    }
}

// Get the staked balances directly from contract
async function getStakedBalance() {
    let stakedBalances = [];

    for (let i = 0; i < tokenAddresses.length; i++) {
        let stakedBalance = await BancorNetworkInfo.methods.stakedBalance(tokenAddresses[i].address).call();
        stakedBalances.push({
            pool: tokenAddresses[i].address,
            stakedBalance: stakedBalance
        })
    }

    return stakedBalances;
}

// Get the total pending withdrawals amounts by token
async function pendingWithdrawalsTokenAmounts() {

    try {
        let withdrawalRequests = await PendingWithdrawals.getPastEvents("WithdrawalInitiated", {
            fromBlock: "earliest",
            toBlock: "latest"
        })

        // Remove completed/cancelled request from list
        const cancelledWithdrawalRequests = await PendingWithdrawals.getPastEvents("WithdrawalCancelled", {
            fromBlock: "earliest",
            toBlock: "latest"
        });

        for (let i = 0; i < cancelledWithdrawalRequests.length; i++) {
            withdrawalRequests = withdrawalRequests.filter((request) => {
                return request.returnValues.requestId != cancelledWithdrawalRequests[i].returnValues.requestId;
            })
        }
        
        const completedWithdrawalRequests = await PendingWithdrawals.getPastEvents("WithdrawalCompleted", {
            fromBlock: "earliest",
            toBlock: "latest"
        });

        for (let i = 0; i < completedWithdrawalRequests.length; i++) {
            withdrawalRequests = withdrawalRequests.filter((request) => {
                return request.returnValues.requestId != completedWithdrawalRequests[i].returnValues.requestId;
            })
        }
        
        let tokenPendingWithdrawalAmounts = [];

        // Initialize tokens array with list of unique tokens
        withdrawalRequests.filter((request) => {
            var i = tokenPendingWithdrawalAmounts.findIndex(x => (x.pool == request.returnValues.pool));
            if(i <= -1){
                tokenPendingWithdrawalAmounts.push({
                    pool: request.returnValues.pool,
                    poolTokenAmount: new Big(0),
                    reserveTokenAmount: new Big(0)
                });
            }
            return null;
        })

        // Sum up the amount of tokens pending withdrawals
        for (let i = 0; i < tokenPendingWithdrawalAmounts.length; i++) {
            for (let j = 0; j < withdrawalRequests.length; j++) {
                if (tokenPendingWithdrawalAmounts[i].pool == withdrawalRequests[j].returnValues.pool) {
                    tokenPendingWithdrawalAmounts[i].poolTokenAmount = tokenPendingWithdrawalAmounts[i].poolTokenAmount.plus(parseInt(withdrawalRequests[j].returnValues.poolTokenAmount));
                    tokenPendingWithdrawalAmounts[i].reserveTokenAmount = tokenPendingWithdrawalAmounts[i].reserveTokenAmount.plus(parseInt(withdrawalRequests[j].returnValues.reserveTokenAmount));
                }
            }
            tokenPendingWithdrawalAmounts[i].poolTokenAmount = tokenPendingWithdrawalAmounts[i].poolTokenAmount.toFixed().toString();
            tokenPendingWithdrawalAmounts[i].reserveTokenAmount = tokenPendingWithdrawalAmounts[i].reserveTokenAmount.toFixed().toString();
        }

        // Process the decimal precision per token
        for (let i = 0; i < withdrawalRequests.length; i++) {
            withdrawalRequests[i].returnValues.poolTokenAmount = processDecimals(withdrawalRequests[i].returnValues.poolTokenAmount, withdrawalRequests[i].returnValues.pool);
            withdrawalRequests[i].returnValues.reserveTokenAmount = processDecimals(withdrawalRequests[i].returnValues.reserveTokenAmount, withdrawalRequests[i].returnValues.pool);
        }

        console.log("Exporting pending withdrawal requests to CSV");
        // Specify column headers to export
        let fields = [
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
                label: "Provider",
                value: "returnValues.provider"
            },
            {
                label: "Pool Token Amount",
                value: "returnValues.poolTokenAmount"
            },
            {
                label: "Reserve Token Amount",
                value: "returnValues.reserveTokenAmount"
            }
        ]

        // Process and export to CSV
        let csv = json2csv(withdrawalRequests, fields);
        csv = replaceWithTokenSymbol(csv);
        exportCsv(csv, exportPath.pendingWithdrawals);        

        return tokenPendingWithdrawalAmounts;

    } catch(err) {
        console.log(err)
    }
}

// Get the pending withdrawal contract balances
async function pendingWithdrawalsPoolTokenBalances() {
    const PendingWithdrawalsContract = "0x857Eb0Eb2572F7092C417CD386BA82e45EbA9B8a";
    
    let tokenBalances = [];

    for (let i = 0; i < tokenAddresses.length; i ++) {
        
        let poolToken = (tokenAddresses[i].symbol == "BNT") ? "0xAB05Cf7C6c3a288cd36326e4f7b8600e7268E344" : await PoolCollection.methods.poolToken(tokenAddresses[i].address).call();

        // Check if the pool token exists in the pool collection data
        if (poolToken == "0x0000000000000000000000000000000000000000") {
            tokenBalances.push({
                token: tokenAddresses[i].address,
                poolTokenBalance: "0",
                poolToken: poolToken
            })
        } else {
            let tokenContract = new web3.eth.Contract(ERC20ABI, poolToken);
        
            tokenBalances.push({
                token: tokenAddresses[i].address,
                poolTokenBalance: await tokenContract.methods.balanceOf(PendingWithdrawalsContract).call(),
                poolToken: poolToken
            })
        }
    }

    // Process the decimal precision per token
    for (let i = 0; i < tokenBalances.length; i++) {
        tokenBalances[i].poolTokenBalance = processDecimals(tokenBalances[i].poolTokenBalance, tokenBalances[i].token);
    }

    console.log("Exporting PendingWithdrawals contract balances to CSV");
    // Specify column headers to export
    let fields = [
        {
            label: "Base Token",
            value: "token"
        },
        {
            label: "Pool Token Balance",
            value: "poolTokenBalance"
        },
        {
            label: "Pool Token",
            value: "poolToken"
        }
    ]

    // Process and export to CSV
    let csv = json2csv(tokenBalances, fields);
    csv = replaceWithTokenSymbol(csv);
    exportCsv(csv, exportPath.poolTokenAmountsPendingWithdrawals); 

    return tokenBalances;
}

// Get the bnt and base token trading liquidity
async function getPoolTradingLiquidity() {
    
    try {
        let tradingLiquidity = [];

        for (let i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i].symbol == "BNT") {
                tradingLiquidity.push({
                    pool: tokenAddresses[i].address,
                    bntTradingLiquidity: "",
                    baseTokenTradingLiquidity: ""
                })
            } else {
                let poolLiquidity = await BancorNetworkInfo.methods.tradingLiquidity(tokenAddresses[i].address).call();
                tradingLiquidity.push({
                    pool: tokenAddresses[i].address,
                    bntTradingLiquidity: poolLiquidity.bntTradingLiquidity,
                    baseTokenTradingLiquidity: poolLiquidity.baseTokenTradingLiquidity
                })
            }
        }

        return tradingLiquidity;
    } catch (err) {
        console.log(err)
    }
}

// Process the decimals
function processDecimals(str, token) {
    for (let i = 0; i < tokenAddresses.length; i++) {
        if (tokenAddresses[i].address == token && tokenAddresses[i].decimals) {
            if (str.length <= tokenAddresses[i].decimals) {
                str = "0." + str.padStart(tokenAddresses[i].decimals, "0");
            } else {
                str = str.slice(0, str.length - tokenAddresses[i].decimals) + "." + str.slice(-tokenAddresses[i].decimals, str.length);
            }
        }
    }
    return str;
}

// Replace the token addresses with the more readable token symbol
function replaceWithTokenSymbol(str) {
    for (let i = 0; i < tokenAddresses.length; i++) {
        str = str.replaceAll(tokenAddresses[i].address, tokenAddresses[i].symbol);
    }
    return str;
}

// Convert JSON to CSV
function json2csv(obj, fields) {

    let opts = { fields };
    let parser = new Parser(opts)
    let csv = parser.parse(obj, opts)

    return csv;
}

// Export to local drive
function exportCsv(csv, path) {
    fs.writeFile(path, csv, err => {
        if (err) {
            console.log(err);
        }
    })    
}

getTotalLiquidity();

provider.engine.stop();