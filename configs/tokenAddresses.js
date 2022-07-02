// Specify the token contract addresses
const tokenAddresses = [
    {
        symbol: "BNT",
        address: "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
        decimals: 18
    },
    {
        symbol: "LINK",
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        decimals: 18
    },
    {
        symbol: "DAI",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18
    },
    {
        symbol: "wBTC",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        decimals: 8
    },
    {
        symbol: "ICHI",
        address: "0x903bEF1736CDdf2A537176cf3C64579C3867A881",
        decimals: 9
    },
    {
        symbol: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18
    },
    {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6
    },
    {
        symbol: "vBNT",
        address: "0x48Fb253446873234F2fEBbF9BdeAA72d9d387f94",
        decimals: 18
    },
    {
        symbol: "WOO",
        address: "0x4691937a7508860F876c9c0a2a617E7d9E945D4B",
        decimals: 18
    },
    {
        symbol: "wNXM",
        address: "0x0d438F3b5175Bebc262bF23753C1E53d03432bDE",
        decimals: 18
    },
    {
        symbol: "TRAC",
        address: "0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F",
        decimals: 18
    },
    {
        symbol: "HOT",
        address: "0x6c6EE5e31d828De241282B9606C8e98Ea48526E2",
        decimals: 18
    },
    {
        symbol: "PHTR",
        address: "0xE1Fc4455f62a6E89476f1072530C20CF1A0622dA",
        decimals: 18
    },
    {
        symbol: "BAT",
        address: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
        decimals: 18
    },
    {
        symbol: "BORING",
        address: "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA",
        decimals: 18
    },
    {
        symbol: "MFG",
        address: "0x6710c63432A2De02954fc0f851db07146a6c0312",
        decimals: 18
    },
    {
        symbol: "ENJ",
        address: "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c",
        decimals: 18
    },
    {
        symbol: "REQ",
        address: "0x8f8221aFbB33998d8584A2B05749bA73c37a938a",
        decimals: 18
    },
    {
        symbol: "LQTY",
        address: "0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D",
        decimals: 18
    },
    {
        symbol: "MTA",
        address: "0xa3BeD4E1c75D00fa6f4E5E6922DB7261B5E9AcD2",
        decimals: 18
    },
    {
        symbol: "INDEX",
        address: "0x0954906da0Bf32d5479e25f46056d22f08464cab",
        decimals: 18
    },
    {
        symbol: "YFI",
        address: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
        decimals: 18
    },
    {
        symbol: "AMP",
        address: "0xfF20817765cB7f73d4bde2e66e067E58D11095C2",
        decimals: 18
    },
    {
        symbol: "MATIC",
        address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        decimals: 18
    },
    {
        symbol: "ANKR",
        address: "0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4",
        decimals: 18
    },
    {
        symbol: "ROOK",
        address: "0xfA5047c9c78B8877af97BDcb85Db743fD7313d4a",
        decimals: 18
    },
    {
        symbol: "RAIL",
        address: "0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D",
        decimals: 18
    },
    {
        symbol: "AAVE",
        address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        decimals: 18
    },
    {
        symbol: "MPH",
        address: "0x8888801aF4d980682e47f1A9036e589479e835C5",
        decimals: 18
    },
    {
        symbol: "MKR",
        address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
        decimals: 18
    },
    {
        symbol: "DIP",
        address: "0xc719d010B63E5bbF2C0551872CD5316ED26AcD83",
        decimals: 18
    },
    {
        symbol: "MANA",
        address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
        decimals: 18
    },
    {
        symbol: "QNT",
        address: "0x4a220E6096B25EADb88358cb44068A3248254675",
        decimals: 18
    },
    {
        symbol: "NMR",
        address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
        decimals: 18
    },
    {
        symbol: "SNX",
        address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
        decimals: 18
    },
    {
        symbol: "LPL",
        address: "0x99295f1141d58A99e939F7bE6BBe734916a875B8",
        decimals: 18
    },
    {
        symbol: "PSP",
        address: "0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5",
        decimals: 18
    },
    {
        symbol: "LYRA",
        address: "0x01BA67AAC7f75f647D94220Cc98FB30FCc5105Bf",
        decimals: 18
    },
    {
        symbol: "GTC",
        address: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
        decimals: 18
    },
    {
        symbol: "1INCH",
        address: "0x111111111117dC0aa78b770fA6A738034120C302",
        decimals: 18
    },
    {
        symbol: "RLC",
        address: "0x607F4C5BB672230e8672085532f7e901544a7375",
        decimals: 9
    },
    {
        symbol: "TEMP",
        address: "0xA36FDBBAE3c9d55a1d67EE5821d53B50B63A1aB9",
        decimals: 18
    },
    {
        symbol: "REN",
        address: "0x408e41876cCCDC0F92210600ef50372656052a38",
        decimals: 18
    },
    {
        symbol: "COMP",
        address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        decimals: 18
    },
    {
        symbol: "SFI",
        address: "0xb753428af26E81097e7fD17f40c88aaA3E04902c",
        decimals: 18
    },
    {
        symbol: "UNI",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        decimals: 18
    },
    {
        symbol: "ZCN",
        address: "0xb9EF770B6A5e12E45983C5D80545258aA38F3B78",
        decimals: 10
    },
    {
        symbol: "GRT",
        address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
        decimals: 18
    },
    {
        symbol: "renBTC",
        address: "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
        decimals: 8
    },
    {
        symbol: "RARI",
        address: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
        decimals: 18
    },
    {
        symbol: "INST",
        address: "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb",
        decimals: 18
    },
    {
        symbol: "ARCONA",
        address: "0x0f71B8De197A1C84d31de0F1fA7926c365F052B3",
        decimals: 18
    },
    {
        symbol: "eRSDL",
        address: "0x5218E472cFCFE0b64A064F055B43b4cdC9EfD3A6",
        decimals: 18
    },
    {
        symbol: "PLR",
        address: "0xe3818504c1B32bF1557b16C238B2E01Fd3149C17",
        decimals: 18
    },
    {
        symbol: "LRC",
        address: "0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD",
        decimals: 18
    },
    {
        symbol: "KTN",
        address: "0x491E136FF7FF03E6aB097E54734697Bb5802FC1C",
        decimals: 18
    },
    {
        symbol: "DDX",
        address: "0x3A880652F47bFaa771908C07Dd8673A787dAEd3A",
        decimals: 18
    },
    {
        symbol: "MLN",
        address: "0xec67005c4E498Ec7f55E092bd1d35cbC47C91892",
        decimals: 18
    },
    {
        symbol: "IDLE",
        address: "0x875773784Af8135eA0ef43b5a374AaD105c5D39e",
        decimals: 18
    },
    {
        symbol: "SATA",
        address: "0x3ebb4A4e91Ad83BE51F8d596533818b246F4bEe1",
        decimals: 18
    },
    {
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6
    },
    {
        symbol: "OCEAN",
        address: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        decimals: 18
    },
    {
        symbol: "BMI",
        address: "0x725C263e32c72dDC3A19bEa12C5a0479a81eE688",
        decimals: 18
    },
    {
        symbol: "NDX",
        address: "0x86772b1409b61c639EaAc9Ba0AcfBb6E238e5F83",
        decimals: 18
    },
    {
        symbol: "FXS",
        address: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
        decimals: 18
    },
    {
        symbol: "SHIBGF",
        address: "0x505a84a03e382331A1Be487b632Cf357748b65d6",
        decimals: 18
    },
    {
        symbol: "DATA",
        address: "0x8f693ca8D21b157107184d29D398A8D082b38b76",
        decimals: 18
    },
    {
        symbol: "WXT",
        address: "0xa02120696c7B8fE16C09C749E4598819b2B0E915",
        decimals: 18
    },
    {
        symbol: "APW",
        address: "0x4104b135DBC9609Fc1A9490E61369036497660c8",
        decimals: 18
    },
    {
        symbol: "rETH",
        address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
        decimals: 18
    },
    // {
    //     symbol: "EWTB",
    //     address: "0x178c820f862B14f316509ec36b13123DA19A6054",
    //     decimals: 18
    // },
    {
        symbol: "RPL",
        address: "0xD33526068D116cE69F19A9ee46F0bd304F21A51f",
        decimals: 18
    },
    {
        symbol: "wstETH",
        address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
        decimals: 18
    },
    {
        symbol: "xSUSHI",
        address: "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272",
        decimals: 18
    },
    // {
    //     symbol: "DRC",
    //     address: "0xa150Db9b1Fa65b44799d4dD949D922c0a33Ee606",
    //     decimals: 0
    // },
    {
        symbol: "FARM",
        address: "0xa0246c9032bC3A600820415aE600c6388619A14D",
        decimals: 18
    },
    {
        symbol: "DYDX",
        address: "0x92D6C1e31e14520e676a687F0a93788B716BEff5",
        decimals: 18
    }
]

module.exports = {tokenAddresses};