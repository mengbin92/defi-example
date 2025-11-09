import React from "react";

/**
 * 交易按钮组件
 */
export default function TxButton({
  onClick,
  disabled = false,
  pending = false,
  children,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        disabled || pending
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } ${className}`}
    >
      {pending ? "处理中..." : children}
    </button>
  );
}

