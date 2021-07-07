const cnf = require('../config/capsule1.json');

const Token = artifacts.require('./AuditToken.sol');
const Staking = artifacts.require('./Staking.sol');
const StakingToken = artifacts.require('./StakingToken.sol');

var BigNumber = require('big-number');



module.exports = async function (deployer, network, accounts) { // eslint-disable-line

    const owner = accounts[0];

    let blockNumber = await web3.eth.getBlockNumber();

    console.log("Network:" + network)
    console.log("block num:" + blockNumber);

    // deploy the token with params from /config/contract.json file

    const { STAKING_START_TIME, STAKING_END_TIME, TOTAL_REWARD, STAKING_TOKEN_SYMBOL, STAKING_TOKEN_NAME, GOVERNANCE_TOKEN_REWARD_RATIO } = cnf;
    let governanceTokenRewardRatio = new BigNumber(GOVERNANCE_TOKEN_REWARD_RATIO);
    let totalReward = new BigNumber(TOTAL_REWARD);

   
    console.log("total reward:" + totalReward);

    await deployer.deploy(Token, owner);
    let token = await Token.deployed();

    await deployer.deploy(Staking, token.address, blockNumber + 40, blockNumber + 60, totalReward);
    let staking = await Staking.deployed();

    await deployer.deploy(StakingToken, staking.address, STAKING_TOKEN_SYMBOL, STAKING_TOKEN_NAME);
    let stakingToken = await StakingToken.deployed();

    await staking.updateStakingTokenAddress(stakingToken.address);


    let MINTER_ROLE = web3.utils.keccak256("MINTER_ROLE");


    await token.grantRole(MINTER_ROLE, staking.address, { from: owner });


    // deployer.deploy(Token).then(() => {
    //     return Token.deployed().then((tokenInstance) => {
    //         console.log('[ Token.address ]: ' + tokenInstance.address);
    //         deployer.deploy(GovernanceToken).then(() => {
    //             return GovernanceToken.deployed().then((governanceTokenInstance) => {
    //                 console.log('[ Governance Token.address ]: ' + governanceTokenInstance.address);
    //                 // return deployer.deploy(Staking, tokenInstance.address, governanceTokenInstance.address, STAKING_START_TIME, STAKING_END_TIME, totalReward, governanceTokenRewardRatio).then(() => {

    //                 return deployer.deploy(Staking, tokenInstance.address, governanceTokenInstance.address, blockNumber + 40, blockNumber + 60, totalReward, governanceTokenRewardRatio).then(() => {

    //                     return Staking.deployed().then((stakingInstance) => {
    //                         console.log('[ StakingInstance.address ]: ' + stakingInstance.address);
    //                         return deployer.deploy(StakingToken, stakingInstance.address, STAKING_TOKEN_SYMBOL, STAKING_TOKEN_NAME).then(() => {

    //                             return StakingToken.deployed().then((stakingTokenInstance) => {
    //                                 console.log('[ StakingTokenInstance.address ]: ' + stakingTokenInstance.address);
    //                                 console.log('Setting up staking token address in Staking contract....');
    //                                 return stakingInstance.updateStakingTokenAddress(stakingTokenInstance.address).then(() => {
    //                                     console.log('Setting controller in Governance Token contract....');

    //                                     return governanceTokenInstance.setController(stakingInstance.address).then(() => {
    //                                         console.log('Setting controller in AUDT Token contract....');
    //                                         return tokenInstance.setController(stakingInstance.address).then(() => {
    //                                             console.log("Contracts have been initialized....");
    //                                         })
    //                                     })
    //                                 })
    //                             })
    //                         })
    //                     })
    //                 })
    //             })
    //         })
    //     })
    // })
};
