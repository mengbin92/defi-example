import { useState, useEffect, useCallback } from "react";

/**
 * Wallet Hook
 * 用于管理钱包连接状态
 * @param {ethers.providers.Provider} provider - Provider 实例
 * @returns {Object} 钱包相关状态和方法
 */
export function useWallet(provider) {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (!provider) {
      setAccount(null);
      setSigner(null);
      setChainId(null);
      return;
    }

    const init = async () => {
      try {
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const _signer = provider.getSigner();
          setSigner(_signer);
          const addr = await _signer.getAddress();
          setAccount(addr);
          const net = await provider.getNetwork();
          setChainId(net.chainId);
        } else {
          setAccount(null);
          setSigner(null);
        }
      } catch (e) {
        console.error("useWallet init error:", e);
        setAccount(null);
        setSigner(null);
      }
    };

    init();

    // 监听账户变化
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          init();
        } else {
          setAccount(null);
          setSigner(null);
        }
      };

      const handleChainChanged = () => {
        init();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) throw new Error("No provider");
    try {
      await provider.send("eth_requestAccounts", []);
      const _signer = provider.getSigner();
      setSigner(_signer);
      const addr = await _signer.getAddress();
      setAccount(addr);
      const net = await provider.getNetwork();
      setChainId(net.chainId);
    } catch (e) {
      console.error("Connect wallet error:", e);
      throw e;
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
  }, []);

  return { account, signer, chainId, connect, disconnect };
}

