import { useEffect, useState } from "react";
import { ethers } from "ethers";

/**
 * Provider Hook
 * 用于获取以太坊 Provider
 * @param {string} rpcUrl - RPC URL（可选，如果未提供则使用 window.ethereum）
 * @returns {ethers.providers.Provider|null} Provider 实例
 */
export function useProvider(rpcUrl) {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const p = new ethers.providers.Web3Provider(window.ethereum, "any");
      setProvider(p);
      return;
    }
    if (rpcUrl) {
      setProvider(new ethers.providers.JsonRpcProvider(rpcUrl));
    }
  }, [rpcUrl]);

  return provider;
}

