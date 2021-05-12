# ecosystem-contracts
## Development stacks
* `hardhat` for development ([https://hardhat.org/getting-started/](https://hardhat.org/getting-started/))
* `ethers` for connecting with the network ([https://docs.ethers.io/v5/](https://docs.ethers.io/v5/))
* `waffle` for testing ([https://ethereum-waffle.readthedocs.io/](https://ethereum-waffle.readthedocs.io/))

## Setup and run
Setting up by installing node modules:

```bash
npm install -g yarn
yarn install
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

**NOTES**:


### Compile
To compile, use below command:

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

### Verify
Verifying using hardhat is easy with [this guide](https://www.binance.org/en/blog/verify-with-hardhat/).
Add your BSCscan or Etherscan API key as environment variable `BLOCK_EXPLORER_API_KEY`. Then run below command
```
npx hardhat verify --network mainnet <CONTRACT_ADDRESS> "<CONSTRUCTOR_ARGUMENT_1>"
// Airdrop contract for example:
npx hardhat verify --network mainnet <AIRDROP_CONTRACT_ADDRESS> <MOONSHOT_CONTRACT_ADDRESS>
```
This also works on BSC testnet.

### Flatten
Sometimes we want to flatten the contract to manually verify on BSCscan easier. Run below command to flatten a contract:
```
npx hardhat flatten <PATH_TO_CONTRACT> > <PATH_TO_FLATTEN_CONTRACT>
```
This also works on BSC testnet.

## Contracts
### Airdrop contract
This contract is used for airdropping to our holders.
- Contract completed.
- Test cases written and passed.

Before running airdrop script, please check below steps:
- Download list of holders in csv format from BSCscan.
- Update the `OWNER_PRIVATE_KEY` in `.env` file to the deployer of Airdrop contract.
- Update the `MOONSHOT_HOLDERS_CSV_PATH` in `.env` file to the absolute path of your list of holders in csv.
- Update the `AIRDROP_AMOUNT` in `.env` file to a number between 0 and the Moonshot balance of your airdrop contract. The amount should be smaller than the balance for it to work without failure. The amount should not remove the last 9 decimals.
- Update the `AIRDROP_CONTRACT_ADDRESS` in `.env` file.
- Update the `AIRDROP_BATCH_LIMIT` to specify the chunks of airdrop you want to split
- Then run command:

```
npx hardhat run --network mainnet scripts/airdrop.js
```

### Snapshot script
Change the following environment variable in `.env` to update the snapshot variables before running.
- `SNAPSHOT_INIT_BLOCK_NUM` for initial block number you want to start snapshoting.
- `SNAPSHOT_BLOCK_NUM` is the block number you want to end snapshotting.
- `MOONSHOT_CONTRACT_ADDRESS` is the contract address of Moonshot on the current network you want to run snapshot against.

```bash
npx hardhat run scripts/snapshot.js

# For mainnet
npx hardhat run --network mainnet scripts/snapshot.js
```

Output file will be stored into a json file in `db/snapshot-<NETWORK_NAME>.json`

**NOTES**:
- Since BSC network might fluctuate and fails the request more than the default 5 times, increase the `MAX_RETRIES` to the number you think reasonable.
- The snapshot doesn't work correctly for reflection tokens due to incorrect Transfer event value.

