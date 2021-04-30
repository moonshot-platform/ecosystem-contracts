const { ethers, waffle } = require("hardhat");
const { deployContract } = waffle;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;
const { BigNumber } = ethers;
const fs = require("fs");
const {
  parseHolders,
  splitBatches,
  sendInBatches,
} = require("../../../scripts/lib/airdrop.js");

describe("airdrop lib", () => {
  describe("#parseHolders", () => {
    it("should parse data correctly", async () => {
      const input = `
"HolderAddress","Balance"
"address0","10e+14"
"address1","1.1e+14"
"address2","5e-09"
"address3","5.1e-09"
"address4","5.1e-05"
"address5","1234567890123"
"address6","12345678901234.5678"
`;
      const holders = await parseHolders(input);
      expect(holders[0].address.toString()).to.eq("address0");
      expect(holders[0].balance.toString()).to.eq("1000000000000000000000000");
      expect(holders[1].address.toString()).to.eq("address1");
      expect(holders[1].balance.toString()).to.eq("110000000000000000000000");
      expect(holders[2].address.toString()).to.eq("address2");
      expect(holders[2].balance.toString()).to.eq("5");
      expect(holders[3].address.toString()).to.eq("address3");
      expect(holders[3].balance.toString()).to.eq("5");
      expect(holders[4].address.toString()).to.eq("address4");
      expect(holders[4].balance.toString()).to.eq("51000");
      expect(holders[5].address.toString()).to.eq("address5");
      expect(holders[5].balance.toString()).to.eq("1234567890123000000000");
      // this one is weird because of floating point number
      expect(holders[6].address.toString()).to.eq("address6");
      expect(holders[6].balance.toString()).to.eq("12345678901234568359375");
    });
  });

  describe("#splitBatches", () => {
    it("should return empty when holders input is empty", () => {
      expect(splitBatches([], 100, 1e6)).to.eql([]);
    });

    context("when holders are not empty", () => {
      let holders;

      beforeEach(() => {
        holders = [
          {
            address: "address0",
            balance: BigNumber.from(50e9),
          },
          {
            address: "address1",
            balance: BigNumber.from(20e9),
          },
          {
            address: "address2",
            balance: BigNumber.from(15e9),
          },
          {
            address: "address3",
            balance: BigNumber.from(5e9),
          },
          {
            address: "address4",
            balance: BigNumber.from(4e9),
          },
          {
            address: "address5",
            balance: BigNumber.from(3e9),
          },
          {
            address: "address6",
            balance: BigNumber.from(2e9),
          },
          {
            address: "address7",
            balance: ethers.utils.parseEther("0.999999").div(1e9),
          },
          {
            address: "address8",
            balance: ethers.utils.parseEther("0.000001").div(1e9),
          },
        ];
      });

      it("should split holders and amount correctly", () => {
        const batchedHolders = splitBatches(holders, 3, 1e6);
        expect(Object.keys(batchedHolders).length).to.eq(3);
        expect(batchedHolders).to.eql([
          {
            holders: [
              {
                address: "address0",
                balance: BigNumber.from(50e9),
              },
              {
                address: "address1",
                balance: BigNumber.from(20e9),
              },
              {
                address: "address2",
                balance: BigNumber.from(15e9),
              },
            ],
            amount: 850_000,
          },
          {
            holders: [
              {
                address: "address3",
                balance: BigNumber.from(5e9),
              },
              {
                address: "address4",
                balance: BigNumber.from(4e9),
              },
              {
                address: "address5",
                balance: BigNumber.from(3e9),
              },
            ],
            amount: 120_000,
          },
          {
            holders: [
              {
                address: "address6",
                balance: BigNumber.from(2e9),
              },
              {
                address: "address7",
                balance: ethers.utils.parseEther("0.999999").div(1e9),
              },
              {
                address: "address8",
                balance: ethers.utils.parseEther("0.000001").div(1e9),
              },
            ],
            amount: 30_000,
          },
        ]);
      });

      it("should split holders and amount correctly", () => {
        const batchedHolders = splitBatches(holders, 5, 1e6);
        expect(Object.keys(batchedHolders).length).to.eq(2);
        expect(batchedHolders).to.eql([
          {
            holders: [
              {
                address: "address0",
                balance: BigNumber.from(50e9),
              },
              {
                address: "address1",
                balance: BigNumber.from(20e9),
              },
              {
                address: "address2",
                balance: BigNumber.from(15e9),
              },
              {
                address: "address3",
                balance: BigNumber.from(5e9),
              },
              {
                address: "address4",
                balance: BigNumber.from(4e9),
              },
            ],
            amount: 940_000,
          },
          {
            holders: [
              {
                address: "address5",
                balance: BigNumber.from(3e9),
              },
              {
                address: "address6",
                balance: BigNumber.from(2e9),
              },
              {
                address: "address7",
                balance: ethers.utils.parseEther("0.999999").div(1e9),
              },
              {
                address: "address8",
                balance: ethers.utils.parseEther("0.000001").div(1e9),
              },
            ],
            amount: 60_000,
          },
        ]);
      });
    });
  });

  describe("#sendInBatches", () => {
    let owner, alice, bob;
    let mockERC20, airdrop;

    beforeEach(async () => {
      [owner, alice, bob, carol, david] = await ethers.getSigners();
      const MockERC20 = JSON.parse(
        fs.readFileSync(
          "./artifacts/contracts/test/MockERC20.sol/MockERC20.json"
        )
      );
      mockERC20 = await deployContract(owner, MockERC20, []);
      const Airdrop = JSON.parse(
        fs.readFileSync("./artifacts/contracts/Airdrop.sol/Airdrop.json")
      );
      airdrop = await deployContract(owner, Airdrop, [mockERC20.address]);
    });

    it("should send airdrop in batches", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      const holders = [
        {
          address: alice.address,
          balance: BigNumber.from(100),
        },
        {
          address: bob.address,
          balance: BigNumber.from(400),
        },
      ];
      const failedBatches = await sendInBatches(airdrop, holders, 1, 1000);
      expect(failedBatches).to.be.empty;
    });

    it("should return failed batches of airdrop", async () => {
      const holders = [
        {
          address: alice.address,
          balance: BigNumber.from(100),
        },
        {
          address: bob.address,
          balance: BigNumber.from(400),
        },
      ];
      const failedBatches = await sendInBatches(airdrop, holders, 1, 0);
      expect(failedBatches.length).to.eq(2);
      expect(failedBatches).to.eql([
        {
          holders: [
            {
              address: alice.address,
              balance: BigNumber.from(100),
            },
          ],
          amount: 0,
        },
        {
          holders: [
            {
              address: bob.address,
              balance: BigNumber.from(400),
            },
          ],
          amount: 0,
        },
      ]);
    });
  });
});