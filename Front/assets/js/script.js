"use strict";



let buildDir, configDir, account, gasPrice, gasAmount, secondsInBlock, earningRatio, receipts, stakingTokenSymbol,
    stakedAmount, totalReward, userHoldingsAUDT, conversionUSD_AUDT = 10, userHoldingsGovToken,
    startBlock, endBlock, tokenAddress, stakingAddress, stakingReceipt, governanceToken, selectedCapsule = 1,
    govTokenRewardRatio, stakingStartTime, stakingEndTime, deploymentTime, deploymentStatus, chainId = "0x4";

    // chainId = "0x539"

async function init() {





    let test = ethereum.isMetaMask;
    // ethereum.autoRefreshOnNetworkChange = false;

    gasPrice = 20000000000;
    gasAmount = 4000000;
    secondsInBlock = 14.05;
    buildDir = "../../build/contracts/";
    configDir = "../../config/"
    selectedCapsule = 1;




    const ethereumButton1 = document.querySelector('.enableEthereumButton');
    const ethereumButton = document.querySelector('.enableEthereumButton');

    ethereum.on('accountsChanged', function (accounts) {
        // Time to reload your interface with accounts[0]!
        console.log("accounts:" + accounts);
        getAccount();
    });

    ethereum.on('chainChanged', function (chainIdCurrent) {
        // window.location.reload();
        if (chainIdCurrent != chainId) {
            showTimeNotification("top", "left", "You switched to unsupported network.");
            $(".enableEthereumButton").css("display", "none");
            $("#content").css("display", "none");

        } else
            if (typeof window.ethereum !== 'undefined') {
                console.log('MetaMask is installed!');
                // $("#tabs").css("display", "block");
    
                getAccount(1);
    
            }
        console.log("chain id:" + chainId);
    });



    if (typeof window.web3 === 'undefined') {
        showTimeNotification("top", "left", "Please enable metamask.");
        $(".content").css("display", "none");
        return;
    }
    else if (ethereum.selectedAddress == undefined && ethereum.chainId != chainId) {
        showTimeNotification("top", "left", "You are connected to unsupported network.");
        $(".content").css("display", "none");
        return;
    } else if (ethereum.chainId != chainId) {              
        showTimeNotification("top", "left", "You are connected to unsupported network.");
        $(".content").css("display", "none");
        return;
    }
    else {
        // $(".content").css("display", "block");
    }


    if (ethereum.selectedAddress != undefined) {
        console.log('MetaMask is installed!');
        // $(".content").css("display", "block");

        getAccount(1);

        // var interval = setInterval(function () {
        //     loadPortfolio(selectedCapsule).then(function (res, err) {
        //         return displayProgress(selectedCapsule);
        //     }).catch(function (res) {

        //         console.log(res);
        //     })
        // }, 10000);
    } else{
        $(".enableEthereumButton").css("display", "block");
        $(".content").css("display", "none");
    }
}


// For now, 'eth_accounts' will continue to always return an array
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== account) {
        account = accounts[0];
        // Do any other work!
    }
}

async function getAccount(capsuleNumber) {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    const showAccount = document.querySelector('.showAccount');
    // showAccount.innerHTML = account;
    // $("#address").html(account.substring(1, 10) + "...");
    // $("#address").css("display", "block");

    // loadStats();


    $(".enableEthereumButton").css("display", "none");

    // loadStats();
    loadContracts(1).then({

    }).then(function (res, err) {
        return loadPortfolio(selectedCapsule);
    }).then(function (res, err) {
        displayProgress(1);
    }).catch(function (res) {

        console.log(res);
    })
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
    const { AUDT_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS, STAKING_RECEIPT, GOVERNANCE_TOKEN_ADDRESS, GOVERNANCE_TOKEN_REWARD_RATIO,
        STAKING_START_TIME, STAKING_END_TIME, DEPLOYMENT_TIME, DEPLOYMENT_STATUS } = actual_JSON;

    tokenAddress = AUDT_TOKEN_ADDRESS;
    stakingAddress = STAKING_CONTRACT_ADDRESS;
    stakingReceipt = STAKING_RECEIPT;
    governanceToken = GOVERNANCE_TOKEN_ADDRESS;
    stakingEndTime = STAKING_END_TIME;
    stakingStartTime = STAKING_START_TIME;
    deploymentTime = DEPLOYMENT_TIME;
    deploymentStatus = DEPLOYMENT_STATUS;
    govTokenRewardRatio=GOVERNANCE_TOKEN_REWARD_RATIO;

}


async function populatePoolTable(capsuleNumber) {

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

    $("#tb-governance-token").html((Number(govTokenRewardRatio) * Number(receipts) / Math.pow(10, 36)).formatMoney(2, ".", ","));
    $("#tb-governance-token-usd").html((Number(govTokenRewardRatio) * Number(receipts) / Math.pow(10, 36) / conversionUSD_AUDT).formatMoney(2, ".", ","));

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
    // $("#taking-amount").attr("placeholder", "Enter amount of " + stakingTokenSymbol + " to redeem..");

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
        $("#staking-amount").attr("disabled", true);
    } else {
        $("#portfolio-value-to-take").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)) + " AUDT");
        $("#taking-amount").val(receipts / Math.pow(10, 18));
        // $("#taking-amount").attr("disabled", true);
        $("#staking-amount").attr("disabled", true);

        $("#take-amount").html(formatNumber(Number(earningsPerAmount) / Math.pow(10, 18)) + " AUDT");
        $("#take-apr").html((earningRatio / Math.pow(10, 18)).formatMoney(2, ".", ",") + "%");
        $("#take").css("display", "block");
    }

    $("#address").html(account.substring(1, 10) + "...");
    $("#holdings").html((Number(userHoldingsAUDT) / Math.pow(10, 18)).formatMoney(3, ".", ",") + " AUDT");
    $("#status").css("display", "block");
    $(".content").css("display", "block");

    populatePoolTable(selectedCapsule);
}



