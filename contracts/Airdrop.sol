// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract Airdrop is Context, Ownable {
    using SafeMath for uint256;

    IERC20 public token;

    constructor(address _token) public {
        token = IERC20(_token);
    }

    function sendBatch(address[] calldata recipients, uint256[] calldata recipientsBalance, uint256 totalAmount) external onlyOwner {
        require(recipients.length == recipientsBalance.length, "Airdrop::sendBatch: unbalanced recipients data");
        require(totalAmount > 0, "Airdrop::sendBatch: totalAmount must be positive");
        require(totalAmount <= token.balanceOf(address(this)), "Airdrop::sendBatch: insufficient balance");
        uint256 totalShare = 0;
        for (uint256 i = 0; i < recipientsBalance.length; i++) {
            totalShare = totalShare.add(recipientsBalance[i]);
        }
        uint256 airdropAmount;

        for (uint256 i = 0; i < recipients.length; i++) {
            airdropAmount = totalAmount.mul(recipientsBalance[i]).div(totalShare);
            if (recipients[i] != address(this) && airdropAmount > 0) {
                token.transfer(recipients[i], airdropAmount);
            }
        }
    }
}
