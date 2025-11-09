import { formatUnits, parseUnits } from "ethers/lib/utils";

/**
 * 格式化代币数量（从 wei 转换为可读格式）
 * @param {BigNumber|string} value - 代币数量（wei）
 * @param {number} decimals - 小数位数，默认 18
 * @param {number} precision - 显示精度，默认 4
 * @returns {string} 格式化后的字符串
 */
export function formatToken(value, decimals = 18, precision = 4) {
  if (!value || value.toString() === "0") return "0";
  try {
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    return num.toFixed(precision).replace(/\.?0+$/, "");
  } catch (e) {
    return "0";
  }
}

/**
 * 解析代币数量（从可读格式转换为 wei）
 * @param {string} value - 代币数量字符串
 * @param {number} decimals - 小数位数，默认 18
 * @returns {BigNumber} 解析后的 BigNumber
 */
export function parseToken(value, decimals = 18) {
  if (!value || value === "") return parseUnits("0", decimals);
  try {
    return parseUnits(value, decimals);
  } catch (e) {
    return parseUnits("0", decimals);
  }
}

/**
 * 格式化地址（显示前6位和后4位）
 * @param {string} address - 以太坊地址
 * @returns {string} 格式化后的地址
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 格式化错误消息
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误消息
 */
export function formatError(error) {
  if (!error) return "未知错误";
  
  const message = error.message || error.toString();
  
  // 常见错误消息映射
  if (message.includes("user rejected")) {
    return "用户拒绝了交易";
  }
  if (message.includes("insufficient funds")) {
    return "余额不足";
  }
  if (message.includes("allowance")) {
    return "许可不足，请先 Approve";
  }
  if (message.includes("Insufficient collateral")) {
    return "抵押品不足";
  }
  if (message.includes("Insufficient liquidity")) {
    return "流动性不足";
  }
  if (message.includes("nonce")) {
    return "Nonce 错误，请刷新重试";
  }
  
  // 尝试提取 revert reason
  if (error.reason) {
    return error.reason;
  }
  
  if (error.error?.message) {
    return formatError(error.error);
  }
  
  if (error.data?.message) {
    return error.data.message;
  }
  
  return message;
}

