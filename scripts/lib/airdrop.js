const { ethers } = require("hardhat");
const csvParse = require("csv-parse/lib/sync");
const { Promise } = require("bluebird");

const parseHolders = async (data) => {
  const holders = [];
  const balanceMin = 30e15;

  const rows = csvParse(data, {
    columns: true,
    skip_empty_lines: true,
  });

  if (!(rows[0].HolderAddress && rows[0].Balance)) {
    throw new Error("Invalid input data structure.");
  }

  rows.forEach((row) => {
    const balance = ethers.utils.parseEther(parseFloat(row.Balance).toFixed(9)).div(1e9);
    if (balance >= balanceMin) {
      holders.push({
        address: row.HolderAddress,
        balance: balance,
      });
    };
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
  const groups = splitBatches(holders, batch, totalAmount);
  let failedBatches = [];

  await Promise.mapSeries(groups, (group) => {
    const batchHolders = group.holders;
    return contract
      .sendBatch(
        batchHolders.map((holder) => {
          return holder.address;
        }),
        batchHolders.map((holder) => {
          return holder.balance;
        }),
        group.amount.toString()
      )
      .then((tx) => {
        console.log(
          `Finished airdrop to ${group.holders.length} holders at tx ${tx.hash}`
        );
      })
      .catch((err) => {
        console.log(`Failed to airdrop ${group.amount} to holders`);
        failedBatches.push(group);
      });
  });

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
