// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "./StakingToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";


/**
 * @title Staking 
 * @dev To facilitate staking of AUDT tokens.
 * Participants can stake their AUDT tokens during the period specified in 
 * the constructor _stakingDateStart and _stakingDateEnd
 * Contract will issue one staking token for each AUDT Token staked
 * Contract will burn all redeemed staking tokens upon redemption
 * Staking is prohibited in all block heights following the block height 
 * of the initiation of the staking period
 * Contract will eliminate staking rewards for redemptions made during the staking period
 */
contract Staking is Ownable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;


    mapping(address => uint256) public deposits;        //track deposits per user
    mapping(address => uint256) public released;        //track redeemed deposits per user
    mapping(address => uint256) public cancelled;       //track cancelled deposits per user
    mapping(address => bool) public blacklistedAddress; //store addresses not eligible for staking

    uint256 public totalReleased;                       //track total number of redeemed deposits
    uint256 public totalCancelled;                      //track total number of cancelled deposits
    uint256 public stakedAmount;                        //total number of staked tokens    
    IERC20 private _auditToken;                         //AUDT token address 
    uint256 public stakingDateStart;                    //Staking date start
    uint256 public stakingDateEnd;                      //Staking date end
    uint256 public totalReward;                         //Total reward available
    StakingToken private _stakingToken;                 //staking token address



    
    ///@dev Emitted when when staking token is issued
    event Log_StakingTokensIssued(address indexed to, uint256 amount);

    ///@dev Emitted when when deposit is received
    event LogDepositReceived(address indexed from, uint amount);

    ///@dev Emitted when staking tokens are returned
    event Log_StakingTokenReturned(address indexed from, uint amount);

    ///@dev Emitted when reward has been delivered
    event LogRewardDelivered(address indexed from, uint256 amount);

    ///@dev Emitted when deposit is withdrawn before end of staking
    event LogDepositCancelled(address indexed from, uint256 amount);

    ///@dev Emitted when address is entered into blacklist
    event LogBlacklisted(address indexed to);

    /**
    * @dev ensures that funding period is still in effect
    */

    modifier fundingPeriod {

        _;
    }

    /**
     * @dev Sets the below variables 
     * @param _auditTokenAddress - address of the AUDT token
     * @param _stakingDateStart - date staking starts
     * @param _stakingDateEnd - date staking ends
     */
    constructor(IERC20 _auditTokenAddress, uint256 _stakingDateStart, uint256 _stakingDateEnd) public {

        _auditToken = _auditTokenAddress;
        stakingDateStart = _stakingDateStart;
        stakingDateEnd = _stakingDateEnd;

    }

     /**
     * @dev Function to store addresses exempt from staking
     * @param blacklisted - array of addresses to enter    
     */
    function blacklistAddresses(address[] memory blacklisted) public onlyOwner() {

        uint256 length = blacklisted.length;

        for (uint256 i = 0; i < length; i++) {
           blacklistedAddress[ blacklisted[i]] = true;
           LogBlacklisted(blacklisted[i]);
        }
        
    }

    /**
     * @dev Function to return earning ratio 
     * @return number representing earning ratio with precision of 18 decimal values       
     */
    function returnEarningRatio() public view returns (uint256) {

        return (totalReward.mul(1e18) / stakedAmount) ;
    }

    /**
     * @dev Function to send reward amount to the contract 
     * @param amount of AUDT tokens       
     */
    function fundStaking(uint256 amount) public onlyOwner(){

        _auditToken.safeTransferFrom(msg.sender, address(this), amount);
        totalReward += amount;
        emit LogDepositReceived(msg.sender, amount);
    }


    /**
     * @dev Function to set the staking token address 
     * @param _stakingTokenAddress address of staking token
     */
    function updateStakingTokenAddress(StakingToken _stakingTokenAddress) public onlyOwner() {

        require(address(_stakingTokenAddress) != address(0), "Staking Token address can't be 0");

        _stakingToken = _stakingTokenAddress;

    }
    /**
     * @dev Function to accept contribution to staking
     * @param amount number of AUDT tokens sent to contract for staking     
     */

    function stake(uint256 amount) fundingPeriod() public {

        require(amount >= 100e18, "Staking:stake - Minimum contribution amount is 100 AUDT tokens");
        require(stakingDateStart >= block.number, "Staking:stake - deposit period ended. ");
        require(blacklistedAddress[msg.sender] == false, "This address has been blacklisted");
        stakedAmount += amount;  // track tokens contributed so far
        _receiveDeposit(amount);
        _deliverStakingTokens( amount);
        emit Log_StakingTokensIssued(msg.sender, amount);
    }
    

    /**
     * @dev Function to receive and process deposits from stake() function
     * @param amount number of tokens deposited
     */
    function _receiveDeposit(uint amount) internal  {      

        _auditToken.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        emit LogDepositReceived(msg.sender, amount);
    }

   

     /**
     * @dev Function to deliver staking tokens upon receipt of deposit called from stake() function
     * @param amount number of tokens issued
     */
    function _deliverStakingTokens(uint256 amount) internal {
        _stakingToken.mint(msg.sender, amount);
    }
  
     /**
     * @dev Function to redeem contribution. Based on the staking period function may send rewards
     * if user redeems after staking ended. If staking is still in progress, user only receives amount contributed
     * @param amount number of tokens being redeemed
     */
    function redeem(uint256 amount) public {

        _burnStakedToken(amount);

        if (block.number > stakingDateEnd)
            _deliverRewards(amount);        
        else
            _returnDeposit(amount);
    }

     /**
     * @dev Function to burn staking tokens after redeeming 
     * @param amount number of tokens to burn
     */
    function _burnStakedToken(uint256 amount) internal {

        _stakingToken.burn(msg.sender, amount);
        Log_StakingTokenReturned(msg.sender, amount);
    }

     /**
     * @dev Function to deliver rewards called from redeem() function
     * @param amount number of tokens to deliver (token originally deposited + staking rewards)
     */
    function _deliverRewards(uint256 amount) internal {

        uint256 reward;
        uint256 totalRedeemed;
        reward = (amount * returnEarningRatio()).div(1e18);
        totalRedeemed = reward.add(amount);
        released[msg.sender] = released[msg.sender].add(totalRedeemed);
        totalReleased += totalRedeemed;
        _auditToken.transfer(msg.sender, totalRedeemed);
        LogRewardDelivered(msg.sender, totalRedeemed);
    }

     /**
     * @dev Function to return deposit in case user requests before of the staking period. 
     * @param amount number of tokens to return 
     */
    function _returnDeposit(uint256 amount) internal {

        cancelled[msg.sender] = released[msg.sender].add(amount);
        stakedAmount = stakedAmount.sub(amount);
        totalCancelled += amount;
        _auditToken.transfer(msg.sender, amount);
        LogDepositCancelled(msg.sender, amount);
    }
}