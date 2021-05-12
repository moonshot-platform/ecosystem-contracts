const { ethers, waffle } = require("hardhat");
const { BigNumber } = ethers;
const { deployContract } = waffle;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;
const fs = require("fs");
const { sendInBatches } = require("../scripts/lib/airdrop");

describe("Airdrop", () => {
  let owner, alice, bob, carol, david;
  let mockERC20, airdrop;

  beforeEach(async () => {
    [owner, alice, bob, carol, david] = await ethers.getSigners();
    const MockERC20 = JSON.parse(
      fs.readFileSync("./artifacts/contracts/test/MockERC20.sol/MockERC20.json")
    );
    mockERC20 = await deployContract(owner, MockERC20, []);
    const Airdrop = JSON.parse(
      fs.readFileSync("./artifacts/contracts/Airdrop.sol/Airdrop.json")
    );
    airdrop = await deployContract(owner, Airdrop, [mockERC20.address]);
  });

  describe("status control", () => {
    it("should update status correctly", async () => {
      expect(await airdrop.started()).to.be.true;
      expect(airdrop.init()).to.be.revertedWith(
        "Airdrop::initAirdrop: must finish the airdrop first"
      );
      await airdrop.finish();
      expect(await airdrop.started()).to.be.false;
      expect(airdrop.finish()).to.be.revertedWith(
        "Airdrop::finishAirdrop: must init the airdrop first"
      );
      await airdrop.init();
      expect(await airdrop.currentAirdropId()).to.eq(1);
      expect(await airdrop.started()).to.be.true;
    });
  });

  describe("#setBatchLimit", () => {
    it("should correctly set batch limit", async () => {
      expect(await airdrop.batchLimit()).to.eq(100);
      await airdrop.setBatchLimit(1000);
      expect(await airdrop.batchLimit()).to.eq(1000);
    });
  });

  describe("#sendBatch", () => {
    let airdropId;

    beforeEach(async () => {
      await mockERC20.mint(alice.address, 50000);
      await mockERC20.mint(bob.address, 44000);
      await mockERC20.mint(carol.address, 5000);
      airdropId = await airdrop.currentAirdropId();
    });

    it("should correctly airdrop to accounts according to their proportion", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      await airdrop.sendBatch(
        [alice.address, bob.address, carol.address, airdrop.address],
        [50000, 44000, 5000, 1000],
        1000
      );
      expect(await mockERC20.balanceOf(alice.address)).to.eq(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.eq(44440);
      expect(await mockERC20.balanceOf(carol.address)).to.eq(5050);
      expect(await mockERC20.balanceOf(airdrop.address)).to.eq(10);
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, carol.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
    });

    it("should not resend airdrop to received accounts", async () => {
      await mockERC20.mint(airdrop.address, 2000);
      await airdrop.sendBatch(
        [alice.address, bob.address, airdrop.address],
        [50000, 49000, 1000],
        1000
      );
      expect(await mockERC20.balanceOf(alice.address)).to.eq(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.eq(44490);
      expect(await mockERC20.balanceOf(carol.address)).to.eq(5000);
      expect(await mockERC20.balanceOf(airdrop.address)).to.eq(1010);
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, carol.address)).to.eq(false);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
      await airdrop.sendBatch(
        [alice.address, bob.address, carol.address, airdrop.address],
        [50000, 44000, 5000, 1000],
        1000
      );
      expect(await mockERC20.balanceOf(alice.address)).to.eq(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.eq(44490);
      expect(await mockERC20.balanceOf(carol.address)).to.eq(5050);
      expect(await mockERC20.balanceOf(airdrop.address)).to.eq(960);
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, carol.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
    });

    it("should accept large enough input data", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      const wallets = new Array(100).fill(alice.address);
      const balances = new Array(100).fill(1000);
      expect(airdrop.sendBatch(wallets, balances, 1000)).to.not.be.rejected;
    });

    it("should fail when exceeding block gas limit", async () => {
      const batchLimit = 10000;
      await mockERC20.mint(airdrop.address, 1000);
      await airdrop.setBatchLimit(batchLimit);
      const wallets = new Array(batchLimit).fill(alice.address);
      const balances = new Array(batchLimit).fill(1000);
      expect(airdrop.sendBatch(wallets, balances, 1000)).to.be.rejectedWith(
        "Transaction ran out of gas"
      );
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.not.eq(true);
    });

    it("should revert on exception", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address],
          [50000, 44000, 5000],
          1000
        )
      ).to.be.revertedWith("Airdrop::sendBatch: unbalanced recipients data");
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address, carol.address],
          [50000, 44000, 5000],
          0
        )
      ).to.be.revertedWith("Airdrop::sendBatch: totalAmount must be positive");
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address, carol.address],
          [50000, 44000, 5000],
          1e10
        )
      ).to.be.revertedWith("Airdrop::sendBatch: insufficient balance");
    });

    it("should start new airdrop when finish then init", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      await airdrop.sendBatch(
        [alice.address, bob.address, airdrop.address],
        [50000, 49000, 1000],
        1000
      );
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
      expect(await mockERC20.balanceOf(alice.address)).to.eq(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.eq(44490);
      expect(await mockERC20.balanceOf(airdrop.address)).to.eq(10);
      await airdrop.finish();
      await airdrop.init();
      airdropId = await airdrop.currentAirdropId();
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(false);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(false);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
      await mockERC20.mint(airdrop.address, 1000);
      await airdrop.sendBatch(
        [alice.address, bob.address, airdrop.address],
        [50000, 49000, 1000],
        1000
      );
      expect(await mockERC20.balanceOf(alice.address)).to.be.above(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.be.above(44490);
      expect(await mockERC20.balanceOf(airdrop.address)).to.be.above(10);
      expect(await airdrop.receivedRecipient(airdropId, alice.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, bob.address)).to.eq(true);
      expect(await airdrop.receivedRecipient(airdropId, airdrop.address)).to.eq(false);
    });
  });
});
