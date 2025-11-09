import { useMemo } from "react";
import { ethers } from "ethers";

/**
 * Contract Hook
 * 用于创建合约实例
 * @param {string} address - 合约地址
 * @param {Array} abi - 合约 ABI
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider 或 Signer
 * @returns {ethers.Contract|null} 合约实例
 */
export function useContract(address, abi, providerOrSigner) {
  return useMemo(() => {
    if (!address || !abi || !providerOrSigner) return null;
    try {
      return new ethers.Contract(address, abi, providerOrSigner);
    } catch (e) {
      console.error("useContract error", e);
      return null;
    }
  }, [address, abi, providerOrSigner]);
}

