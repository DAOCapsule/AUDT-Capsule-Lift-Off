"use strict";
let buildDir, configDir, account, gasPrice, gasAmount, secondsInBlock, earningRatio, receipts, stakingTokenSymbol,
    stakedAmount, totalReward, userHoldingsAUDT, conversionUSD_AUDT = 10, userHoldingsGovToken,
    startBlock, endBlock, tokenAddress, stakingAddress, stakingReceipt, governanceToken, selectedCapsule=1;

async function init() {

    // let provider = (window.web3 && window.web3.currentProvider);


    if (typeof window.web3 === 'undefined') {
        showTimeNotification("top", "right", "Please enable metamask.")
    }
    // else if (ethereum.selectedAddress == undefined) {
    //     showTimeNotification("top", "right", "Please unlock metamask.")
    // }

    let test = ethereum.isMetaMask;

    gasPrice = 20000000000;
    gasAmount = 4000000;
    secondsInBlock = 14.05;
    buildDir = "../../build/contracts/";
    configDir = "../../config/"
    selectedCapsule = 1;

    const ethereumButton1 = document.querySelector('.enableEthereumButton');
    const ethereumButton = document.querySelector('.enableEthereumButton');


    // ethereumButton.addEventListener('click', () => {
    //     getAccount();
    // });






    ethereum.on('accountsChanged', function (accounts) {
        // Time to reload your interface with accounts[0]!
        console.log("accounts:" + accounts);
    });

    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
    }

    // let inputBox = document.getElementById('#');

    // inputBox.onkeyup = function () {
    //     document.getElementById('earned-amount').innerHTML = inputBox.value;
    // }

    // loadStats();
    // loadContracts(1);
    displayProgress(1);

    if (ethereum.isConnected()){
        $(".enableEthereumButton").css("display", "none");
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        account = accounts[0];
        loadPortfolio(1);

    } else 
    $(".enableEthereumButton").css("display", "block");

    // whichNetwork();  
    
}


async function getAccount(capsuleNumber) {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    const showAccount = document.querySelector('.showAccount');
    showAccount.innerHTML = account;
    // loadStats();


    $(".enableEthereumButton").css("display", "none");

    // loadStats();
    loadPortfolio(selectedCapsule);


}

async function loadConfig(fileName) {

    return new Promise(function (resolve, reject) {

        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', configDir + fileName, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                //callback(xobj.responseText);
                resolve(xobj.responseText);
            }
        };
        xobj.send(null);
    })

}

async function loadContracts(capsuleNumber) {


    let res = await loadConfig("airdrop" + capsuleNumber + ".json");

    let actual_JSON = JSON.parse(res);
    const { AUDT_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS, STAKING_RECEIPT, GOVERNANCE_TOKEN_ADDRESS } = actual_JSON;

    tokenAddress = AUDT_TOKEN_ADDRESS;
    stakingAddress = STAKING_CONTRACT_ADDRESS;
    stakingReceipt = STAKING_RECEIPT;
    governanceToken = GOVERNANCE_TOKEN_ADDRESS;




}


