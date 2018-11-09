pragma solidity ^0.4.24;

import "./UserRegistry.sol";
import "./ClaimVerifier.sol";
import "./ClaimHolder.sol";

contract EthertipIdentityGateway {

    event Withdraw(address indexed owner, uint value);
    event Deposit(address indexed from, uint value);

    mapping(string=>uint) internal used;

    address public validator;
    UserRegistry userRegistory;
    ClaimVerifier claimVerifier;

    uint public tipToEther = 0.0001 ether;

    constructor (address _validator, address _userRegistory, address _claimVerifier) public {
        validator = _validator;
        userRegistory = UserRegistry(_userRegistory);
        claimVerifier = ClaimVerifier(_claimVerifier);
    }

    function () public payable {
        emit Deposit(msg.sender, msg.value);
    }

    function getUsed(string _id) public returns (uint) {
        return used[_id];
    }

    function check() public view returns (bool){
        ClaimHolder _identity = ClaimHolder(userRegistory.users(msg.sender));
        return claimVerifier.checkClaim(_identity, 0);
    }

    function withdraw(string _id, uint _value, bytes _sig) public {
        bytes32 dataHash = keccak256(validator, _id, _value);
        bytes32 prefixedHash = keccak256("\x19Ethereum Signed Message:\n32", dataHash);
        address recovered = getRecoveredAddress(_sig, prefixedHash);
        require(validator == recovered);
        require(used[_id] < _value);

        ClaimHolder _identity = ClaimHolder(userRegistory.users(msg.sender));
        require(claimVerifier.checkClaim(_identity, 0));

        uint _transfer = (_value - used[_id]) * tipToEther;

        used[_id] = _value;
        msg.sender.transfer(_transfer);
        emit Withdraw(msg.sender, _transfer);
    }

    function getRecoveredAddress(bytes sig, bytes32 dataHash)
        internal
        pure
        returns (address addr)
    {
        bytes32 ra;
        bytes32 sa;
        uint8 va;

        // Check the signature length
        if (sig.length != 65) {
          return (0);
        }

        // Divide the signature in r, s and v variables
        assembly {
          ra := mload(add(sig, 32))
          sa := mload(add(sig, 64))
          va := byte(0, mload(add(sig, 96)))
        }

        if (va < 27) {
          va += 27;
        }

        address recoveredAddress = ecrecover(dataHash, va, ra, sa);
        return (recoveredAddress);
    }

}
