// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
//import "../node_modules/openzeppelin-contracts/contracts/access/roles/MinterRole.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./MigrationAgent.sol";
import "./Locked.sol";

/**
 * @title Token
 * @dev Burnable, Mintabble, Ownable, Pausable, with Locking ability per user.
 */
contract Token is
    Pausable,
    ERC20,
    Ownable,
    ERC20Burnable,
    Locked,
    AccessControl
{
    uint8 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 250000000 *
        (10**uint256(DECIMALS));
    uint256 public constant ONE_YEAR_SUPPLY = 12500000 *
        (10**uint256(DECIMALS));
    address public migrationAgent;
    uint256 public totalMigrated;
    address public mintAgent;

    uint16 constant ORIGIN_YEAR = 1970;
    uint256 constant YEAR_IN_SECONDS = 31557159; //average of seconds in 4 years including one leap year
    //giving approximate length of year without using precise calender

    mapping(uint256 => bool) public mintedYears;

    event Migrate(address indexed from, address indexed to, uint256 value);
    event MintAgentSet(address indexed mintAgent);
    event MigrationAgentSet(address indexed migrationAgent);

    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev prevent accidental sending of tokens to this token contract
    /// @param _self - address of this contract
    modifier notSelf(address _self) {
        require(
            _self != address(this),
            "You are trying to send tokens to token contract"
        );
        _;
    }

    /// @dev Constructor that gives msg.sender all of existing tokens and initiates token.
    constructor() public ERC20("Auditchain", "AUDT") {
        _mint(msg.sender, INITIAL_SUPPLY + ONE_YEAR_SUPPLY);
        mintedYears[returnYear()] = true;
        _setupRole(MINTER_ROLE, msg.sender);
    }

    /// @dev Function to determine year based on the current time
    /// There is no need to deal with leap years as only once per year mining can be run and
    /// one day is meaningless
    function returnYear() internal view returns (uint256) {
        uint256 year = ORIGIN_YEAR + (block.timestamp / YEAR_IN_SECONDS);
        return year;
    }

    /// @dev Function to mint tokens once per year
    /// @return A boolean that indicates if the operation was successful.
    function mint() public returns (bool) {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(mintAgent != address(0), "Mint agent address can't be 0");
        require(
            !mintedYears[returnYear()],
            "Tokens have been already minted for this year."
        );

        _mint(mintAgent, ONE_YEAR_SUPPLY);
        mintedYears[returnYear()] = true;

        return true;
    }

    /// @notice Set contract to which yearly tokens will be minted
    /// @param _mintAgent - address of the contract to set
    function setMintContract(address _mintAgent) external onlyOwner() {
        require(_mintAgent != address(0), "Mint agent address can't be 0");
        mintAgent = _mintAgent;
        emit MintAgentSet(_mintAgent);
    }

    /// @notice Migrate tokens to the new token contract.
    function migrate() external whenNotPaused() {
        uint256 value = balanceOf(msg.sender);
        require(migrationAgent != address(0), "Enter migration agent address");
        require(value > 0, "Amount of tokens is required");

        _addLock(msg.sender);
        burn(balanceOf(msg.sender));
        totalMigrated += value;
        MigrationAgent(migrationAgent).migrateFrom(msg.sender, value);
        _removeLock(msg.sender);
        emit Migrate(msg.sender, migrationAgent, value);
    }

    /// @notice Set address of migration target contract and enable migration process
    /// @param _agent The address of the MigrationAgent contract
    function setMigrationAgent(address _agent) external onlyOwner() {
        require(_agent != address(0), "Migration agent can't be 0");
        migrationAgent = _agent;
        emit MigrationAgentSet(_agent);
    }

    /// @notice Overwrite parent implementation to add locked verification and notSelf modifiers
    function transfer(address to, uint256 value)
        public
        override
        isNotLocked(msg.sender, to)
        notSelf(to)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    /// @notice Overwrite parent implementation to add locked verification and notSelf modifiers
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override isNotLocked(from, to) notSelf(to) returns (bool) {
        return super.transferFrom(from, to, value);
    }

    /// @notice Overwrite parent implementation to add locked verification and notSelf modifiers
    function approve(address spender, uint256 value)
        public
        override
        isNotLocked(msg.sender, spender)
        notSelf(spender)
        returns (bool)
    {
        return super.approve(spender, value);
    }

    /// @notice Overwrite parent implementation to add locked verification and notSelf modifiers
    function increaseAllowance(address spender, uint256 addedValue)
        public
        override
        isNotLocked(msg.sender, spender)
        notSelf(spender)
        returns (bool success)
    {
        return super.increaseAllowance(spender, addedValue);
    }

    /// @notice Overwrite parent implementation to add locked verification and notSelf modifiers
    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        override
        isNotLocked(msg.sender, spender)
        notSelf(spender)
        returns (bool success)
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function pause() public onlyOwner()   {

         super._pause();
    }

    function unpause() public onlyOwner()  {
        super._unpause();
    }
}
