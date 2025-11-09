import { ethers } from "ethers";

/**
 * 生成治理操作的 calldata
 * @param {string} functionName - 函数名
 * @param {Array} params - 函数参数
 * @param {Array} abi - 合约 ABI
 * @returns {string} calldata (hex)
 */
export function generateCalldata(functionName, params, abi) {
  try {
    const iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData(functionName, params);
  } catch (e) {
    console.error("Generate calldata error:", e);
    throw e;
  }
}

/**
 * 常用治理操作的 calldata 生成器
 */
export const GovernanceActions = {
  /**
   * 修改 LendingPool 抵押率
   * @param {number} ratio - 抵押率 (例如: 20000 = 200%)
   * @returns {string} calldata
   */
  setCollateralRatio: (ratio) => {
    const abi = ["function setCollateralRatio(uint256 _ratio) external"];
    return generateCalldata("setCollateralRatio", [ratio], abi);
  },

  /**
   * 修改 LendingPool 最大借款率
   * @param {number} ratio - 最大借款率 (例如: 9000 = 90%)
   * @returns {string} calldata
   */
  setMaxBorrowRatio: (ratio) => {
    const abi = ["function setMaxBorrowRatio(uint256 _ratio) external"];
    return generateCalldata("setMaxBorrowRatio", [ratio], abi);
  },

  /**
   * 修改 LendingPool 治理地址
   * @param {string} newGovernance - 新治理地址
   * @returns {string} calldata
   */
  setGovernance: (newGovernance) => {
    const abi = ["function setGovernance(address _governance) external"];
    return generateCalldata("setGovernance", [newGovernance], abi);
  },
};

/**
 * 提案状态映射
 */
export const ProposalState = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
};

/**
 * 投票选项
 */
export const VoteOption = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

