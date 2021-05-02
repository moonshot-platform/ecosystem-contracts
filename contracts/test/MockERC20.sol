pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20("Mock Token", "MTK") {
    uint256 private cap = 100e18;

    function mint(address receiver, uint256 amount) public {
        _mint(receiver, amount);
    }
}
