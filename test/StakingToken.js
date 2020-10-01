const util = require('util')

const TOKEN = artifacts.require('../StakingToken');


import {
    ensureException,
    duration
} from './helpers/utils.js';

import {
    increaseTime,
    takeSnapshot,
    revertToSnapshot
} from './helpers/time.js'

//import should from 'should';

var BigNumber = require('big-number');

//var ensureException = require("./helpers/utils.js");
//const BigNumber = require('bignumber.js');



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
    let token;
    let stakingContract;
    let stakingTokenSymbol =  "AUDT-STK-1";
    let stakingTokenName = "1-st AUDT Staking";

    before(async () => {
        owner = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
        holder3 = accounts[3];
        holder4 = accounts[4];
        stakingContract = accounts[5];       

    });

    beforeEach(async () => {

        token = await TOKEN.new(stakingContract, stakingTokenSymbol, stakingTokenName);
        await token.mint(holder1, transferFunds, {from: stakingContract});
        // await token.transfer(holder1, transferFunds, {
        //     from: owner
        // });

    })
    describe("Constructor", async () => {
        it("Verify constructors", async () => {

           // token = await TOKEN.new();

            let tokenName = await token.name.call();
            assert.equal(tokenName.toString(), "1-st AUDT Staking");

            let tokenSymbol = await token.symbol();
            assert.equal(tokenSymbol.toString(), "AUDT-STK-1");

            let tokenSupply = await token.totalSupply();
            assert.equal(tokenSupply.toNumber(), transferFunds);           
        });
    });

  

    describe("mint", async () => {

        it('mint: should mint 1000 staking tokens in holder1 account', async () => {    
            
            token = await TOKEN.new(stakingContract, stakingTokenSymbol, stakingTokenName);

            await token.mint(holder1, mintedTokens, {from: stakingContract});          
            let balance = await token
                .balanceOf
                .call(holder1);
            assert.strictEqual(balance.toString(), mintedTokens.toString());

        })

        it('mint: should throw when mint is called by holder2', async () => {
            try {
            await token.mint(holder1, mintedTokens, {from: holder2}); 
                                       
            } catch (error) {              
                ensureException(error);
            }
           
        })
    })

           
    describe("transfer", async () => {
        

        it('transfer: should transfer 1000 to holder2 from holder1', async () => {

            //await token.mint(holder1, mintedTokens, {from: stakingContract});  

            

            await token.transfer(holder2, transferFunds, {
                from: holder1
            });

            let balanceOfHolder1 = await token
            .balanceOf
            .call(holder1)       
            
          //  console.log("holder1 balance:" + balanceOfHolder1);

            let balance = await token
                .balanceOf
                .call(holder2);

          //  console.log("holder2 balance:" + balance);
            assert.strictEqual(balance.toString(), transferFunds.toString());
            assert.strictEqual(balanceOfHolder1.toString(), "0");
        });

       

    
        


       
            
    });

    describe("approve", async () => {

        

        it('approve: holder1 should approve 1000 to holder2', async () => {
           

            await token.approve(holder2, transferFunds, {
                from: holder1
            });
            let _allowance = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance.toNumber(), transferFunds);
        });

        it('approve: holder1 should approve 1000 to holder2 & withdraws 200 one time', async () => {

           // await token.mint(holder1, transferFunds, {from: stakingContract}); 

            await token.approve(holder2, transferFunds, {
                from: holder1
            })
            let _allowance1 = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance1.toNumber(), transferFunds);


            await token.transferFrom(holder1, holder3, 200, {
                from: holder2
            });

            let balance = await token.balanceOf(holder3, {
                from: owner
            })

            assert.strictEqual(balance.toNumber(), 200);


            let _allowance2 = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance2.toNumber(), 800);

            let _balance = await token
                .balanceOf
                .call(holder1);
            assert.strictEqual(_balance.toNumber(), 800);
        });

        it('approve: holder1 should approve 1000 to holder2 & withdraws 200 twice', async () => {

            //await token.mint(holder1, transferFunds, {from: stakingContract}); 

            await token.approve(holder2, transferFunds, {
                from: holder1
            });
            let _allowance1 = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance1.toNumber(), transferFunds);

            await token.transferFrom(holder1, holder3, 200, {
                from: holder2
            });
            let _balance1 = await token
                .balanceOf
                .call(holder3);
            assert.strictEqual(_balance1.toNumber(), 200);
            let _allowance2 = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance2.toNumber(), 800);
            let _balance2 = await token
                .balanceOf
                .call(holder1);
            assert.strictEqual(_balance2.toNumber(), 800);
            await token.transferFrom(holder1, holder4, 200, {
                from: holder2
            });
            let _balance3 = await token
                .balanceOf
                .call(holder4);
            assert.strictEqual(_balance3.toNumber(), 200);
            let _allowance3 = await token
                .allowance
                .call(holder1, holder2);
            assert.strictEqual(_allowance3.toNumber(), 600);
            let _balance4 = await token
                .balanceOf
                .call(holder1);
            assert.strictEqual(_balance4.toNumber(), 600);
        });

        it('Approve max (2^256 - 1)', async () => {
            token = await TOKEN.new(stakingContract, stakingTokenSymbol, stakingTokenName);
            await token.approve(holder1, '115792089237316195423570985008687907853269984665640564039457584007913129639935', {
                from: holder2
            });
            let _allowance = await token.allowance(holder2, holder1);
            //console.log("allowance " + _allowance.toNumber());
            let result = _allowance.toString() === ('115792089237316195423570985008687907853269984665640564039457584007913129639935');
            assert.isTrue(result);
        });


        it('approves: Holder1 approves Holder2 of 1000 & withdraws 800 & 500 (2nd tx should fail)',
            async () => {

                //await token.mint(holder1, transferFunds, {from: stakingContract}); 

                await token.approve(holder2, transferFunds, {
                    from: holder1
                });
                let _allowance1 = await token
                    .allowance
                    .call(holder1, holder2);
                assert.strictEqual(_allowance1.toNumber(), transferFunds);
                await token.transferFrom(holder1, holder3, 800, {
                    from: holder2
                });
                let _balance1 = await token
                    .balanceOf
                    .call(holder3);
                assert.strictEqual(_balance1.toNumber(), 800);
                let _allowance2 = await token
                    .allowance
                    .call(holder1, holder2);
                assert.strictEqual(_allowance2.toNumber(), 200);
                let _balance2 = await token
                    .balanceOf
                    .call(holder1);
                assert.strictEqual(_balance2.toNumber(), 200);
                try {
                    await token.transferFrom(holder1, holder3, 500, {
                        from: holder2
                    });
                } catch (error) {
                    ensureException(error);
                }
            });

            it('approve: should fail when trying to approve token contract as a spender', async () => {

                try {
                    await token.approve(token.address, transferFunds, {
                        from: owner
                    });
                } catch (error) {
                    ensureException(error);
                }
            });

    });


    describe("transferFrom", async () => {
        it('transferFrom: Attempt to  withdraw from account with no allowance  -- fail', async () => {


            try {
                await token
                    .transferFrom
                    .call(holder1, holder3, 100, {
                        from: holder2
                    });
            } catch (error) {
                ensureException(error);
            }
        });

        it('transferFrom: Allow holder2 1000 to withdraw from holder1. Withdraw 800 and then approve 0 & attempt transfer',
            async () => {

                await token.approve(holder2, transferFunds, {
                    from: holder1
                });
                let _allowance1 = await token
                    .allowance
                    .call(holder1, holder2);
                assert.strictEqual(_allowance1.toNumber(), transferFunds);
                await token.transferFrom(holder1, holder3, 200, {
                    from: holder2
                });
                let _balance1 = await token
                    .balanceOf
                    .call(holder3);
                assert.strictEqual(_balance1.toNumber(), 200);
                let _allowance2 = await token
                    .allowance
                    .call(holder1, holder2);
                assert.strictEqual(_allowance2.toNumber(), 800);
                let _balance2 = await token
                    .balanceOf
                    .call(holder1);
                assert.strictEqual(_balance2.toNumber(), 800);
                await token.approve(holder2, 0, {
                    from: holder1
                });
                try {
                    await token.transferFrom(holder1, holder3, 200, {
                        from: holder2
                    });
                } catch (error) {
                    ensureException(error);
                }
            });

    });
      
    describe("burn", async () => {

        it('burn: Burn 1000 tokens in holder account successfully', async () => {           

            let balance = await token.balanceOf(holder1);

            let numberToCompare = BigNumber(balance.toString()).minus(allowedAmount.toString()).toString()
            // assert.equal(balance, transferFunds);
            await token.burn(holder1, allowedAmount, {
                from: stakingContract
            });

            balance = await token.balanceOf(holder1);
            assert.equal(balance.toString(), numberToCompare);
        })

        it('burn: Burn 1000 tokens in owner account should fail. No tokens available', async () => {          

            try {
                await token.burn(owner, transferFunds, {
                    from: stakingContract
                });
            } catch (error) {
                ensureException(error);
            }
        })

    })

    // describe("burnFrom", async () => {

    //     it('burnFrom: Burn 1000 tokens by holder2 in holder1 account successfully', async () => {         
                        
    //         let balance = await token.balanceOf(holder1);

    //         let numberToCompare = BigNumber(balance.toString()).minus(allowedAmount.toString()).toString()
                      
    //         await token.approve(holder2, allowedAmount, {
    //             from: holder1
    //         });

    //         await token.burnFrom(holder1, allowedAmount, {
    //             from: holder2
    //         });

    //         balance = await token.balanceOf(holder1);
           
    //         assert.equal(balance.toString(), numberToCompare);

    //     })

    //     it('burnFrom: Burn 1000 tokens by holder2 in holder1 account should fail', async () => {
         
          

    //         try {
    //             await token.burnFrom(holder1, transferFunds, {
    //                 from: holder2
    //             });
    //         } catch (error) {
    //             ensureException(error);
    //         }

    //     })

    //     it('burnFrom: Burn 1001 tokens by holder1 in owner account should fail', async () => {
           

    //         await token.approve(holder2, transferFunds, {
    //             from: holder1
    //         });
    //         try {
    //             await token.burnFrom(holder1, transferFunds + 1, {
    //                 from: holder2
    //             });
    //         } catch (error) {
    //             ensureException(error);
    //         }
    //     })
    // })


        describe('events', async () => {
            it('should log Transfer event after transfer()', async () => {
    
                let result = await token.transfer(holder3, transferFunds, {
                    from: holder1
                });
    
    
                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'Transfer');
                assert.equal(event.args.from, holder1);
                assert.equal(event.args.to, holder3);
                assert.equal(Number(event.args.value), transferFunds);
            });
    
            it('should log Transfer and Approve events after transferFrom()', async () => {

                await token.approve(holder2, allowedAmount, {
                    from: holder1
                });
    
                let value = allowedAmount / 2;
                let result = await token.transferFrom(holder1, holder3, value, {
                    from: holder2
                });
                assert.lengthOf(result.logs, 2);
                let event1 = result.logs[0];
                assert.equal(event1.event, 'Transfer');
                assert.equal(event1.args.from, holder1);
                assert.equal(event1.args.to, holder3);
                assert.equal(Number(event1.args.value), value);
                let event2 = result.logs[1];
                assert.equal(event2.event, 'Approval');
                assert.equal(event2.args.owner, holder1);
                assert.equal(event2.args.spender, holder2);
                assert.equal(Number(event2.args.value), allowedAmount - value);
    
            });
    
            it('should log Approve event after approve()', async () => {
    
                let result = await token.approve(holder2, allowedAmount, {
                    from: holder1
                });
    
                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'Approval');
                assert.equal(event.args.spender, holder2);
                assert.equal(Number(event.args.value), allowedAmount);
            });
    
    
            it('should log Transfer event after burn()', async () => {
               
                let result = await token.burn(holder1, transferFunds, {
                    from: stakingContract
                });
    
                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'Transfer');
                assert.equal(event.args.from, holder1);
                assert.equal(event.args.to, "0x0000000000000000000000000000000000000000");
                assert.equal(Number(event.args.value), transferFunds);
            });
    
            // it('should log Transfer and Approve event after burnFrom()', async () => {           
    
            //     await token.approve(holder2, allowedAmount, {
            //         from: holder1
            //     });
    
            //     let value = allowedAmount / 2;
            //     let result = await token.burnFrom(holder1, value, {
            //         from: holder2
            //     });
    
            //     assert.lengthOf(result.logs, 2);
    
            //     let event1 = result.logs[1];
            //     assert.equal(event1.event, 'Transfer');
            //     assert.equal(event1.args.from, holder1);
            //     assert.equal(event1.args.to, "0x0000000000000000000000000000000000000000");
            //     assert.equal(Number(event1.args.value), value);
            //     let event2 = result.logs[0];
            //     assert.equal(event2.event, 'Approval');
            //     assert.equal(event2.args.owner, holder1);
            //     assert.equal(event2.args.spender, holder2);
            //     assert.equal(Number(event2.args.value), allowedAmount - value);
            // });
    
    
            it('should log Transfer after mint()', async () => {
    
                let result = await token.mint(holder1, transferFunds, {from: stakingContract});
    
                assert.lengthOf(result.logs, 1);
    
                let event = result.logs[0];
                assert.equal(event.event, 'Transfer');
                assert.equal(event.args.to, holder1);
                assert.equal(event.args.from, "0x0000000000000000000000000000000000000000");
               
            })
    
        
     
    
            it('should log OwnershipTransferred after transferOwnership()', async () => {
    
                let result = await token.transferOwnership(holder1, {
                    from: owner
                });
    
                assert.lengthOf(result.logs, 1);
    
                let event = result.logs[0];
                assert.equal(event.event, 'OwnershipTransferred');
                assert.equal(event.args.previousOwner, owner);
                assert.equal(event.args.newOwner, holder1);
            })
        });

   
    
})