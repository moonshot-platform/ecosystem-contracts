require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const { snapshot } = require("./lib/snapshot.js");

// CMD: npx hardhat run --network mainnet scripts/snapshot.js
const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(network.config.url);
  const abi = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Moonshot.sol/Moonshot.json")
  ).abi;
  let contractAddress = process.env.MOONSHOT_CONTRACT_ADDRESS;
  let initBlockNum = process.env.SNAPSHOT_INIT_BLOCK_NUM;
  if (network.name == "mainnet") {
    contractAddress = "0xd27d3f7f329d93d897612e413f207a4dbe8bf799";
    initBlockNum = 5999388;
    // Deployment block: https://bscscan.com/tx/0xfbaf0d30957115c982abee3f28a649f1e901c2bc7129b2ba9300cedef7a17eec
  }
  const tokenContract = new ethers.Contract(contractAddress, abi, provider);
  const LIMIT_BLOCK_RANGE = 5000;
  const MAX_RETRIES = 5;

  const holders = await snapshot(
    initBlockNum,
    process.env.SNAPSHOT_BLOCK_NUM,
    tokenContract,
    {
      limitBlockRange: LIMIT_BLOCK_RANGE,
      maxRetries: MAX_RETRIES,
    }
  );

  const dbDir = "./db";
  const fileName = `${dbDir}/snapshot-${network.name}.json`;
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  console.log("Writing holders data to file", fileName);
  fs.writeFileSync(fileName, JSON.stringify(holders), "utf8", () => {});
  console.log("Finished!");
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
