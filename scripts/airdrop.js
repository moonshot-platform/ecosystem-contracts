require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const { airdrop } = require("./lib/airdrop.js");

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

  const holders = JSON.parse(
    fs.readFileSync(
      `./db/snapshot-${network.name}.json`,
      JSON.stringify(holders),
      "utf8",
      () => {}
    )
  );
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
