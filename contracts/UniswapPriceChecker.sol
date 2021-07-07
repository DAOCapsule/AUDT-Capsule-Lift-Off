pragma solidity =0.8.0;
// SPDX-License-Identifier: MIT

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";


contract UniswapPriceChecker {
  address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;

  IUniswapV2Router02 public uniswapRouter;
  address AUDTToken;
  address stakingToken1;
  address stakingToken2;
  address stakingToken3;
  address stakingToken4;
  address governanceToken;
  address DAI;

  enum tokensList {ST1, ST2, ST3, ST4, Gov, AUDT}

  constructor(address _AUDTToken, address _stakingToken, address _governanceToken, address _DAI ) public {
    uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
    AUDTToken = _AUDTToken;
    stakingToken1 = _stakingToken;
    governanceToken = _governanceToken;
    DAI = _DAI;
  }

  function updateStakingTokens(tokensList position, address token) public {

    if (position == tokensList.ST2)
      stakingToken2 = token;
    else if (position == tokensList.ST3)
      stakingToken3 = token;
    else if (position == tokensList.ST4)
      stakingToken4 = token;
  }

  
  function getEstimatedTokenForDAI(uint tokenAmount, tokensList position) public view returns (uint[] memory) {
    return uniswapRouter.getAmountsIn(tokenAmount, getPathForTokenToDAI(position));
  }

  function getPathForTokenToDAI(tokensList position) private view returns (address[] memory) {
    address[] memory path = new address[](2);
    path[0] = DAI;
     if (position == tokensList.ST1)
      path[1] = stakingToken1;
    else if (position == tokensList.ST2)
      path[1] = stakingToken2;
    else if (position == tokensList.ST3)
      path[1] = stakingToken3;
    else if (position == tokensList.ST4)
      path[1] = stakingToken4;
    else if (position == tokensList.Gov)
      path[1] = governanceToken;
    else if (position == tokensList.AUDT)
      path[1] = AUDTToken;    
    return path;
  }
  

}