const { ethers, waffle } = require("hardhat");
const { deployContract } = waffle;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;
const fs = require("fs");

describe("Airdrop", () => {
  let owner, alice, bob, carol, david, airdrop;
  let mockERC20;

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
    await mockERC20.mint(alice.address, 50000);
    await mockERC20.mint(bob.address, 45000);
    await mockERC20.mint(carol.address, 5000);
  });

  describe("#sendBatch", () => {
    it("should correctly airdrop to accounts according to their proportion", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      await airdrop.sendBatch(
        [alice.address, bob.address, carol.address],
        [50000, 45000, 5000],
        1000
      );
      console.log(alice.address);
      expect(await mockERC20.balanceOf(alice.address)).to.eq(50500);
      expect(await mockERC20.balanceOf(bob.address)).to.eq(45450);
      expect(await mockERC20.balanceOf(carol.address)).to.eq(5050);
    });

    it("should revert on exception", async () => {
      await mockERC20.mint(airdrop.address, 1000);
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address],
          [50000, 45000, 5000],
          1000
        )
      ).to.be.revertedWith("Airdrop::sendBatch: unbalanced recipients data");
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address, carol.address],
          [50000, 45000, 5000],
          0
        )
      ).to.be.revertedWith("Airdrop::sendBatch: totalAmount must be positive");
      expect(
        airdrop.sendBatch(
          [alice.address, bob.address, carol.address],
          [50000, 45000, 5000],
          1e10
        )
      ).to.be.revertedWith("Airdrop::sendBatch: insufficient balance");
    });
  });
});
