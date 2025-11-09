// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title GovToken
 * @author DeFi Protocol Team
 * @notice 治理代币合约，继承 ERC20Votes 功能，支持投票治理
 * @dev 该合约实现了 ERC20Votes 标准，允许代币持有者参与协议治理
 *      代币可以通过奖励分发器进行铸造，用于激励用户参与协议
 */
contract GovToken is ERC20Votes {
    /**
     * @notice 构造函数，初始化治理代币
     * @dev 铸造 1,000,000 个代币给部署者，并设置 EIP712 域名
     *      ERC20Votes 继承自 ERC20Permit，需要传递名称给 ERC20Permit
     */
    constructor()
        ERC20("Governance Token", "GOV")
        ERC20Permit("Governance Token")
    {
        _mint(msg.sender, 1_000_000e18);
    }

    /**
     * @notice 铸造新代币用于奖励分发
     * @dev 该函数允许外部合约铸造代币，主要用于奖励分发器
     * @param to 接收代币的地址
     * @param amount 铸造的代币数量
     * @custom:security 在实际部署中，应该添加访问控制，只允许特定的分发器合约调用
     */
    function mint(address to, uint256 amount) external {
        // 在实际部署中，应该添加访问控制，只允许特定的分发器合约调用
        _mint(to, amount);
    }
}
