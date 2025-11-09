import { useState } from "react";

/**
 * Async Transaction Hook
 * 用于处理异步交易，包括 gas 估算、发送、等待、错误处理
 * @returns {Object} 交易相关状态和方法
 */
export function useAsyncTx() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const sendTx = async (txPromise, onReceipt) => {
    setError(null);
    setPending(true);
    try {
      const tx = await txPromise;
      // 如果 tx 是 TransactionResponse
      if (tx && tx.wait) {
        const receipt = await tx.wait();
        if (onReceipt) onReceipt(receipt);
        setPending(false);
        return receipt;
      } else {
        // 已经是 receipt 或结果
        setPending(false);
        if (onReceipt) onReceipt(tx);
        return tx;
      }
    } catch (e) {
      // 解析 revert 字符串
      let msg = e?.error?.message || e?.message || String(e);
      setError(msg);
      setPending(false);
      throw e;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return { sendTx, pending, error, clearError };
}

