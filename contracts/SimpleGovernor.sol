// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

/**
 * @title SimpleGovernor
 * @author DeFi Protocol Team
 * @notice 简化的治理合约，基于 OpenZeppelin Governor 实现
 * @dev 该合约实现了基本的治理功能，包括提案创建、投票和简单计数
 *      使用 ERC20Votes 代币进行投票，支持提案阈值和法定人数要求
 */
contract SimpleGovernor is Governor, GovernorCountingSimple, GovernorVotes {
    /**
     * @notice 构造函数，初始化治理合约
     * @param _token 用于投票的 ERC20Votes 代币合约
     */
    constructor(
        IVotes _token
    ) Governor("SimpleGovernor") GovernorVotes(_token) {}

    /**
     * @notice 获取投票延迟时间
     * @dev 提案创建后需要等待的区块数
     * @return 投票延迟时间（区块数）
     */
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }

    /**
     * @notice 获取投票期间长度
     * @dev 投票开始后持续的时间（区块数）
     * @return 投票期间长度（区块数）
     */
    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week
    }

    /**
     * @notice 获取法定人数要求
     * @dev 提案通过所需的最小投票权数量
     * @param 提案ID（未使用，但需要保持函数签名一致）
     * @return 法定人数要求（代币数量）
     */
    function quorum(uint256) public pure override returns (uint256) {
        return 100e18; // 100 GOV
    }

    /**
     * @notice 获取提案阈值
     * @dev 创建提案所需的最小投票权数量
     * @return 提案阈值（代币数量）
     */
    function proposalThreshold() public pure override returns (uint256) {
        return 10e18;
    }
}