async function populatePoolTable(capsuleNumber) {

    // var currentRow=$("#pool-table").closest("tr"); 

    //      var col1=currentRow.find("td:eq(0)").html(); // get current row 1st table cell TD value
    //      var col2=currentRow.find("td:eq(1)").html(); // get current row 2nd table cell TD value
    //      var col3=currentRow.find("td:eq(2)").html(); // get current row 3rd table cell  TD value
    //      var data=col1+"\n"+col2+"\n"+col3;

    let res = await loadConfig("airdrop" + capsuleNumber + ".json");


    let actual_JSON = JSON.parse(res);
    const { GOVERNANCE_TOKEN_REWARD_RATIO } = actual_JSON;

    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));



    $("#tb-mission-reward").html((Number(totalReward) / Math.pow(10, 18)).formatMoney(2, ".", ","));
    $("#tb-mission-reward-usd").html((Number(totalReward) / Math.pow(10, 18) / conversionUSD_AUDT).formatMoney(2, ".", ","));
    $("#tb-total-staked").html((Number(stakedAmount) / Math.pow(10, 18)).formatMoney(2, ".", ","));
    $("#tb-total-staked-usd").html((Number(stakedAmount) / Math.pow(10, 18) / conversionUSD_AUDT).formatMoney(2, ".", ","));
    $("#tb-my-stake").html((Number(receipts) / Math.pow(10, 18)).formatMoney(2, ".", ","));
    $("#tb-my-stake-usd").html((Number(receipts) / Math.pow(10, 18) / conversionUSD_AUDT).formatMoney(2, ".", ","));

    $("#tb-current-reward").html((Number(receipts) / Math.pow(10, 36) * earningRatio).formatMoney(2, ".", ","));
    $("#tb-current-reward-usd").html((Number(receipts) / Math.pow(10, 36) * earningRatio / conversionUSD_AUDT).formatMoney(2, ".", ","));

    $("#tb-ratio").html((earningRatio / Math.pow(10, 18)).formatMoney(2, ".", ","));
    $("#tb-ratio-usd").html((earningRatio / Math.pow(10, 18) / conversionUSD_AUDT).formatMoney(2, ".", ","));

    $("#tb-governance-token").html((Number(GOVERNANCE_TOKEN_REWARD_RATIO) * Number(receipts) / Math.pow(10, 36)).formatMoney(2, ".", ","));
    $("#tb-governance-token-usd").html((Number(GOVERNANCE_TOKEN_REWARD_RATIO) * Number(receipts) / Math.pow(10, 36) / conversionUSD_AUDT).formatMoney(2, ".", ","));

    $("#return-percentage").html((((earningRatio / Math.pow(10, 18)) - 1) * 100).formatMoney(2, ".", ",") + "%");
    $("#current-block").html("Now Block:" + blockNumber);
    $("#start-block").html("Start Block:" + startBlock);
    $("#end-block").html("End Block:" + endBlock);




}


async function loadPortfolio(selectedCapsule) {


    let progress = await updateCampaignProgress();

    // process staking contract
    let res = await loadJSON("Staking.json");

    let actual_JSON = JSON.parse(res);
    let contract = web3.eth.contract(actual_JSON["abi"]);
    let stakingContractHandle = contract.at(stakingAddress);

    earningRatio = await promisify(cb => stakingContractHandle.returnEarningRatio(cb));

    // process staking token 
    res = await loadJSON("StakingToken.json");

    actual_JSON = JSON.parse(res);
    contract = web3.eth.contract(actual_JSON["abi"]);
    let stakingTokenContractHandle = contract.at(stakingReceipt);

    receipts = await promisify(cb => stakingTokenContractHandle.balanceOf(account, cb));
    stakingTokenSymbol = await promisify(cb => stakingTokenContractHandle.symbol(cb));
    let earningsPerAmount = await promisify(cb => stakingContractHandle.returnEarningsPerAmount(receipts, cb));
    stakedAmount = await promisify(cb => stakingContractHandle.stakedAmount(cb));
    totalReward = await promisify(cb => stakingContractHandle.totalReward(cb));
    startBlock = await promisify(cb => stakingContractHandle.stakingDateStart(cb));
    endBlock = await promisify(cb => stakingContractHandle.stakingDateEnd(cb));


    // process AUDT token

    res = await loadJSON("Token.json");
    actual_JSON = JSON.parse(res);
    contract = web3.eth.contract(actual_JSON["abi"]);
    let AUDTContractHandle = contract.at(tokenAddress);

    userHoldingsAUDT = await promisify(cb => AUDTContractHandle.balanceOf(account, cb));

    // process Governance Token

    res = await loadJSON("GovernanceToken.json");
    actual_JSON = JSON.parse(res);
    contract = web3.eth.contract(actual_JSON["abi"]);
    let GovernanceContractHandle = contract.at(governanceToken);

    userHoldingsGovToken = await promisify(cb => GovernanceContractHandle.balanceOf(account, cb));



    $("#current-value").html(formatNumber(Number(receipts) / Math.pow(10, 18)) + " AUDT");
    $("#portfolio-value").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)) + " AUDT");


    $("#your-receipts").html(formatNumber(Number(receipts) / Math.pow(10, 18)) + " " + stakingTokenSymbol);
    $("#taking-amount").attr("placeholder", "Enter amount of " + stakingTokenSymbol + " to redeem..");

    $("#stake-apr").html((earningRatio / Math.pow(10, 18)).formatMoney(2, ".", ",") + "%");
    $("#staking-amount").val("");
    $("#contribute").css("display", "none");
    $("#earned-amount").text("0.00 AUDT  ");

    $("#taking-amount").val("");
    $("#take").css("display", "none");
    $("#take-amount").text("0.00 AUDT  ");

    if (progress[0] <= 100) {
        $("#portfolio-value-to-take").html(formatNumber(Number(receipts) / Math.pow(10, 18)) + " AUDT");
        $("#take-apr").html("1.00%");
    }
    else if (progress[1] <= 100) {

        $("#portfolio-value-to-take").html(formatNumber(Number(receipts) / Math.pow(10, 18)) + " AUDT");
        $("#take-apr").html("1.00%");
    } else {
        $("#portfolio-value-to-take").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)) + " AUDT");
        $("#taking-amount").val(receipts / Math.pow(10, 18));
        $("#taking-amount").attr("disabled", true);
        $("#staking-amount").attr("disabled", true);

        $("#take-amount").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)) + " AUDT");
        $("#take-apr").html((earningRatio / Math.pow(10, 18)).formatMoney(2, ".", ",") + "%");



        $("#take").css("display", "block");





    }

    populatePoolTable(selectedCapsule);






}



