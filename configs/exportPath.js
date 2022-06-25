const path = require('path');

const exportsFolderPath = path.resolve("exports");

// Add your local directory path here
const exportPath = {
    tradingLiquidity: exportsFolderPath + "/Bancor3TradingLiquidity.csv",
    pendingWithdrawals: exportsFolderPath + "/Bancor3PendingWithdrawals.csv",
    poolTokenAmountsPendingWithdrawals: exportsFolderPath + "/Bancor3PoolTokenAmountsPendingWithdrawals.csv"
}

module.exports = {exportPath};