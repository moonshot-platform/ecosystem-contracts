require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const { airdrop } = require("./lib/airdrop.js");
const csvParse = require("csv-parse/lib/sync");

// This command requires running snapshot first
// CMD: npx hardhat run --network mainnet scripts/airdrop.js
const main = async () => {
  const amount = process.env.AIRDROP_AMOUNT;
  const provider = new ethers.providers.JsonRpcProvider(network.config.url);
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY).connect(
    provider
  );
  const abi = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Airdrop.sol/Airdrop.json")
  ).abi;
  const contract = new ethers.Contract(
    process.env.AIRDROP_CONTRACT_ADDRESS,
    abi,
    provider
  ).connect(signer);
  const holders = {};

  const csvFile = fs.readFileSync(process.env.MOONSHOT_HOLDERS_CSV_PATH);
  const rows = csvParse(csvFile.toString(), {
    columns: true,
    skip_empty_lines: true,
  });
  rows.forEach((row) => {
    const balance = parseFloat(row.Balance).toFixed(9)
    holders[row.HolderAddress] = ethers.utils.parseEther(balance).div(1e9);
  });

  console.log(
    `Starting airdrop ${amount} to ${holders.length} holders on ${network.name}`
  );
  await contract.sendBatch(
    Object.keys(holders),
    Object.values(holders),
    amount
  );
  console.log(`Finished!`);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