async function updateCampaignProgress() {

    let stakingPercentage;
    let res = await loadConfig("airdrop1.json");
    let actual_JSON = JSON.parse(res);
    const { STAKING_START_TIME, STAKING_END_TIME, DEPLOYMENT_TIME } = actual_JSON;
    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));



    let depositPercentage = (blockNumber - DEPLOYMENT_TIME) / (STAKING_START_TIME - DEPLOYMENT_TIME) * 100;

    if (depositPercentage >= 100) {
        stakingPercentage = (blockNumber - STAKING_START_TIME) / (STAKING_END_TIME - STAKING_START_TIME) * 100;
        // $("#deposit-progress").css("display", "none");
        if (stakingPercentage <= 100) {
            $("#stake-progress").css("display", "block");
            $("#take-progress").css("display", "block");
            $("#stake-progress").text("Staking in progress " + Math.round(Number(stakingPercentage)) + " %");
            $("#take-progress").text("Staking in progress " + Math.round(Number(stakingPercentage)) + " %");
        }
        else {
            $("#stake-progress").css("display", "block");
            $("#take-progress").css("display", "block");
            $("#stake-progress").text("Redeeming in progress ");
            $("#take-progress").text("Redeeming in progress ");
        }
    }
    else {

        $("#stake-progress").css("display", "block");
        $("#take-progress").css("display", "block");
        $("#stake-progress").text("Deposits in progress " + Math.round(Number(depositPercentage)) + " %");
        $("#take-progress").text("Deposits in progress " + Math.round(Number(depositPercentage)) + " %");
    }

    return [depositPercentage, stakingPercentage];


}


//not used
async function loadStats() {


    displayProgress();
    let spinner = ' <i class="fa fa-spinner fa-spin" style="font-size:24px;color:green"></i></br>';

    $("#total-staked").html(spinner);



    let res = await loadJSON("Staking.json");

    let actual_JSON = JSON.parse(res);
    let contract = web3.eth.contract(actual_JSON["abi"]);
    let contractHandle = contract.at(stakingAddress);

    res = await loadJSON("Token.json");
    actual_JSON = JSON.parse(res);
    contract = web3.eth.contract(actual_JSON["abi"]);
    let tokenHandle = contract.at(tokenAddress);




    let stakedAmount = await promisify(cb => contractHandle.stakedAmount(cb));
    let deposits = await promisify(cb => contractHandle.deposits(account, cb));
    let released = await promisify(cb => contractHandle.released(account, cb));
    let stakingDateStart = await promisify(cb => contractHandle.stakingDateStart(cb));
    let stakingDateEnd = await promisify(cb => contractHandle.stakingDateEnd(cb));
    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));
    let rewards = await promisify(cb => contractHandle.totalReward(cb));
    let earningRatio = await promisify(cb => contractHandle.returnEarningRatio(cb));
    let earningsPerAmount = await promisify(cb => contractHandle.returnEarningsPerAmount(deposits, cb));
    let totalReleased = await promisify(cb => contractHandle.totalReleased(cb));
    let totalCancelled = await promisify(cb => contractHandle.totalCancelled(cb));
    let balanceOfStaking = await promisify(cb => tokenHandle.balanceOf(stakingAddress, cb));
    let balanceOfAUDT = await promisify(cb => tokenHandle.balanceOf(account, cb));



    // if (earningRatio > 10 * Math.pow(10,18))
    earningRatio = earningRatio / Math.pow(10, 18)

    let lengthOfEarningsRatio = earningRatio.toString().length;
    let toClaim = (Number(deposits) / Math.pow(10, 18) - (Number(released) / Number(earningRatio) / Math.pow(10, 18)));

    if (toClaim == 0)
        $("#redeem").attr("disabled", true);
    else
        $("#redeem").attr("disabled", false);




    $("#rewards").html(formatNumber(Number(rewards / Math.pow(10, 18))));
    $("#earning-ratio").html(Number(earningRatio));
    $("#to-claim").html(formatNumber(toClaim));
    $("#total-staked").html(formatNumber(Number(stakedAmount) / Math.pow(10, 18)));
    $("#your-contribution").html(formatNumber(Number(deposits) / Math.pow(10, 18)) + " AUDT");
    $("#return").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)));
    $("#current-block").html(formatNumber(Number(blockNumber)));
    $("#start-block").html(formatNumber(Number(stakingDateStart)));
    $("#end-block").html(formatNumber(Number(stakingDateEnd)));
    $("#total-released").html(formatNumber(Number(totalReleased) / Math.pow(10, 18)));
    $("#total-cancelled").html(formatNumber(Number(totalCancelled) / Math.pow(10, 18)));
    $("#contract-balance").html(formatNumber(Number(balanceOfStaking) / Math.pow(10, 18)));

    $("#token-balance").html(formatNumber(Number(balanceOfAUDT) / Math.pow(10, 18)));
    displayProgress
    $("#spinner").html("");

}


