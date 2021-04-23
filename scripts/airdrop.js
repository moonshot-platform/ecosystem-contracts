require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const { parseHolders } = require("./lib/airdrop.js");
const csvParse = require("csv-parse/lib/sync");

// This command requires running snapshot first
// CMD: npx hardhat run --network mainnet scripts/airdrop.js
const main = async () => {
  const AIRDROP_AMOUNT = process.env.AIRDROP_AMOUNT || 0;
  if (AIRDROP_AMOUNT <= 0)
    throw new Error("Airdrop amount must be greater than 0");
  const AIRDROP_CONTRACT_ADDRESS = process.env.AIRDROP_CONTRACT_ADDRESS || "";
  const MOONSHOT_HOLDERS_CSV_PATH = process.env.MOONSHOT_HOLDERS_CSV_PATH || "";
  const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || "";

  const provider = new ethers.providers.JsonRpcProvider(network.config.url);
  const signer = new ethers.Wallet(OWNER_PRIVATE_KEY).connect(provider);
  const abi = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Airdrop.sol/Airdrop.json")
  ).abi;
  const contract = new ethers.Contract(
    AIRDROP_CONTRACT_ADDRESS,
    abi,
    provider
  ).connect(signer);
  const csvFile = fs.readFileSync(MOONSHOT_HOLDERS_CSV_PATH);
  const holders = await parseHolders(csvFile.toString());

  console.log(
    `Starting airdrop ${AIRDROP_AMOUNT} Moonshot to ${
      Object.keys(holders).length
    } holders on ${network.name}`
  );
  const transaction = await contract.sendBatch(
    Object.keys(holders),
    Object.values(holders),
    AIRDROP_AMOUNT
  );
  console.log(`Airdrop finished!`);
  console.log("Transaction hash:", transaction.hash);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
