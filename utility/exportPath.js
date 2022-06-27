const path = require('path');

const exportsFolderPath = path.resolve("exports");
const time = require("./time");

// Add your local directory path here
const exportPath = {
    tradingLiquidity: `${exportsFolderPath}/${time.timestamp()}_${time.fullDate()}_Bancor3TotalLiquidity.csv`,
    poolTokenAmountsPendingWithdrawals: `${exportsFolderPath}/${time.timestamp()}_${time.fullDate()}_Bancor3PoolTokenAmountsPendingWithdrawals.csv`
}

module.exports = {exportPath};