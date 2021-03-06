const { ethers } = require("hardhat");
const { BigNumber } = ethers;

const snapshot = async (initBlockNum, blockNum, tokenContract, opts = {}) => {
  const limitBlockRange = BigNumber.from(opts.limitBlockRange || 5000).toNumber();
  const maxRetries = BigNumber.from(opts.maxRetries || 5).toNumber();
  const tokenContractAddress = tokenContract.address.toLowerCase();
  const snapshotBlockNum = BigNumber.from(blockNum).toNumber();
  const holders = {};
  let transferEvents;

  const firstEvent = (
    await tokenContract.queryFilter(
      "Transfer",
      initBlockNum,
      initBlockNum + limitBlockRange
    )
  )[0];
  holders[firstEvent.args.from] = BigNumber.from(firstEvent.args.value);

  while (initBlockNum <= snapshotBlockNum) {
    let endBlockNum = initBlockNum + limitBlockRange;
    if (initBlockNum + limitBlockRange >= snapshotBlockNum) {
      endBlockNum = snapshotBlockNum;
    }
    console.log(`Querying for block ${initBlockNum} to ${endBlockNum}`);
    transferEvents = await retry(
      tokenContract,
      ["Transfer", initBlockNum, endBlockNum],
      maxRetries
    );
    console.log("Number of events", transferEvents.length);
    transferEvents.forEach((event) => {
      const amount = BigNumber.from(event.args.value);

      if (event.args.from.toLowerCase() != tokenContractAddress) {
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

      if (event.args.to.toLowerCase() != tokenContractAddress) {
        if (holders[event.args.to] == undefined) {
          holders[event.args.to] = amount.toString();
        } else {
          holders[event.args.to] = BigNumber.from(holders[event.args.to])
            .add(amount)
            .toString();
        }
      }
    });
    initBlockNum = initBlockNum + limitBlockRange + 1;
  }

  return holders;
};

const retry = async (contract, args, n) => {
  for (let i = 0; i < n; i++) {
    try {
      return await contract.queryFilter(...args);
    } catch {
      await delay(1000);
    }
  }

  throw new Error(`Failed retrying ${n} times`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  snapshot,
};
