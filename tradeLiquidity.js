const Big = require('big.js');
const ERC20ABI = require('erc-20-abi')

const {PoolCollection, PendingWithdrawals, BancorNetworkInfo} = require("./configs/contractInfo");
const {tokenAddresses} = require("./configs/tokenAddresses");
const {web3, provider} = require("./configs/web3");
const {exportPath} = require("./utility/exportPath");
const CSV = require("./utility/csv");
const Math = require("./utility/math")
const {getPrice} = require("./configs/priceFeed");

async function getTotalLiquidity() {

    console.log("Getting Bancor3 total liquidity");

    try {
        
        let totalLiquidity = [];

        // Initialize the total liquidity object with base token sumbol and address
        tokenAddresses.forEach(pool => totalLiquidity.push({
            baseTokenSymbol: pool.symbol,
            baseTokenAddress: pool.address
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

        // Get the pool trading liquidity and append to the total liquidity object
        console.log("Getting pool trading liquidity");
        const poolTradingLiquidity = await getPoolTradingLiquidity();
        poolTradingLiquidity.forEach((token) => {
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].bntTradingLiquidity = token.bntTradingLiquidity;
            totalLiquidity[totalLiquidity.findIndex(data => data.baseTokenAddress == token.pool)].baseTokenTradingLiquidity = token.baseTokenTradingLiquidity;
        })

        // Get the full withdrawal amount for each pool
        console.log("Getting the full withdrawal amounts");
        for (let i = 0; i < totalLiquidity.length; i++) {
            if (totalLiquidity[i].poolTokenSupply && totalLiquidity[i].poolTokenSupply !=  "0") {
                let fullWithdrawal = await getFullWithdrawalAmount(totalLiquidity[i].baseTokenAddress, totalLiquidity[i].poolTokenSupply);
                totalLiquidity[i].fullWithdrawalAmount = fullWithdrawal.totalAmount;
                totalLiquidity[i].fullWithdrawalBaseTokenAmount = fullWithdrawal.baseTokenAmount;
                totalLiquidity[i].fullWithdrawalBNTAmount = fullWithdrawal.bntAmount;
            } else {
                totalLiquidity[i].fullWithdrawalAmount = null;
                totalLiquidity[i].fullWithdrawalBaseTokenAmount = null;
                totalLiquidity[i].fullWithdrawalBNTAmount = null;
            }
        } 

        // Calculate the current IL and append to the total liquidity object
        console.log("Calculating the implied TKN IL");
        totalLiquidity.forEach((pool) => {

            let impliedIL;

            if (pool.fullWithdrawalBaseTokenAmount && pool.fullWithdrawalAmount) {
                impliedIL = Math.div(pool.fullWithdrawalBaseTokenAmount, pool.fullWithdrawalAmount);
            }

            pool.impliedIL = (impliedIL) ? new Big(impliedIL).toFixed(5): "-";
        })

        // Calculate the base token surplus/deficit and append to the total liquidity object
        console.log("Calculating the base token surplus/deficit");
        totalLiquidity.forEach((pool) => {
            if (pool.baseTokenSymbol == "BNT") {
                pool.baseTokenSurplusDeficit = Math.sub(pool.fullWithdrawalBNTAmount, pool.fullWithdrawalAmount);
            } else if (pool.fullWithdrawalBaseTokenAmount && pool.fullWithdrawalAmount) {
                pool.baseTokenSurplusDeficit = Math.sub(pool.fullWithdrawalBaseTokenAmount, pool.fullWithdrawalAmount); 
            }                  
        })

        // Get the token prices and append to the total liquidity object
        console.log("Getting the token price in USD");
        let tokenPrices = await getPrice();
        totalLiquidity.forEach((pool) => {
            for (let i = 0; i < tokenPrices.length; i++) {
                if (pool.baseTokenAddress == tokenPrices[i].address) {
                    pool.priceInUSD = tokenPrices[i].priceInUSD ? tokenPrices[i].priceInUSD : "-";
                }
            }
        })

        // Calculate USD surplus/deficit and append to the total liquidity object
        console.log("Calculating surplus/deficit in USD");
        totalLiquidity.forEach((pool) => {
            if (pool.priceInUSD == "-" || !pool.baseTokenSurplusDeficit || pool.baseTokenSurplusDeficit == "0") {
                pool.surplusDeficitUSD = "-";
            } else {
                let baseTokenSurplusDeficit = Math.processDecimals(pool.baseTokenSurplusDeficit, pool.baseTokenAddress);

                pool.surplusDeficitUSD = new Big(
                    Math.mul(pool.priceInUSD, baseTokenSurplusDeficit)
                    ).toFixed(2)
            }
        })

        // Calculate the master vault TKN reesidue and append to the total liquidity object
        console.log("Calculating the master vault TKN residue");
        totalLiquidity.forEach((pool) => {
            let vaultResidue = Math.sub(pool.masterVaultBalance, pool.fullWithdrawalAmount);
            if (vaultResidue) {
                pool.vaultResidue = vaultResidue.startsWith("-") ? "-" : vaultResidue;
            } else {
                pool.vaultResidue = "-";
            }
        })

        // Process the decimals
        console.log("Processing decimals")
        totalLiquidity.forEach((pool) => {
            pool.stakedBalance = Math.processDecimals(pool.stakedBalance, pool.baseTokenAddress);
            pool.masterVaultBalance = Math.processDecimals(pool.masterVaultBalance, pool.baseTokenAddress);
            pool.poolTokenSupply = Math.processDecimals(pool.poolTokenSupply, pool.baseTokenAddress);
            pool.poolTokenPendingWithdrawals = Math.processDecimals(pool.poolTokenPendingWithdrawals, pool.baseTokenAddress);
            pool.reserveTokenPendingWithdrawals = Math.processDecimals(pool.reserveTokenPendingWithdrawals, pool.baseTokenAddress);
            pool.bntTradingLiquidity = Math.processDecimals(pool.bntTradingLiquidity, "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C"); //BNT address
            pool.baseTokenTradingLiquidity = Math.processDecimals(pool.baseTokenTradingLiquidity, pool.baseTokenAddress);
            pool.fullWithdrawalAmount = Math.processDecimals(pool.fullWithdrawalAmount, pool.baseTokenAddress);
            pool.fullWithdrawalBaseTokenAmount = Math.processDecimals(pool.fullWithdrawalBaseTokenAmount, pool.baseTokenAddress);
            pool.fullWithdrawalBNTAmount = Math.processDecimals(pool.fullWithdrawalBNTAmount, "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C");
            pool.baseTokenSurplusDeficit = Math.processDecimals(pool.baseTokenSurplusDeficit, pool.baseTokenAddress);
            pool.vaultResidue = Math.processDecimals(pool.vaultResidue, pool.baseTokenAddress);
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
            },
            {
                label: "Full Withdrawal Amount",
                value: "fullWithdrawalAmount"
            },
            {
                label: "Full Withdrawal TKN Amount",
                value: "fullWithdrawalBaseTokenAmount"
            },
            {
                label: "Full Withdrawal BNT Amount",
                value: "fullWithdrawalBNTAmount"
            },
            {
                label: "Implied TKN IL",
                value: "impliedIL"
            },
            {
                label: "TKN Surplus/Deficit",
                value: "baseTokenSurplusDeficit"
            },
            {
                label: "TKN USD Price",
                value: "priceInUSD"
            },
            {
                label: "Surplus/Deficit USD",
                value: "surplusDeficitUSD"
            },
            {
                label: "Vault TKN Residue",
                value: "vaultResidue"
            }                   
        ]

        // Process and export to CSV
        let csv = CSV.json2csv(totalLiquidity, fields);
        CSV.exportCsv(csv, exportPath.tradingLiquidity);

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

// Get the actual withdrawal amounts is all pool tokens were to be removed
async function getFullWithdrawalAmount(token, amount) {
    try {

        let fullWithdrawalAmount = await BancorNetworkInfo.methods.withdrawalAmounts(token, amount).call();
        return fullWithdrawalAmount;

    } catch (err) {
        console.log(err);
    }
}

getTotalLiquidity();

provider.engine.stop();