async function updateCampaignProgress() {

    let stakingPercentage;
    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));
    let depositPercentage = (blockNumber - deploymentTime) / (stakingStartTime - deploymentTime) * 100;

    if (depositPercentage >= 100) {
        stakingPercentage = (blockNumber - stakingStartTime) / (stakingEndTime - stakingStartTime) * 100;
        // $("#deposit-progress").css("display", "none");
        if (stakingPercentage <= 100) {
            $(".blink_me").css("display", "block");
            // $("#take-progress").css("display", "block");
            $(".blink_me").text("Staking in progress " + Math.round(Number(stakingPercentage)) + " %");
            // $("#take-progress").text("Staking in progress " + Math.round(Number(stakingPercentage)) + " %");
        }
        else {
            $(".blink_me").css("display", "block");
            // $("#take-progress").css("display", "block");
            $(".blink_me").text("Redeeming in progress ");
            // $("#take-progress").text("Redeeming in progress ");
        }
    }
    else {

        $(".blink_me").css("display", "block");
        // $("#take-progress").css("display", "block");
        $(".blink_me").text("Deposits in progress " + Math.round(Number(depositPercentage)) + " %");
        // $("#take-progress").text("Deposits in progress " + Math.round(Number(depositPercentage)) + " %");
    }

    return [depositPercentage, stakingPercentage];
}

async function displayProgress(capsuleNumber) {

    let relativePercentageText;
    let relativeStakingPercentageText;
    let relativeRedeemPercentageText;
    let stakingPercentage =0;
    let relativeStakingPercentage= 0;
    let relativeRedeemPercentage=0;
    let redeemPercentage=0;

    let blockNumber = await promisify(cb => web3.eth.getBlockNumber(cb));
    let depositPercentage = (blockNumber - deploymentTime) / (stakingStartTime - deploymentTime) * 100;
    let relativeDepositPercentage = Math.round(depositPercentage / 3);

    if (depositPercentage >= 100) {
        relativeDepositPercentage = 34;
        relativePercentageText = "100%";
        stakingPercentage = (blockNumber - stakingStartTime) / (stakingEndTime - stakingStartTime) * 100;
        relativeStakingPercentage = Math.round(stakingPercentage / 3)>34?34:Math.round(stakingPercentage / 3);
        $("#contribute").attr("disabled", true);
        if (stakingPercentage >= 100) {
            relativeStakingPercentageText = "100%";
            relativeStakingPercentage = 33;
            redeemPercentage = (blockNumber + 1 - stakingEndTime) / (stakingEndTime + 10000 - stakingEndTime) * 100;
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
    })
        .then(function (res) {
            return preauthorizeAUDT();
        }).then(function (res, err) {
            return depositAUDT();
        }).then(function (res, err) {
            return loadPortfolio(selectedCapsule);
        }).then(function (res, err) {
            return displayProgress(selectedCapsule);

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
        let valueToRedeem = $("#taking-amount").val() * Math.pow(10, 18);
        let logValues;
        let id = progressAction("Redeeming AUDT", 1, "", false, true);

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


// select clicked project
$(document).on("click", "#mission-table tr", async function (e) {

    console.log($(e.currentTarget).index());
    selectedCapsule = $(e.currentTarget).index();
    selectedCapsule++;
    let isDisabled = $('#m' + selectedCapsule).attr('disabled') ? true : false;


    

    if (!isDisabled) {

        $("#m" + selectedCapsule).prop("checked",true);
        $("#noticeModal").toggle();
        $("#noticeModal").modal('hide');

        $("#moonraker").html("MOONRAKER " + (selectedCapsule));
        loadContracts(selectedCapsule).then({

        }).then(function (res, err) {
            return loadPortfolio(selectedCapsule);

        }).then(function (res, err) {
            return displayProgress(selectedCapsule);

        }).catch(function (res) {

            console.log(res);
        })
    }
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

    });

    $("#taking-amount").keyup(function () {

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

    $("#change-mission").click(async function () {
        let res = await loadConfig("deploymentStatus.json");
        let actual_JSON = JSON.parse(res);
        const { DEPLOYMENT_STATUS_1, DEPLOYMENT_STATUS_2, DEPLOYMENT_STATUS_3, DEPLOYMENT_STATUS_4 } = actual_JSON;
        $("#capsule1-status").text(DEPLOYMENT_STATUS_1 ? "Deployed" : "NotDeployed");
        $("#capsule2-status").text(DEPLOYMENT_STATUS_2 ? "Deployed" : "NotDeployed");
        $("#capsule3-status").text(DEPLOYMENT_STATUS_3 ? "Deployed" : "NotDeployed");
        $("#capsule4-status").text(DEPLOYMENT_STATUS_4 ? "Deployed" : "NotDeployed");

        $("#m1").attr('disabled', DEPLOYMENT_STATUS_1 ? false : true);
        $("#m2").attr('disabled', DEPLOYMENT_STATUS_2 ? false : true);
        $("#m3").attr('disabled', DEPLOYMENT_STATUS_3 ? false : true);
        $("#m4").attr('disabled', DEPLOYMENT_STATUS_4 ? false : true);

        $("#noticeModal").modal();
    });


})


