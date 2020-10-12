pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "../InitializableV2.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";


/** Upgradeable ERC20 token that is Detailed, Mintable, Pausable, Burnable. */
contract AudiusTokenGSN is InitializableV2,
    ERC20,
    ERC20Detailed,
    ERC20Mintable,
    ERC20Pausable,
    ERC20Burnable,
    GSNRecipient
{
    string constant NAME = "Audius";

    string constant SYMBOL = "AUDIO";

    // Defines number of Wei in 1 token
    // 18 decimals is standard - imitates relationship between Ether and Wei
    uint8 constant DECIMALS = 18;

    // 10^27 = 1 billion (10^9) tokens, 18 decimal places
    // 1 TAUD = 1 * 10^18 wei
    uint256 constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);

    function initialize(address _owner, address governance) public initializer {
        // ERC20 has no initialize function

        // ERC20Detailed provides setters/getters for name, symbol, decimals properties
        ERC20Detailed.initialize(NAME, SYMBOL, DECIMALS);

        // ERC20Burnable has no initialize function. Makes token burnable

        // Initialize call makes token pausable & gives pauserRole to governance
        ERC20Pausable.initialize(governance);

        // Initialize call makes token mintable & gives minterRole to msg.sender
        ERC20Mintable.initialize(msg.sender);

        // Mints initial token supply & transfers to _owner account
        _mint(_owner, INITIAL_SUPPLY);

        // Transfers minterRole to governance
        addMinter(governance);
        renounceMinter();

        InitializableV2.initialize();
    }

    function acceptRelayedCall(
      address relay,
      address from,
      bytes calldata encodedFunction,
      uint256 transactionFee,
      uint256 gasPrice,
      uint256 gasLimit,
      uint256 nonce,
      bytes calldata approvalData,
      uint256 maxPossibleCharge
    ) external view returns (uint256, bytes memory) {
        return _approveRelayedCall();
    }

    // We won't do any pre or post processing, so leave _preRelayedCall and _postRelayedCall empty
    function _preRelayedCall(bytes memory context) internal returns (bytes32) {
    }

    function _postRelayedCall(bytes memory context, bool, uint256 actualCharge, bytes32) internal {
    }

}
