const cnf = require('../config/airdrop1.json');

const Token = artifacts.require('./Token.sol');
const Staking = artifacts.require('./Staking.sol');
const StakingToken = artifacts.require('./StakingToken.sol');
const GovernanceToken = artifacts.require('../GovernanceToken.sol');

var BigNumber = require('big-number');


module.exports = function (deployer, network, accounts) { // eslint-disable-line

    console.log("Network:" + network)

    // deploy the token with params from /config/contract.json file

    const { STAKING_START_TIME, STAKING_END_TIME, TOTAL_REWARD, STAKING_TOKEN_SYMBOL, STAKING_TOKEN_NAME, GOVERNANCE_TOKEN_REWARD_RATIO } = cnf;
    let governanceTokenRewardRatio = new BigNumber(GOVERNANCE_TOKEN_REWARD_RATIO);


    deployer.deploy(Token).then(() => {
        return Token.deployed().then((tokenInstance) => {
            console.log('[ Token.address ]: ' + tokenInstance.address);
            deployer.deploy(GovernanceToken).then(() => {
                return GovernanceToken.deployed().then((governanceTokenInstance) => {
                    console.log('[ Governance Token.address ]: ' + governanceTokenInstance.address);
                    return deployer.deploy(Staking, tokenInstance.address, governanceTokenInstance.address, STAKING_START_TIME, STAKING_END_TIME, TOTAL_REWARD, governanceTokenRewardRatio).then(() => {
                        return Staking.deployed().then((stakingInstance) => {
                            console.log('[ StakingInstance.address ]:' + stakingInstance.address);
                            return deployer.deploy(StakingToken, stakingInstance.address, STAKING_TOKEN_SYMBOL, STAKING_TOKEN_NAME).then(() => {
                                return StakingToken.deployed().then((stakingTokenInstance) => {
                                    console.log('[ StakingTokenInstance.address ]:' + stakingTokenInstance.address);
                                    console.log('Setting up staking token address in Staking contract....');
                                    return stakingInstance.updateStakingTokenAddress(stakingTokenInstance.address).then(() => {
                                        console.log('Setting controller in Governance Token contract....');
                                        return governanceTokenInstance.setController(stakingTokenInstance.address).then(() => {
                                            console.log('Setting controller in AUDT Token contract....');
                                            return tokenInstance.setController(stakingTokenInstance.address).then(() => {
                                                console.log("Contracts have been initialized....");
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
};
