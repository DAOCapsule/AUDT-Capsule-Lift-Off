let Migrations = artifacts.require("./Migrations.sol");
// var DateTime =  artifacts.require("./DateTime.sol");
let Token =  artifacts.require("./Token.sol");
let StakingToken = artifacts.require("./StakingToken.sol"); 

module.exports = async function(deployer) {
  await deployer.deploy(Migrations);
  // await deployer.deploy(DateTime);
  // await deployer.link(DateTime, Token);
  await deployer.deploy(Token);
  await deployer.deploy(StakingToken, Token.address);
  
};
