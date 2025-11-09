import React, { useState } from "react";
import { useProvider } from "./hooks/useProvider";
import { useWallet } from "./hooks/useWallet";
import { RPC_URL } from "./utils/constants";
import ConnectButton from "./components/ConnectButton";
import PoolPanel from "./components/PoolPanel";
import GovernancePanel from "./components/GovernancePanel";

function App() {
  const provider = useProvider(RPC_URL);
  const { account, signer, chainId, connect, disconnect } = useWallet(provider);
  const [activeTab, setActiveTab] = useState("pool");

  const handleConnect = async () => {
    try {
      await connect();
    } catch (e) {
      console.error("Connect error:", e);
      alert("连接钱包失败: " + (e.message || "未知错误"));
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">DeFi Lending Pool</h1>
            <ConnectButton
              account={account}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 提示信息 */}
        {!account && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              请先连接钱包以使用借贷池和治理功能
            </p>
          </div>
        )}

        {account && chainId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              已连接: {account} | 链 ID: {chainId.toString()}
            </p>
          </div>
        )}

        {/* 标签页 */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("pool")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pool"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              借贷池
            </button>
            <button
              onClick={() => setActiveTab("governance")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "governance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              治理
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        <div>
          {activeTab === "pool" && (
            <PoolPanel signer={signer} provider={provider} account={account} />
          )}
          {activeTab === "governance" && (
            <GovernancePanel signer={signer} provider={provider} account={account} />
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>DeFi Lending Pool - 基于 React + ethers.js 构建</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