// not used
async function displayProgress(capsuleNumber) {

    let relativePercentageText;
    let relativeStakingPercentageText;
    let relativeRedeemPercentageText;
    let stakingPercentage;
    let relativeStakingPercentage;
    let relativeRedeemPercentage;
    let redeemPercentage;


    let res = await loadConfig("airdrop" + capsuleNumber + ".json");
    let actual_JSON = JSON.parse(res);
    const { STAKING_START_TIME, STAKING_END_TIME, DEPLOYMENT_TIME } = actual_JSON;
    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));


    let depositPercentage = (blockNumber - DEPLOYMENT_TIME) / (STAKING_START_TIME - DEPLOYMENT_TIME) * 100;
    let relativeDepositPercentage = Math.round(depositPercentage / 3);

    if (depositPercentage >= 100) {
        relativeDepositPercentage = 34;
        relativePercentageText = "100%";
        stakingPercentage = (blockNumber - STAKING_START_TIME) / (STAKING_END_TIME - STAKING_START_TIME) * 100;
        relativeStakingPercentage = Math.round(stakingPercentage / 3);
        $("#contribute").attr("disabled", true);
        if (stakingPercentage >= 100) {
            relativeStakingPercentageText = "100%";
            relativeStakingPercentage = 33;
            redeemPercentage = (blockNumber + 1 - STAKING_END_TIME) / (STAKING_END_TIME + 10000 - STAKING_END_TIME) * 100;
            relativeRedeemPercentage = Math.round(redeemPercentage / 3);
            relativeRedeemPercentageText = Math.round(redeemPercentage) + "%";


        } else {
            relativeStakingPercentageText = Math.round(stakingPercentage) + "%";
            relativeRedeemPercentageText = "";
        }
    } else {
        relativePercentageText = Math.round(depositPercentage) + "%";
        $("#contribute").attr("disabled", false);
    }




    $('#deposit-indicator ').css({ 'width': relativeDepositPercentage + "%" });
    $('#deposit-indicator ').text(relativePercentageText);
    $('#staking-indicator ').css({ 'width': relativeStakingPercentage + "%" });
    $('#staking-indicator ').text(relativeStakingPercentageText);

    $('#redeem-indicator ').css({ 'width': relativeRedeemPercentage + "%" });
    $('#redeem-indicator ').text(relativeRedeemPercentageText);




}

async function handleDeposit() {
    //  e.preventDefault();

    $("#message-status-body").html("");

    var sequence = Promise.resolve();

    sequence = sequence.then(function () {
        // return checkMetamaskStatus();

    })
        .then(function (res) {
            return preauthorizeAUDT();
        }).then(function (res, err) {
            return depositAUDT();
        }).then(function (res, err) {
            return loadPortfolio(selectedCapsule);

        }).catch(function (res) {

            console.log(res);
        })
}


function showTimeNotification(from, align, text) {

    let type = ['', 'info', 'success', 'warning', 'danger', 'rose', 'primary'];

    let color = Math.floor((Math.random() * 6) + 1);

    $.notify({
        icon: "notifications",
        message: text,
        allow_dismiss: true

    }, {
        type: type[color],
        timer: 1200,
        placement: {
            from: from,
            align: align
        }
    });
}


