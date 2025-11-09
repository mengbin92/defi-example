// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Token
 * @author DeFi Protocol Team
 * @notice 用于借贷池的 ERC20 代币合约
 * @dev 这是一个简单的 ERC20 代币实现，用于借贷池的抵押品和借贷资产
 *      在部署时铸造初始供应量给部署者
 */
contract ERC20Token is ERC20 {
    /**
     * @notice 构造函数，初始化代币
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量（18 位小数）
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        // 铸造初始供应量给部署者
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice 铸造新代币
     * @dev 允许外部合约或地址铸造代币（用于测试和开发）
     * @param to 接收代币的地址
     * @param amount 铸造数量
     * @custom:security 在生产环境中，应该添加访问控制，只允许特定地址调用
     */
    function mint(address to, uint256 amount) external {
        // 在生产环境中，应该添加访问控制
        _mint(to, amount);
    }

    /**
     * @notice 销毁代币
     * @dev 允许用户销毁自己的代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
