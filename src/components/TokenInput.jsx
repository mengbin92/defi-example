import React from "react";

/**
 * 代币输入组件
 */
export default function TokenInput({
  label,
  value,
  onChange,
  balance,
  onMax,
  disabled = false,
  placeholder = "0.0",
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {balance !== null && balance !== undefined && (
          <div className="text-sm text-gray-500">
            余额: {balance}
            {onMax && (
              <button
                onClick={onMax}
                className="ml-2 text-blue-500 hover:text-blue-700"
                disabled={disabled}
              >
                最大
              </button>
            )}
          </div>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
    </div>
  );
}