function preauthorizeAUDT(amount) {



    return new Promise(async function (resolve, reject) {



        let valueToStake, spendAddress, airdropAddress;



        let blockNum = await promisify(cb => web3.eth.getBlockNumber(cb));
        let res = await loadJSON("Token.json");
        let actual_JSON = JSON.parse(res);
        let contract = web3.eth.contract(actual_JSON["abi"]);
        let contractHandle = contract.at(tokenAddress);
        valueToStake = Number($("#staking-amount").val()) * Math.pow(10, 18);

        let id = progressAction("Pre authorizing AUDT tokens", 1, "", false, true);

        contractHandle.approve(stakingAddress, valueToStake, {
            from: account
        }, function (error, result) {
            if (!error) {
                console.log(result)

                let log = contractHandle.Approval({
                    owner: account,
                    spender: stakingAddress
                }, {
                    from: account,
                    fromBlock: blockNum,
                    toBlock: 'latest'
                });
                log.watch(async function (error, res) {

                    if (!error) {
                        progressAction("You have successfully authorized transfer of AUDT tokens", 2, id, false, false);
                        await promisify(cb => log.stopWatching(cb));
                    }
                    resolve(res);
                    log.stopWatching(function (error, res) { });
                });
            } else {
                console.error(error);
                reject(error);

            }
        });


    })


}

function depositAUDT() {

    return new Promise(async function (resolve, reject) {


        let blockNum = await promisify(cb => web3.eth.getBlockNumber(cb));

        let res = await loadJSON("Staking.json");

        let actual_JSON = JSON.parse(res);
        let contract = web3.eth.contract(actual_JSON["abi"]);
        let contractHandle = contract.at(stakingAddress);


        var valueToStake = $("#staking-amount").val() * Math.pow(10, 18);
        var logValues;
        var id = progressAction("Staking AUDT", 1, "", false, false);

        contractHandle.stake(valueToStake, {
            from: account
        }, function (error, result) {
            if (!error) {
                console.log(result)
                var log = contractHandle.LogStakingTokensIssued({
                    to: account,
                    amount: valueToStake
                }, {
                    from: account,
                    fromBlock: blockNum,
                    toBlock: 'latest'
                });
                log.watch(function (error, res) {
                    if (!error) {
                        logValues = res;

                        log.stopWatching(function (error, res) {

                            if (res) {
                                progressAction("You have successfully deposited AUDT tokens and  have received " + (logValues.args.amount / Math.pow(10, 18)).formatMoney(2, ".", ",") + " Staking Tokens.", 2, id, true);
                                resolve(res);
                                log.stopWatching(function (error, res) { });
                            }
                        });

                    } else {
                        console.error(error);
                        reject(error);
                    }
                });
            } else {
                console.error(error);
                reject(error);
            }
        });
    })
}


function redeem() {

    return new Promise(async function (resolve, reject) {


        let blockNum = await promisify(cb => web3.eth.getBlockNumber(cb));

        let res = await loadJSON("Staking.json");

        let actual_JSON = JSON.parse(res);
        let contract = web3.eth.contract(actual_JSON["abi"]);
        let contractHandle = contract.at(stakingAddress);


        var valueToRedeem = $("#taking-amount").val() * Math.pow(10, 18);
        var logValues;
        var id = progressAction("Redeeming AUDT", 1, "", false, true);

        contractHandle.redeem(valueToRedeem, {
            from: account
        }, function (error, result) {
            if (!error) {
                console.log(result)
                var log = contractHandle.LogTokensRedeemed({
                    to: account,
                    amount: valueToRedeem
                }, {
                    from: account,
                    fromBlock: blockNum,
                    toBlock: 'latest'
                });
                log.watch(function (error, res) {
                    if (!error) {
                        logValues = res;

                        log.stopWatching(function (error, res) {

                            if (res) {
                                progressAction("You have successfully returned " + stakingTokenSymbol + " tokens and  have received " + (logValues.args.amount / Math.pow(10, 18)).formatMoney(2, ".", ",") + " AUDT Tokens.", 2, id, true);
                                // loadStats();
                                resolve(res);
                            }
                        });

                    } else {
                        console.error(error);
                        reject(error);
                    }
                });
            } else {
                console.error(error);
                reject(error);
            }
        });
    })
}



function loadJSON(fileName, callback) {

    return new Promise(function (resolve, reject) {

        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', buildDir + fileName, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                //callback(xobj.responseText);
                resolve(xobj.responseText);
            }
        };
        xobj.send(null);
    })
}

