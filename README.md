# ecosystem-contracts
## Development stacks
* `hardhat` for development ([https://hardhat.org/getting-started/](https://hardhat.org/getting-started/))
* `ethers` for connecting with the network ([https://docs.ethers.io/v5/](https://docs.ethers.io/v5/))
* `waffle` for testing ([https://ethereum-waffle.readthedocs.io/](https://ethereum-waffle.readthedocs.io/))

## Setup and run
Setting up by installing node modules:
```bash
npm install
```

### Run local ethereum node
Run command below to setup a local node of Ethereum network. More information [here](https://hardhat.org/hardhat-network/).
```bash
npx hardhat node
```

For BSC mainnet fork, run:
```bash
npx hardhat node --fork "https://bsc-dataseed.binance.org"
```
or adding forking config in `hardhat.config.js`

### Run test
To run all test, use below command:
```
npx hardhat test
```
or run a specific test file:
```
npx hardhat test path/to/test/file
```

### Compile
To run all test, use below command:
```
npx hardhat compile
```
Hardhat supports multiple compilers adhere to each contract requirements. Check it out at [https://hardhat.org/guides/compile-contracts.html](https://hardhat.org/guides/compile-contracts.html).

### Deploy
Create `.env` file as environment for deployment since we use `dotenv` library.
```
cp .env.sample .env
```

Deploy by running specific deployment script for a specific network:
```
npx hardhat run --network ropsten scripts/deploy.js
```

**NOTES**: When deploying contracts related to Moonshot-ERC20, you might want to visit line 749-756 of this contract to uncomment the appropriate contract address for router.

## Contracts
### Airdrop contract
This contract is used for airdropping to our holders.
- Contract completed.
- Test cases written and passed.

### Snapshot script
Change the `SNAPSHOT_BLOCK_NUM` environment variable in `.env` to update the snapshot time before running.
```bash
npx hardhat run scripts/snapshot.js
```
Output file will be stored into a json file in `db/snapshot.json`

### Airdrop script
Before running airdrop, run snapshot with given snapshot blockNumber. Then change `AIRDROP_AMOUNT` in the `.env` file to specify how much you want to airdrop.
```bash
npx hardhat run scripts/snapshot.js
```
