const { ethers } = require("hardhat");
const csvParse = require("csv-parse/lib/sync");

const parseHolders = async (data) => {
  const holders = [];

  const rows = csvParse(data, {
    columns: true,
    skip_empty_lines: true,
  });

  if (!(rows[0].HolderAddress && rows[0].Balance)) {
    throw new Error("Invalid input data structure.");
  }

  rows.forEach((row) => {
    const balance = parseFloat(row.Balance).toFixed(9);
    holders.push({
      address: row.HolderAddress,
      balance: ethers.utils.parseEther(balance).div(1e9),
    });
  });

  return holders;
};

const splitBatches = (holders, batch, totalAmount) => {
  const batchHoldersWithAmount = [];
  let i, j;
  const totalBalance = holders.reduce(reducer, 0);
  if (totalBalance == NaN) {
    throw new Error("totalBalance must be a number");
  }

  for (i = 0; i < holders.length; i += batch) {
    const batchHolders = holders.slice(i, i + batch);
    const batchAmount =
      (batchHolders.reduce(reducer, 0) * totalAmount) / totalBalance;
    batchHoldersWithAmount.push({
      holders: batchHolders,
      amount: batchAmount,
    });
  }
  return batchHoldersWithAmount;
};

const sendInBatches = async (contract, holders, batch, totalAmount) => {
  const batchHoldersWithAmountGroups = splitBatches(holders, batch, totalAmount); 

  const failedBatchesPromises = batchHoldersWithAmountGroups.map(async (batchHoldersWithAmountGroup) => {
    const batchHolders = batchHoldersWithAmountGroup.holders;
    let transaction

    try {
      transaction = await contract.sendBatch(
        holders.map((holder) => {
          return holder.address;
        }),
        holders.map((holder) => {
          return holder.balance;
        }),
        batchHoldersWithAmountGroup.amount,
      );
      console.log(
        `Finished airdrop to ${batchHolders.length} holders at tx ${transaction.hash}`
      );
    } catch(e) {
      console.log(`Failed to airdrop with errors: ${e}`);
      return batchHoldersWithAmountGroup;
    }
  });
  const failedBatches = (await Promise.all(failedBatchesPromises)).filter((item) => { return item != undefined });
  return failedBatches;
};

const reducer = (sum, holder) => {
  return holder.balance.add(sum);
};

module.exports = {
  parseHolders,
  splitBatches,
  sendInBatches,
};
