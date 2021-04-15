require("dotenv").config();
const { ethers } = require("hardhat");
const { BigNumber } = ethers;
const fs = require("fs");

// CMD: npx hardhat run scripts/snapshot.js
const snapshot = async (blockNum) => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org"
  );
  const contractAddress = "0xd27d3f7f329d93d897612e413f207a4dbe8bf799";
  const abi = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Moonshot.sol/Moonshot.json")
  ).abi;
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const LIMIT_BLOCK_RANGE = 5000;
  const holders = {};
  let transferEvents;

  let initBlockNum = 5999388;
  // Deployment block: https://bscscan.com/tx/0xfbaf0d30957115c982abee3f28a649f1e901c2bc7129b2ba9300cedef7a17eec

  const firstEvent = (
    await contract.queryFilter("Transfer", initBlockNum, initBlockNum + 100)
  )[0];
  holders[firstEvent.args.from] = BigNumber.from(firstEvent.args.value);

  while (initBlockNum < blockNum) {
    let endBlockNum = initBlockNum + LIMIT_BLOCK_RANGE;
    if (initBlockNum + LIMIT_BLOCK_RANGE >= blockNum) {
      endBlockNum = blockNum;
    }
    console.log("Querying for block %s to %s", initBlockNum, endBlockNum);
    transferEvents = await retry(
      contract,
      ["Transfer", initBlockNum, endBlockNum],
      5
    );
    console.log("Number of events", transferEvents.length);
    transferEvents.forEach((event) => {
      const amount = BigNumber.from(event.args.value);

      if (event.args.from.toLowerCase() != contractAddress.toLowerCase()) {
        if (holders[event.args.from] != undefined) {
          holders[event.args.from] = BigNumber.from(holders[event.args.from])
            .sub(amount)
            .toString();
        } else {
          console.log("Failed at:", event);
          console.log(holders);
          throw `Invalid holder address`;
        }
      }
      if (event.args.to.toLowerCase() != contractAddress.toLowerCase()) {
        if (holders[event.args.to] == undefined) {
          holders[event.args.to] = amount.toString();
        } else {
          holders[event.args.to] = BigNumber.from(holders[event.args.to])
            .add(amount)
            .toString();
        }
      }
    });
    initBlockNum = initBlockNum + LIMIT_BLOCK_RANGE + 1;
  }

  console.log(holders);

  const dbDir = "./db";
  const fileName = `${dbDir}/snapshot.json`;
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  console.log("Writing holders data to file", fileName);
  fs.writeFileSync(fileName, JSON.stringify(holders), "utf8", () => {});
};

const retry = async (contract, args, n) => {
  for (let i = 0; i < n; i++) {
    try {
      return await contract.queryFilter(...args);
    } catch {}
  }

  throw new Error(`Failed retrying ${n} times`);
};

snapshot(process.env.SNAPSHOT_BLOCK_NUM)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
