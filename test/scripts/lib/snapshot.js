const { ethers, waffle } = require("hardhat");
const { deployContract } = waffle;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;
const fs = require("fs");
const { snapshot } = require("../../../scripts/lib/snapshot.js");

describe("snapshot lib", () => {
  describe("#snapshot", () => {
    let owner, alice, bob, carol, david, elon, fomo;
    let aliceBalance, bobBalance, carolBalance, davidBalance, elonBalance;
    let mockERC20;

    beforeEach(async () => {
      [owner, alice, bob, carol, david, elon, fomo] = await ethers.getSigners();
      const MockERC20 = JSON.parse(
        fs.readFileSync(
          "./artifacts/contracts/test/MockERC20.sol/MockERC20.json"
        )
      );
      mockERC20 = await deployContract(owner, MockERC20, []);
      const mockERC20AsAlice = mockERC20.connect(alice)
      const mockERC20AsBob = mockERC20.connect(bob)
      const mockERC20AsCarol = mockERC20.connect(carol)

      await mockERC20.mint(owner.address, 100e6);

      await mockERC20.transfer(alice.address, 60e6);
      await mockERC20.transfer(bob.address, 30e6);
      await mockERC20.transfer(carol.address, 10e6);

      await mockERC20AsAlice.transfer(bob.address, 10e6);
      await mockERC20AsAlice.transfer(david.address, 10e6);
      await mockERC20AsBob.transfer(carol.address, 15e6);
      await mockERC20AsCarol.transfer(elon.address, 5e6);
    });

    it("should correctly fetch the correct holders list", async () => {
      const holders = await snapshot(
        mockERC20.deployTransaction.blockNumber,
        (await ethers.provider.getBlock()).number,
        mockERC20,
        {
          limitBlockRange: 1,
          maxRetries: 5,
        }
      );
      expect(holders[owner.address]).to.eq('0');
      expect(holders[alice.address]).to.eq(40e6.toString());
      expect(holders[bob.address]).to.eq(25e6.toString());
      expect(holders[carol.address]).to.eq(20e6.toString());
      expect(holders[david.address]).to.eq(10e6.toString());
      expect(holders[elon.address]).to.eq(5e6.toString());
      expect(holders[fomo.address]).to.be.undefined;
    });
  });
});
