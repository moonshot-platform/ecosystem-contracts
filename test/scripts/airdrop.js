const { expect } = require("chai");
const { parseHolders } = require("../../scripts/lib/airdrop.js");

describe("airdrop lib", () => {
  describe("#holdersParse", () => {
    it("should parse data correctly", async () => {
      const input = `
"HolderAddress","Balance"
"address1","10e+14"
"address2","1.1e+14"
"address3","5e-09"
"address4","5.1e-09"
"address5","5.1e-05"
"address6","1234567890123"
"address7","12345678901234.5678"
`;
      const holders = await parseHolders(input);
      expect(holders.address1.toString()).to.eq("1000000000000000000000000");
      expect(holders.address2.toString()).to.eq("110000000000000000000000");
      expect(holders.address3.toString()).to.eq("5");
      expect(holders.address4.toString()).to.eq("5");
      expect(holders.address5.toString()).to.eq("51000");
      expect(holders.address6.toString()).to.eq("1234567890123000000000");
      // this one is weird because of floating point number
      expect(holders.address7.toString()).to.eq("12345678901234568359375");
    });
  });
});
