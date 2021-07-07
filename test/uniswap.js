const util = require('util');

const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const Token1 = artifacts.require("Token");
const Token2 = artifacts.require("DAI")



import { assert } from 'console';
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
    let token1, token2;
    let factory = "0x0FCa6BD935f83eB27Af1a7A4D35D9F930DBc7a5E";

    console.log(JSON.stringify(factory));

    before(async () => {
        owner = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
        holder3 = accounts[3];
        holder4 = accounts[4];
        stakingContract = accounts[5];


    });

    beforeEach(async () => {

        // factory = await UniswapV2Factory.new("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        token1 = await Token1.new();
        token2 = await Token2.new();
        // console.log("factory:" + factory);
    })


    describe("Deploy", async () => {

        it("Initiate reward as number greater than unit256 / (10^18)", async () => {
            // factory = await UniswapV2Factory.new("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
            // token1 = await Token1.new();
            // token2 = await Token2.new();
            // let pair = await UniswapV2Factory(factory).createPair(token1, token2, { from: owner });

        })

        it("Initiate reward as number greater than (10^17) - largest of all the capsules", async () => {

        })

    });
})

