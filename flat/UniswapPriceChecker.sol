pragma solidity 0.6.12;

interface IUniswapV2Router01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

// SPDX-License-Identifier: MIT




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

  // function convertEthToDai(uint daiAmount) public payable {
  //   uint deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!
  //   uniswapRouter.swapETHForExactTokens{ value: msg.value }(daiAmount, getPathForETHtoDAI(), address(this), deadline);
    
  //   // refund leftover ETH to user
  //   (bool success,) = msg.sender.call{ value: address(this).balance }("");
  //   require(success, "refund failed");
  // }
  
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