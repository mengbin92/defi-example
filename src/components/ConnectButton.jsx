import React from "react";
import { formatAddress } from "../utils/format";

/**
 * 连接钱包按钮组件
 */
export default function ConnectButton({ account, onConnect, onDisconnect }) {
  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-2 bg-green-100 text-green-800 rounded">
          {formatAddress(account)}
        </span>
        <button
          onClick={onDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          断开连接
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      连接钱包
    </button>
  );
}