function progressAction(msg, stage, id, last, first) {


    var spinner = ' <i class="fa fa-spinner fa-spin" style="font-size:28px;color:green"></i></br>';
    var check = ' <i class = "fa fa-check-circle-o" aria-hidden = "true" style="font-size:28px;color:green"> </i><br>';
    if (stage == 1) {
        var id = Math.floor((Math.random() * 1000) + 1);
        var message = msg + "<i id='" + id + "'>" + spinner + '</i>';
    } else if (stage == 2) {
        $('#' + id).html(check);
        message = msg + check
        if (last)
            message += 'Processing Done. ' + check;
    }
    if (first)
        $("#message-status-body").html("");
    $("#message-status-body").append(message);
    $("#progress").modal();
    return id;
}

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err)
            }

            resolve(res);
        })
    );

Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};


function formatNumber(number) {
    number = number.toFixed(0) + '';
    var x = number.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

// $(document).on('click', '#contribute', function (e) {
//     //prevent the form from doing a submit
//     // e.preventDefault();

//     handleAUDT();

// });

// $(document).on('onkeyup', "#staking-amount", function () {
//     $('#earned-amount').innerHTML = this.value;
// });


// select clicked project
$(document).on("click", "#mission-table tr", async function (e) {

    $("#noticeModal").toggle();
    $("#noticeModal").modal('hide');
    console.log($(e.currentTarget).index());

    selectedCapsule = $(e.currentTarget).index();
    $("#moonraker").html("MOONRAKER " + (selectedCapsule + 1));

    loadContracts(selectedCapsule + 1);
    loadPortfolio(selectedCapsule + 1)
    displayProgress(selectedCapsule + 1);
    // populatePoolTable(selectedCapsule + 1);


    // if ($(e.currentTarget).index() != 0) {
    //     $("#projects").find('tr').removeClass('selected');

    //     $(this).addClass('selected');
    // }
})



$(document).ready(function () {

    $(".enableEthereumButton").click(function () {
        getAccount();

    })

    $("#staking-amount").keyup(function () {

        earningRatio = 1 + ((Number(totalReward) * Math.pow(10, 18)) / (Number(stakedAmount) + (Number(this.value) * Math.pow(10, 18))) / Math.pow(10, 18));
        $('#stake-apr').text((Number(earningRatio)).formatMoney(2, ".", ",") + "%");


        $('#earned-amount').text(((Number(this.value) * earningRatio)).formatMoney(2, ".", ",") + " AUDT");


        if (Number(this.value) > Number(userHoldingsAUDT / Math.pow(10, 18))) {
            $("#msg-error-stake").css("background-color", "lightyellow");
            $("#msg-error-stake").html("You've exceeded number of available AUDT tokens.");
            $("#contribute").css("display", "none");
        }
        else {
            $("#msg-error-stake").css("background-color", "transparent");
            $("#msg-error-stake").html("");
            if (Number(this.value) > 0) {
                $("#contribute").css("display", "block");
                // $('#take-amount').text((Number(this.value)).formatMoney(2, ".", ",") + " AUDT");
            }
        }

        // if (this.value == "")
        //     $("#contribute").css("display", "none");
        // else
        //     $("#contribute").css("display", "block");

    });

    $("#taking-amount").keyup(function () {
        // $('#take-amount').text(((this.value * earningRatio) / Math.pow(10, 18)).formatMoney(2, ".", ",") + " AUDT");


        if (Number(this.value) > Number(receipts / Math.pow(10, 18))) {
            $("#msg-error-take").css("background-color", "lightyellow");
            $("#msg-error-take").html("You've exceeded number of available receipts");
            $("#take").css("display", "none");
        }
        else {
            $("#msg-error-take").css("background-color", "transparent");
            $("#msg-error-take").html("");
            if (Number(this.value) > 0) {
                $("#take").css("display", "block");
                $('#take-amount').text((Number(this.value)).formatMoney(2, ".", ",") + " AUDT");
            }
        }

        // if (this.value == "")
        //     $("#take").css("display", "none");
        // else
        //     $("#take").css("display", "block");

    });

    $("#contribute").click(function () {

        handleDeposit().then(function () {

        });
    });

    $("#take").click(function () {

        redeem().then(function () {
            return loadPortfolio(selectedCapsule);

        });
    });

    $("#change-mission").click(function () {
        $("#noticeModal").modal();
    });


})


