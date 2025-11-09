// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovToken.sol";

/**
 * @title RewardDistributor
 * @author DeFi Protocol Team
 * @notice 奖励分发器合约，用于记录用户活动并分发治理代币奖励
 * @dev 该合约允许协议记录用户活动，累积奖励，并允许用户领取治理代币
 *      只有指定的协议地址可以调用 accrue 函数来记录奖励
 */
contract RewardDistributor {
    /// @notice 治理代币合约地址
    GovToken public gov;

    /// @notice 协议地址，只有该地址可以调用 accrue 函数
    address public protocol;

    /// @notice 用户累积的奖励映射
    mapping(address => uint256) public accrued;

    /**
     * @notice 构造函数，初始化奖励分发器
     * @param _gov 治理代币合约地址
     * @param _protocol 协议地址，用于权限控制
     */
    constructor(GovToken _gov, address _protocol) {
        gov = _gov;
        protocol = _protocol;
    }

    /**
     * @notice 记录用户活动并累积治理代币奖励
     * @dev 只有协议地址可以调用此函数，用于记录用户参与协议活动
     * @param user 用户地址
     * @param value 奖励的治理代币数量
     * @custom:security 只有 protocol 地址可以调用此函数
     */
    function accrue(address user, uint256 value) external {
        require(msg.sender == protocol, "not protocol");
        accrued[user] += value;
    }

    /**
     * @notice 领取累积的治理代币奖励
     * @dev 用户调用此函数来领取之前累积的所有奖励
     *      领取后，用户的累积奖励会被重置为 0
     * @custom:security 用户只能领取自己的奖励
     */
    function claim() external {
        uint256 amount = accrued[msg.sender];
        require(amount > 0, "no rewards");
        accrued[msg.sender] = 0;
        gov.mint(msg.sender, amount);
    }
}
