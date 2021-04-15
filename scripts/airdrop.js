require("dotenv").config();
const { ethers } = require("hardhat");
const { BigNumber } = ethers;
const fs = require("fs");

// This command requires running snapshot first
// CMD: npx hardhat run --network mainnet scripts/airdrop.js
const airdrop = async (amount, contractAddress) => {
  const provider = new ethers.providers.JsonRpcProvider(network.config.url);
  const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY);
  const abi = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Airdrop.sol/Airdrop.json")
  ).abi;
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const holders = JSON.parse(
    fs.readFileSync(
      "./db/snapshot.json",
      JSON.stringify(holders),
      "utf8",
      () => {}
    )
  );
  console.log(`Starting airdrop ${amount} to ${holders.length} holders`);
  contract.sendBatch(Object.keys(holders), Object.values(holders), amount);
  console.log("Finished!");
};

airdrop(process.env.AIRDROP_AMOUNT, process.env.AIRDROP_CONTRACT_ADDRESS)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });