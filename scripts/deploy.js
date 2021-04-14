const { ethers } = require("hardhat");
const fs = require("hardhat");

const main = async () => {
  console.log("Deploying contracts to", network.name);
  let moonshotContract;

  if (network.name == "mainnet") {
    // fetch deployed Moonshot contract
    const moonshotContractAddress =
      "0xd27d3f7f329d93d897612e413f207a4dbe8bf799";
    const moonshotBytecode = fs.readFileSync(
      "./artifacts/contracts/Moonshot.sol/Moonshot.json"
    );
    const moonshotABI = JSON.parse(moonshotBytecode.toString()).abi;
    const provider = ethers.getDefaultProvider();
    moonshotContract = new ethers.Contract(
      moonshotContractAddress,
      moonshotABI,
      provider
    );
  } else {
    // deploy Moonshot contract
    const moonshotFactory = await ethers.getContractFactory("Moonshot");
    moonshotContract = await moonshotFactory.deploy();
    console.log("Moonshot deployed at:", moonshotContract.address);

    await moonshotContract.deployed();
  }

  // deploy Airdrop contract
  const airdropFactory = await ethers.getContractFactory("Airdrop");
  let airdropContract = await airdropFactory.deploy(moonshotContract.address);

  console.log("Moonshot Airdrop deployed at:", airdropContract.address);
  await airdropContract.deployed();
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
