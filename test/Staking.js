const util = require('util')

const STAKINGTOKEN = artifacts.require('../StakingToken');
const TOKEN = artifacts.require('../Token');
const STAKING = artifacts.require('../Staking.sol');
const GOVERNANCETOKEN = artifacts.require('../GovernanceToken.sol');
var Tx = require('ethereumjs-tx');




// import { assert } from 'console';
import {
    ensureException,
    duration
} from './helpers/utils.js';



//import should from 'should';

var BigNumber = require('big-number');

contract("Staking Token", (accounts) => {
    let owner;
    let holder1;
    let holder2;
    let holder3;
    let holder4;
    let supply = (250000000 + 12500000) * 1e18;
    let transferFunds = 1000;
    let allowedAmount = 200;

    let mintedTokens = new BigNumber(1000).mult(1e18);
    let tokensToDeposit = new BigNumber(1000).mult(1e18);
    let doubleTokensToDeposit = new BigNumber(2000).mult(1e18);
    let totalReward = new BigNumber(2000).mult(1e18);
    let token;
    let stakingContract;
    let staking;
    let stakingToken;
    let governanceToken;
    let transaction;
    let stakingTokenSymbol = "AUDT-STK-1";
    let stakingTokenName = "1-st AUDT Staking";
    let governanceTokenRewardRatio = new BigNumber(100000000000000000);

    before(async () => {
        owner = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
        holder3 = accounts[3];
        holder4 = accounts[4];
        stakingContract = accounts[5];


    });

    beforeEach(async () => {

        let blockNumber = await web3.eth.getBlockNumber();

        token = await TOKEN.new();
        governanceToken = await GOVERNANCETOKEN.new();
        staking = await STAKING.new(token.address, governanceToken.address, blockNumber + 100, blockNumber + 200, totalReward, governanceTokenRewardRatio);
        stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
        await staking.updateStakingTokenAddress(stakingToken.address);

        transaction = await token.transfer(holder1, tokensToDeposit, {
            from: owner
        })
    })




    describe("Deposit", async () => {

        it("Approve allowance of 1000 AUDT tokens to staking contract by holder1", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            let _allowance = await token
                .allowance
                .call(holder1, staking.address);

            assert.strictEqual(_allowance.toString(), tokensToDeposit.toString());
        });


        it("Transfer AUDT tokens from holder1 to staking contract and mint staking tokens for holder1 in exchange for the deposit", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            let balance = await token
                .balanceOf
                .call(holder1);
            assert.strictEqual(balance.toNumber(), 0);

            let balanceStaking = await stakingToken
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceStaking.toString(), tokensToDeposit.toString());

        })


        it("It should fail contribution of AUDT tokens from holder1 for staking due to deposit period expired", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, governanceToken.address, blockNumber - 1, blockNumber + 100, totalReward, governanceTokenRewardRatio);
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            try {

                await staking.stake(tokensToDeposit, { from: holder1 });

            } catch (error) {
                ensureException(error);
            }
        })

        it("It should return earning ratio of 3", async () => {

            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            let stakingRatio = await staking
                .returnEarningRatio
                .call();

            assert.strictEqual(stakingRatio.toString(), new BigNumber(3e18).toString());
        })

        it("It should fail transferring less than 100 AUDT tokens", async () => {

            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            try {

                await staking.stake(new BigNumber(99).mult(1e18), { from: holder1 });

            } catch (error) {
                ensureException(error);
            }
        })


        it("It should fail accepting deposit from blacklisted address", async () => {


            // await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            // await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            transaction = await token.transfer(holder3, tokensToDeposit, {
                from: owner
            })

            await staking.blacklistAddresses([holder3, holder4], { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder3 });


            try {

                await staking.stake(tokensToDeposit, { from: holder3 });

            } catch (error) {
                ensureException(error);
            }


        })

    });


    describe("Redeem", async () => {


        it("It should fail redeeming tokens when user provides as input more tokens than deposited ", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, governanceToken.address, blockNumber + 7, blockNumber + 8, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            try {
                await staking.redeem(new BigNumber(tokensToDeposit).add(1) , { from: holder1 });
           } catch (error) {
                ensureException(error);
           }   
        })

        it("It should redeem 3000 AUDT tokens to holder1 who redeemed after staking ended. 2000 AUDT reward and 1000 AUDT original deposit", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address,governanceToken.address, blockNumber + 7, blockNumber + 8, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await governanceToken.setController(staking.address);

            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await token
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).mult(3).toString());

        })

        it("It should redeem 1000 AUDT tokens to holder1. Redeeming has been done before staking ended, so no reward", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, governanceToken.address, blockNumber + 7, blockNumber + 100, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await token
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).toString());

        })

        it("It should zero balance of staking token after all users redeemed their earnings", async () => {

            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });



            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await stakingToken
                .totalSupply();

            assert.strictEqual(balanceAfterStaking.toNumber(), 0);


        })


        it("The staking token should have balance of 1000 after first deposit", async () => {

            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await stakingToken
                .totalSupply();

            assert.strictEqual(balanceAfterStaking.toString(), tokensToDeposit.toString());


        })


        it("It should redeem 1666666666666666666000 AUDT tokens to holder1 and 3333333333333333332000 AUDT tokens to holder2", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address,governanceToken.address, blockNumber + 10, blockNumber + 11, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            transaction = await token.transfer(holder2, doubleTokensToDeposit, {
                from: owner
            })

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: holder2 });

            // console.log("staking balance holder1 before:" + await stakingToken.balanceOf(holder1));

            await staking.stake(tokensToDeposit, { from: holder1 });
            await staking.stake(doubleTokensToDeposit, { from: holder2 });


            // console.log("staking balance holder1:" + await stakingToken.balanceOf(holder1));
            // console.log('reward ratio:' + await staking.returnEarningRatio());
            // console.log('staking token balance before redeem:' + await stakingToken.totalSupply());

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await stakingToken.increaseAllowance(staking.address, doubleTokensToDeposit, { from: holder2 });
            await governanceToken.setController(staking.address);


            await staking.redeem(tokensToDeposit, { from: holder1 });
            await staking.redeem(doubleTokensToDeposit, { from: holder2 });

            // console.log('staking token balance after redeem:' + await stakingToken.totalSupply());

            let balanceAfterStakingHolder1 = await token
                .balanceOf
                .call(holder1)

            // console.log('holder1 balance:' + balanceAfterStakingHolder1.toString());

            assert.strictEqual(balanceAfterStakingHolder1.toString(), "1666666666666666666000");

            let balanceAfterStakingHolder2 = await token
                .balanceOf
                .call(holder2)
            assert.strictEqual(balanceAfterStakingHolder2.toString(), "3333333333333333332000");

            // console.log('holder2 balance:' + balanceAfterStakingHolder2.toString());
        })


    });

    describe("updateStakingPeriods", async () => {

        it("It should update staking period by the owner", async () => {

            await staking.updateStakingPeriods(1, 2, {from:owner});
            let startDate = await staking.stakingDateStart();
            let endDate = await staking.stakingDateEnd();
            assert.strictEqual(startDate.toNumber(), 1);
            assert.strictEqual(endDate.toNumber(), 2);
        })

        it("It should fail updating staking period by holder1", async () => {

           try {
                await staking.updateStakingPeriods(1, 2, {from:holder1});
           } catch (error) {
                ensureException(error);
           }          
        })

        it("It should fail updating staking period by passing argument 0", async () => {

            try {
                await staking.updateStakingPeriods(0, 2, {from:owner});
            } catch (error) {
                ensureException(error);
            }          
        })
    })

    describe("returnUnauthorizedTokens", async () => {

        it("It should fail to refund tokens to holder1 due to insufficient funds in the contract", async () => {


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });


            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });
            
            try {
                let result = await staking.returnUnauthorizedTokens(token.address, holder1, tokensToDeposit, { from: owner });
            }
            catch (error) {
                ensureException(error);
            }
        })

        it("It should refund tokens to holder1", async () => {


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            transaction = await token.transfer(holder2, tokensToDeposit, {
                from: owner
            })

            // transfer tokens not using directly the staking function. 
            transaction = await token.transfer(staking.address, tokensToDeposit, {
                from: holder1
            })
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder2 });
            
            await staking.stake(tokensToDeposit, { from: holder2 });

            let result = await staking.returnUnauthorizedTokens(token.address, holder1, tokensToDeposit, { from: owner });

            let balanceAfterRefund = await token
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceAfterRefund.toString(), tokensToDeposit.toString());

            assert.lengthOf(result.logs, 1);

            let event = result.logs[0];
            assert.equal(event.event, 'LogUnauthorizedTokensReturn');
            assert.strictEqual(event.args.amount.toString(), tokensToDeposit.toString());

        })

        it("It should fail to refund tokens to holder1 when refund is made by not authorized user", async () => {


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            transaction = await token.transfer(holder2, tokensToDeposit, {
                from: owner
            })

            // transfer tokens not using directly the staking function. 
            transaction = await token.transfer(staking.address, tokensToDeposit, {
                from: holder1
            })
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder2 });
            
            await staking.stake(tokensToDeposit, { from: holder2 });

            // let result = await staking.returnUnauthorizedTokens(token.address, holder1, tokensToDeposit, { from: holder1 });

           
            try {
                let result = await staking.returnUnauthorizedTokens(token.address, holder1, tokensToDeposit, { from: holder1});
            }
            catch (error) {
                ensureException(error);
            }
        })

    })


    describe("GovernanceToken", async () => {

        it("It should transfer 100 governance tokens to holder1", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, governanceToken.address, blockNumber + 7, blockNumber + 8, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
            await governanceToken.setController(staking.address);
            await staking.redeem(tokensToDeposit, { from: holder1 });


            let balanceAfterStaking = await governanceToken
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).mult(governanceTokenRewardRatio).div(1e18).toString());
            // console.log("governance tokens:" + balanceAfterStaking/1e18);
            // console.log("tokens deposited:" + tokensToDeposit/1e18);
        })

        it("It should transfer 0 governance tokens to holder1 because staking is not over yet", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, governanceToken.address, blockNumber + 7, blockNumber + 80, totalReward, governanceTokenRewardRatio);
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);


            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
            await governanceToken.setController(staking.address);
            await staking.redeem(tokensToDeposit, { from: holder1 });


            let balanceAfterStaking = await governanceToken
                .balanceOf
                .call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), "0");
            // console.log("governance tokens:" + balanceAfterStaking/1e18);
            // console.log("tokens deposited:" + tokensToDeposit/1e18);
        })
    })

});
