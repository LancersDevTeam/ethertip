pragma solidity ^0.4.24;

import "./ClaimHolder.sol";

contract UserRegistry {

    event NewUser(address _address, address _identity);
    mapping(address => address) public users;

    function registerUser()
        public
    {
        users[tx.origin] = msg.sender;
        emit NewUser(tx.origin, msg.sender);
    }

    /// @dev clearUser(): Remove user from the registry
    function clearUser()
        public
    {
        users[msg.sender] = 0;
    }

}
