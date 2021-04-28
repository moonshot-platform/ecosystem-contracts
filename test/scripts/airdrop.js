const { expect } = require("chai");
const { parseHolders } = require("../../scripts/lib/airdrop.js");

describe("airdrop lib", () => {
  describe("#holdersParse", () => {
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
});
