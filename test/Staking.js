const util = require('util')

const STAKINGTOKEN = artifacts.require('../StakingToken');
const TOKEN = artifacts.require('../AuditToken');
const STAKING = artifacts.require('../Staking.sol');
// var Tx = require('ethereumjs-tx');




// import { assert } from 'console';
import {
    ensureException,
    duration
} from './helpers/utils.js';

import expectRevert from './helpers/expectRevert';
const timeMachine = require('ganache-time-traveler');






//import should from 'should';

var BigNumber = require('big-number');

contract("Staking Token", (accounts) => {
    let owner;
    let holder1;
    let holder2;
    let holder3;
    let holder4;
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
    let stakingTokenSymbol = "AUDT-STK-1";
    let stakingTokenName = "1-st AUDT Staking";
    let MINTER_ROLE = web3.utils.keccak256("MINTER_ROLE");
    let snapshotId;

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

        token = await TOKEN.new(owner);
        staking = await STAKING.new(token.address, blockNumber + 100, blockNumber + 200, totalReward);
        stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
        await staking.updateStakingTokenAddress(stakingToken.address);
        await token.grantRole(MINTER_ROLE, owner, { from: owner });
        await token.grantRole(MINTER_ROLE, staking.address, { from: owner });



        await token.mint(holder1, tokensToDeposit, { from: owner });


        // transaction = await token.transfer(holder1, tokensToDeposit, {
        //     from: owner
        // })
    })

    describe("Deploy", async () => {

        it("Should fail. Initiate reward as number greater than heighest reward in the pool  18,000,000 AUDT", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            let oversizedReward = new BigNumber(18000001).mult(Math.pow(10, 18));

            try {
                staking = await STAKING.new(token.address, blockNumber + 100, blockNumber + 200, oversizedReward);
                expectRevert();
            } catch (error) {
                ensureException(error);
            }
        })

        it("Shuld succeed. Initiate reward within allowed boundries", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            let acceptabledReward = new BigNumber(18000000).mult(Math.pow(10, 18));

            staking = await STAKING.new(token.address, blockNumber + 100, blockNumber + 200, acceptabledReward);
            let rewardAmount = await staking.totalReward();
            assert.strictEqual(rewardAmount.toString(), acceptabledReward.toString());

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

        describe("Deploy", async () => {

            it("Should fail. Initiate reward as number greater than heighest reward in the pool  18,000,000 AUDT", async () => {

                let blockNumber = await web3.eth.getBlockNumber();
                let oversizedReward = new BigNumber(18000001).mult(Math.pow(10, 18));

                try {
                    staking = await STAKING.new(token.address, blockNumber + 100, blockNumber + 200, oversizedReward);
                    expectRevert();
                } catch (error) {
                    ensureException(error);
                }
            })

            it("Shuld succeed. Initiate reward within allowed boundries", async () => {

                let blockNumber = await web3.eth.getBlockNumber();
                let acceptabledReward = new BigNumber(18000000).mult(Math.pow(10, 18));

                staking = await STAKING.new(token.address, blockNumber + 100, blockNumber + 200, acceptabledReward);
                let rewardAmount = await staking.totalReward();
                assert.strictEqual(rewardAmount.toString(), acceptabledReward.toString());

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
                staking = await STAKING.new(token.address, blockNumber - 1, blockNumber + 100, totalReward);
                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                try {

                    await staking.stake(tokensToDeposit, { from: holder1 });
                    expectRevert();

                } catch (error) {
                    ensureException(error);
                }
            })

            it("It should return earning ratio of 3", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
                await staking.stake(tokensToDeposit, { from: holder1 });
                let stakingRatio = await staking.returnEarningRatio.call();

                assert.strictEqual(stakingRatio.toString(), new BigNumber(3e18).toString());
            })

            it("It should fail transferring less than 100 AUDT tokens", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                try {

                    await staking.stake(new BigNumber(99).mult(1e18), { from: holder1 });
                    expectRevert();

                } catch (error) {
                    ensureException(error);
                }
            })


            it("It should fail accepting deposit from blacklisted address", async () => {

                await token.mint(holder1, tokensToDeposit, { from: owner });
                await staking.blacklistAddresses([holder3, holder4], { from: owner });
                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder3 });

                try {
                    await staking.stake(tokensToDeposit, { from: holder3 });
                    expectRevert();

                } catch (error) {
                    ensureException(error);
                }


            })

        });


        describe("Redeem", async () => {

            beforeEach(async () => {
                let snapshot = await timeMachine.takeSnapshot();
                snapshotId = snapshot['result'];
            });

            afterEach(async () => {
                await timeMachine.revertToSnapshot(snapshotId);
            });



            it("It should fail redeeming tokens when user provides as input more tokens than deposited ", async () => {

                let blockNumber = await web3.eth.getBlockNumber();
                stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
                await staking.updateStakingTokenAddress(stakingToken.address);

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                await staking.stake(tokensToDeposit, { from: holder1 });

                try {
                    await staking.redeem(new BigNumber(tokensToDeposit).add(1), { from: holder1 });
                    expectRevert();

                } catch (error) {
                    ensureException(error);
                }
            })

            it("It should redeem 3000 AUDT tokens to holder1 who redeemed after staking ended. 2000 AUDT reward and 1000 AUDT original deposit", async () => {

                let blockNumber = await web3.eth.getBlockNumber();
                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                await staking.stake(tokensToDeposit, { from: holder1 });

                await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
                for (var i = 0; i < 202; i++) {
                    await timeMachine.advanceBlock();  // on average month
                }
                blockNumber = await web3.eth.getBlockNumber();



                await staking.redeem(tokensToDeposit, { from: holder1 });

                let balanceAfterStaking = await token.balanceOf.call(holder1)
                assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).mult(3).toString());

            })

            it("It should redeem 1000 AUDT tokens to holder1. Redeeming has been done before staking ended, so no reward", async () => {

                let blockNumber = await web3.eth.getBlockNumber();

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
                await staking.stake(tokensToDeposit, { from: holder1 });

                // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

                await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                for (var i = 0; i < 150; i++) {
                    await timeMachine.advanceBlock();  // on average month
                }
                await staking.redeem(tokensToDeposit, { from: holder1 });

                let balanceAfterStaking = await token.balanceOf.call(holder1)
                assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).toString());

            })

            it("It should zero balance of staking token after all users redeemed their earnings", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                await staking.stake(tokensToDeposit, { from: holder1 });

                // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

                await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
                await staking.redeem(tokensToDeposit, { from: holder1 });

                let balanceAfterStaking = await stakingToken.totalSupply();

                assert.strictEqual(balanceAfterStaking.toNumber(), 0);


            })


            it("The staking token should have balance of 1000 after first deposit", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
                await staking.stake(tokensToDeposit, { from: holder1 });

                let balanceAfterStaking = await stakingToken.totalSupply();

                assert.strictEqual(balanceAfterStaking.toString(), tokensToDeposit.toString());
            })


            it("It should redeem 1666666666666666666000 AUDT tokens to holder1 and 3333333333333333332000 AUDT tokens to holder2", async () => {

                let blockNumber = await web3.eth.getBlockNumber();

                // await token.mint(holder1, tokensToDeposit, { from: owner });
                await token.mint(holder2, doubleTokensToDeposit, { from: owner });

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

                for (var i = 0; i < 202; i++) {
                    await timeMachine.advanceBlock();  // on average month
                }

                await staking.redeem(tokensToDeposit, { from: holder1 });
                await staking.redeem(doubleTokensToDeposit, { from: holder2 });

                // console.log('staking token balance after redeem:' + await stakingToken.totalSupply());

                let balanceAfterStakingHolder1 = await token.balanceOf(holder1)

                // console.log('holder1 balance:' + balanceAfterStakingHolder1.toString());

                assert.strictEqual(balanceAfterStakingHolder1.toString(), "1666666666666666666000");

                let balanceAfterStakingHolder2 = await token.balanceOf(holder2)
                assert.strictEqual(balanceAfterStakingHolder2.toString(), "3333333333333333332000");

                // console.log('holder2 balance:' + balanceAfterStakingHolder2.toString());
            })


        });

        describe("updateStakingPeriods", async () => {

            it("It should update staking period by the owner", async () => {

                let blockNumber = await web3.eth.getBlockNumber();

                await token.mint(holder1, tokensToDeposit, { from: owner });
                await staking.updateStakingPeriods(blockNumber + 5, blockNumber + 7, { from: owner });
                let startDate = await staking.stakingDateStart();
                let endDate = await staking.stakingDateEnd();
                assert.strictEqual(startDate.toNumber(), blockNumber + 5);
                assert.strictEqual(endDate.toNumber(), blockNumber + 7);
            })

            it("It should fail updating staking period by holder1", async () => {

                try {
                    await staking.updateStakingPeriods(1, 2, { from: holder1 });
                } catch (error) {
                    ensureException(error);
                }
            })

            it("It should fail updating staking period by passing argument 0", async () => {

                try {
                    await staking.updateStakingPeriods(0, 2, { from: owner });
                    expectRevert();

                } catch (error) {
                    ensureException(error);
                }
            })

            it("It should fail updating staking period by passing start date less or equal current block number", async () => {

                let blockNumber = await web3.eth.getBlockNumber();

                try {
                    await staking.updateStakingPeriods(blockNumber, blockNumber + 5, { from: owner });
                } catch (error) {
                    ensureException(error);
                }
            })

            it("It should fail updating staking period by passing start date larger than end date", async () => {

                let blockNumber = await web3.eth.getBlockNumber();

                try {
                    await staking.updateStakingPeriods(blockNumber + 10, blockNumber + 5, { from: owner });
                } catch (error) {
                    ensureException(error);
                }
            })
        })

        describe("returnUnauthorizedTokens", async () => {

            it("It should fail to refund tokens to holder1 due to insufficient funds in the contract", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                await staking.stake(tokensToDeposit, { from: holder1 });

                try {
                    let result = await staking.returnUnauthorizedTokens(holder1, doubleTokensToDeposit, { from: owner });
                    expectRevert();
                }
                catch (error) {
                    ensureException(error);
                }
            })

            it("It should refund tokens to holder1", async () => {

                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

                await staking.stake(tokensToDeposit, { from: holder1 });

                let result = await staking.returnUnauthorizedTokens(holder1, tokensToDeposit, { from: owner });

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



                // transfer tokens not using directly the staking function. 
                await token.transfer(staking.address, tokensToDeposit, {
                    from: holder1
                })
                await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder2 });

                try {
                    let result = await staking.returnUnauthorizedTokens(holder1, tokensToDeposit, { from: holder1 });
                    expectRevert();
                }
                catch (error) {
                    ensureException(error);
                }
            })

        })

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
            staking = await STAKING.new(token.address, blockNumber - 1, blockNumber + 100, totalReward);
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            try {

                await staking.stake(tokensToDeposit, { from: holder1 });
                expectRevert();

            } catch (error) {
                ensureException(error);
            }
        })

        it("It should return earning ratio of 3", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await staking.stake(tokensToDeposit, { from: holder1 });
            let stakingRatio = await staking.returnEarningRatio.call();

            assert.strictEqual(stakingRatio.toString(), new BigNumber(3e18).toString());
        })

        it("It should fail transferring less than 100 AUDT tokens", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            try {

                await staking.stake(new BigNumber(99).mult(1e18), { from: holder1 });
                expectRevert();

            } catch (error) {
                ensureException(error);
            }
        })


        it("It should fail accepting deposit from blacklisted address", async () => {

            await token.mint(holder1, tokensToDeposit, { from: owner });
            await staking.blacklistAddresses([holder3, holder4], { from: owner });
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder3 });

            try {
                await staking.stake(tokensToDeposit, { from: holder3 });
                expectRevert();

            } catch (error) {
                ensureException(error);
            }


        })

    });


    describe("Redeem", async () => {

        beforeEach(async () => {
            let snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot['result'];
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId);
        });



        it("It should fail redeeming tokens when user provides as input more tokens than deposited ", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            stakingToken = await STAKINGTOKEN.new(staking.address, stakingTokenSymbol, stakingTokenName);
            await staking.updateStakingTokenAddress(stakingToken.address);

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            try {
                await staking.redeem(new BigNumber(tokensToDeposit).add(1), { from: holder1 });
                expectRevert();

            } catch (error) {
                ensureException(error);
            }
        })

        it("It should redeem 3000 AUDT tokens to holder1 who redeemed after staking ended. 2000 AUDT reward and 1000 AUDT original deposit", async () => {

            let blockNumber = await web3.eth.getBlockNumber();
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            for (var i = 0; i < 202; i++) {
                await timeMachine.advanceBlock();  // on average month
            }
            blockNumber = await web3.eth.getBlockNumber();



            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await token.balanceOf.call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).mult(3).toString());

        })

        it("It should redeem 1000 AUDT tokens to holder1. Redeeming has been done before staking ended, so no reward", async () => {

            let blockNumber = await web3.eth.getBlockNumber();

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            for (var i = 0; i < 150; i++) {
                await timeMachine.advanceBlock();  // on average month
            }
            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await token.balanceOf.call(holder1)
            assert.strictEqual(balanceAfterStaking.toString(), new BigNumber(tokensToDeposit).toString());

        })

        it("It should zero balance of staking token after all users redeemed their earnings", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            // console.log("staking balance:" + await stakingToken.balanceOf(holder1));

            await stakingToken.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 })
            await staking.redeem(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await stakingToken.totalSupply();

            assert.strictEqual(balanceAfterStaking.toNumber(), 0);


        })


        it("The staking token should have balance of 1000 after first deposit", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });
            await staking.stake(tokensToDeposit, { from: holder1 });

            let balanceAfterStaking = await stakingToken.totalSupply();

            assert.strictEqual(balanceAfterStaking.toString(), tokensToDeposit.toString());
        })


        it("It should redeem 1666666666666666666000 AUDT tokens to holder1 and 3333333333333333332000 AUDT tokens to holder2", async () => {

            let blockNumber = await web3.eth.getBlockNumber();

            // await token.mint(holder1, tokensToDeposit, { from: owner });
            await token.mint(holder2, doubleTokensToDeposit, { from: owner });

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

            for (var i = 0; i < 202; i++) {
                await timeMachine.advanceBlock();  // on average month
            }

            await staking.redeem(tokensToDeposit, { from: holder1 });
            await staking.redeem(doubleTokensToDeposit, { from: holder2 });

            // console.log('staking token balance after redeem:' + await stakingToken.totalSupply());

            let balanceAfterStakingHolder1 = await token.balanceOf(holder1)

            // console.log('holder1 balance:' + balanceAfterStakingHolder1.toString());

            assert.strictEqual(balanceAfterStakingHolder1.toString(), "1666666666666666666000");

            let balanceAfterStakingHolder2 = await token.balanceOf(holder2)
            assert.strictEqual(balanceAfterStakingHolder2.toString(), "3333333333333333332000");

            // console.log('holder2 balance:' + balanceAfterStakingHolder2.toString());
        })


    });

   

    describe("returnUnauthorizedTokens", async () => {

        it("It should fail to refund tokens to holder1 due to insufficient funds in the contract", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            try {
                let result = await staking.returnUnauthorizedTokens(holder1, doubleTokensToDeposit, { from: owner });
                expectRevert();
            }
            catch (error) {
                ensureException(error);
            }
        })

        it("It should refund tokens to holder1", async () => {

            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder1 });

            await staking.stake(tokensToDeposit, { from: holder1 });

            let result = await staking.returnUnauthorizedTokens(holder1, tokensToDeposit, { from: owner });

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



            // transfer tokens not using directly the staking function. 
            await token.transfer(staking.address, tokensToDeposit, {
                from: holder1
            })
            await token.increaseAllowance(staking.address, tokensToDeposit, { from: holder2 });

            try {
                let result = await staking.returnUnauthorizedTokens(holder1, tokensToDeposit, { from: holder1 });
                expectRevert();
            }
            catch (error) {
                ensureException(error);
            }
        })

    })



});
