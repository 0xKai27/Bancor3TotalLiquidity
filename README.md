# Bancor3 Total Liquidity Query

This code base is meant to enable the user to query Bancor3 liquidity. User can configure their own Web3 provider and download path in the configs folder. The contract address can be configured in `contractInfo.js` if required.

Pricing info is pulled from Coingecko API: https://www.coingecko.com/en/api/documentation

To run the code, copy and paste the following into your terminal while in the working folder:
```
npm i
node tradeLiquidity.js
```