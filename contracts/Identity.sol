pragma solidity ^0.4.22;

import "./ClaimHolder.sol";
import "./UserRegistry.sol";

contract Identity is ClaimHolder {

    function Identity(
        address _registry
    )
        public
    {
        UserRegistry(_registry).registerUser();
    }

}
