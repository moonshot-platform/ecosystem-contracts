require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY;
// Etherscan or BSCscan API key
const BLOCK_EXPLORER_API_KEY = process.env.BLOCK_EXPLORER_API_KEY || "";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://bsc-dataseed.binance.org",
      // },
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [OWNER_PRIVATE_KEY],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [ROPSTEN_PRIVATE_KEY],
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: [OWNER_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: BLOCK_EXPLORER_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: 'BNB',
    gasPrice: 21,
    enabled: true,
  }
};
