const { ethers } = require("hardhat");
const fs = require("fs");
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
      balance: ethers.utils.parseEther(balance).div(1e9)
    });
  });

  return holders;
};

module.exports = {
  parseHolders,
}
