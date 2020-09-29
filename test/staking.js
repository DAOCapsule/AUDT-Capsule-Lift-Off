const util = require('util')

const STAKINGTOKEN = artifacts.require('../StakingToken');
const TOKEN = artifacts.require('../Token');
const STAKING = artifacts.require('../Staking.sol');



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
    let token;
    let stakingContract;
    let staking;
    let stakingToken;
    let transaction;

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
        staking = await STAKING.new(token.address, blockNumber + 100 , blockNumber + 200 );
        stakingToken = await STAKINGTOKEN.new(staking.address);
        await staking.updateStakingTokenAddress(stakingToken.address);

        transaction = await token.transfer(holder1, tokensToDeposit, {
            from: owner
        })

        // await stakingToken.mint(holder1, transferFunds, {from: stakingContract});
        // await token.transfer(holder1, transferFunds, {
        //     from: owner
        // });

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
            staking = await STAKING.new(token.address, blockNumber - 1, blockNumber + 100 );
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            try {

                await staking.stake(tokensToDeposit, { from: holder1 });

            } catch (error) {
                ensureException(error);
            }
        })

        it("It should return earning ratio of 2", async () => {

            await token.increaseAllowance(staking.address, doubleTokensToDeposit, { from: owner });
            await staking.fundStaking(doubleTokensToDeposit, { from: owner });

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            let stakingRatio = await staking
                .returnEarningRatio
                .call();

            assert.strictEqual(stakingRatio.toString(), new BigNumber(2e18).toString() );
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
    
            await staking.blacklistAddresses([holder3, holder4], {from:owner});

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder3 });


           try {

                await staking.stake(tokensToDeposit, { from: holder3 });

            } catch (error) {
                ensureException(error);
            }


        })

    });

    describe("Redeem", async () => {

        it("It should redeem 3000 AUDT tokens to holder1 who redeemed after staking ended. 2000 AUDT reward and 1000 AUDT original deposit", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, blockNumber + 7 , blockNumber + 8 );
            stakingToken = await STAKINGTOKEN.new(staking.address);
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
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).mult(3).toString());

        })

        it("It should redeem 1000 AUDT tokens to holder1. Redeeming has been done before staking ended, so no reward", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            staking = await STAKING.new(token.address, blockNumber + 7 , blockNumber + 100 );
            stakingToken = await STAKINGTOKEN.new(staking.address);
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
            staking = await STAKING.new(token.address, blockNumber + 10 , blockNumber + 11 );
            stakingToken = await STAKINGTOKEN.new(staking.address);
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
            await stakingToken.increaseAllowance(staking.address, doubleTokensToDeposit, { from: holder2 })

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

});