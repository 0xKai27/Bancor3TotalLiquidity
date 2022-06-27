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
        
        let totalLiquidity = [];

        // Initialize the total liquidity object with base token sumbol and address
        tokenAddresses.forEach(token => totalLiquidity.push({
            baseTokenSymbol: token.symbol,
            baseTokenAddress: token.address
        }));

        // Get the staked balances and append to the total liquidity object
        console.log("Getting the staked balances");
        const stakedBalance = await getStakedBalance();
        stakedBalance.forEach((token) => {
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].stakedBalance = token.stakedBalance;
        })

        // Get the master vault balances and append to the total liquidity object
        console.log("Getting the master vault balances");
        const masterVaultBalances = await getMasterVaultBalances();
        masterVaultBalances.forEach((token) => {
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].masterVaultBalance = token.masterVaultBalance;
        })

        // Get the pool token supply and append to the total liquidity object
        console.log("Getting the pool token supply");
        const poolTokenSupply = await getPoolTokenSupply(); 
        poolTokenSupply.forEach((token) => {
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].poolTokenSupply = token.poolTokenSupply;
        })

        // Get the pending withdrawals and append to the total liquidity object
        console.log("Getting the pending withdrawal amounts");
        const pendingWithdrawalsAmounts = await pendingWithdrawalsTokenAmounts();
        pendingWithdrawalsAmounts.forEach((token) => {
            if (totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)]) {
                totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].poolTokenPendingWithdrawals = token.poolTokenAmount;
                totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].reserveTokenPendingWithdrawals = token.reserveTokenAmount;
            }
        })

        // // Get the pool trading liquidity and append to the total liquidity object
        console.log("Getting pool trading liquidity");
        const poolTradingLiquidity = await getPoolTradingLiquidity();
        poolTradingLiquidity.forEach((token) => {
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].bntTradingLiquidity = token.bntTradingLiquidity;
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].baseTokenTradingLiquidity = token.baseTokenTradingLiquidity;
        })

        // Process the decimals
        totalLiquidity.forEach((token) => {
            token.stakedBalance = processDecimals(token.stakedBalance, token.baseTokenAddress);
            token.masterVaultBalance = processDecimals(token.masterVaultBalance, token.baseTokenAddress);
            token.poolTokenSupply = processDecimals(token.poolTokenSupply, token.baseTokenAddress);
            token.poolTokenPendingWithdrawals = processDecimals(token.poolTokenPendingWithdrawals, token.baseTokenAddress);
            token.reserveTokenPendingWithdrawals = processDecimals(token.reserveTokenPendingWithdrawals, token.baseTokenAddress);
            token.bntTradingLiquidity = processDecimals(token.bntTradingLiquidity, "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C"); //BNT address
            token.baseTokenTradingLiquidity = processDecimals(token.baseTokenTradingLiquidity, token.baseTokenAddress);
        })

        console.log("Exporting total liquidity to CSV");
        // Specify column headers to export to CSV
        let fields = [
            {
                label: "Pool",
                value: "baseTokenSymbol"
            },
            {
                label: "Master Vault Balance",
                value: "masterVaultBalance"
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
                value: "poolTokenPendingWithdrawals"
            },
            {
                label: "Reserve Tokens Pending Withdrawals",
                value: "reserveTokenPendingWithdrawals"
            }
        ]

        // Process and export to CSV
        let csv = json2csv(totalLiquidity, fields);
        exportCsv(csv, exportPath.tradingLiquidity);

        // Uncomment the below if you want to generate the pending withdrawal contract pool token balances
        console.log("Getting PendingWithdrawals contract balances");
        await pendingWithdrawalsPoolTokenBalances();  

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

// Get the master vault balances
async function getMasterVaultBalances() {
    let balances = [];

    const masterVault = await BancorNetworkInfo.methods.masterVault().call();

    for (let i = 0; i < tokenAddresses.length; i++) {
        if (tokenAddresses[i].symbol == "ETH") {
            balances.push({
                pool: tokenAddresses[i].address,
                masterVaultBalance: await web3.eth.getBalance(masterVault)
            })
        } else {
            let tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddresses[i].address);
            let vaultBalance =  await tokenContract.methods.balanceOf(masterVault).call();
    
            balances.push({
                pool: tokenAddresses[i].address,
                masterVaultBalance: vaultBalance
            })
        }
    }

    return balances;
}

// Get the pool token supply
async function getPoolTokenSupply() {
    let allPoolTokenSupply = [];

    for (let i = 0; i < tokenAddresses.length; i++) {
        let poolToken = await BancorNetworkInfo.methods.poolToken(tokenAddresses[i].address).call();
        let tokenContract = new web3.eth.Contract(ERC20ABI, poolToken);

        allPoolTokenSupply.push({
            pool: tokenAddresses[i].address,
            poolToken: "bn" + tokenAddresses[i].symbol,
            poolTokenSupply: await tokenContract.methods.totalSupply().call()
        })

    }

    return allPoolTokenSupply;
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