// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Airdrop is Context, Ownable {
    using SafeMath for uint256;

    IERC20 public token;
    uint256 public batchLimit;
    address[] private _received;
    mapping (uint256 => mapping (address => bool)) public receivedRecipient;
    uint256 public currentAirdropId;
    bool public started;

    constructor(address _token) public {
        token = IERC20(_token);
        batchLimit = 100;
        currentAirdropId = 0;
        started = true;
    }

    function init() public onlyOwner {
        require(started == false, "Airdrop::initAirdrop: must finish the airdrop first");
        currentAirdropId = currentAirdropId.add(1);
        started = true;
    }

    function finish() public onlyOwner {
        require(started == true, "Airdrop::finishAirdrop: must init the airdrop first");
        started = false;
    }

    function sendBatch(address[] calldata recipients, uint256[] calldata recipientsBalance, uint256 totalAmount) external onlyOwner {
        require(started == true, "Airdrop::initAirdrop: must start the airdrop first");
        require(recipients.length == recipientsBalance.length, "Airdrop::sendBatch: unbalanced recipients data");
        require(recipients.length <= batchLimit, "Airdrop::sendBatch: exceeds batch limit");
        require(totalAmount > 0, "Airdrop::sendBatch: totalAmount must be positive");
        require(totalAmount <= token.balanceOf(address(this)), "Airdrop::sendBatch: insufficient balance");

        uint256 totalShare = 0;
        for (uint256 i = 0; i < recipientsBalance.length; i++) {
            totalShare = totalShare.add(recipientsBalance[i]);
        }
        uint256 airdropAmount;

        for (uint256 i = 0; i < recipients.length; i++) {
            airdropAmount = totalAmount.mul(recipientsBalance[i]).div(totalShare);
            if (receivedRecipient[currentAirdropId][recipients[i]] != true && recipients[i] != address(this) && airdropAmount > 0) {
                token.transfer(recipients[i], airdropAmount);
                receivedRecipient[currentAirdropId][recipients[i]] = true;
                _received.push(recipients[i]);
            }
        }
    }

    function setBatchLimit(uint256 _batchLimit) external onlyOwner {
        batchLimit = _batchLimit;
    }
}
