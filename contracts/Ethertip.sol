pragma solidity ^0.4.24;

contract Ethertip {

    event Withdrawn(string indexed owner, uint value);
    event Tipped(string indexed from, string indexed to, uint value);

    mapping (string=>uint) balances;
    uint value;
    address public validator;

    constructor (address _validator, uint _value) public {
        validator = _validator;
        value = _value;
    }

    modifier onlyValidator(){
        require(msg.sender==validator);
        _;
    }

    function tip(string _from, string _to) public onlyValidator {
        balances[_to]++;
        emit Tipped(_from, _to, value);
    }

    function getBalance(string _key) public view returns (uint) {
        return balances[_key];
    }

}
