import React, { useEffect, useState } from "react";
import { useAsyncTx } from "../hooks/useAsyncTx";
import { useContract } from "../hooks/useContract";
import { formatToken, parseToken, formatError } from "../utils/format";
import { CONTRACT_ADDRESSES } from "../utils/constants";
import ERC20TokenABI from "../abis/ERC20Token.json";
import LendingPoolABI from "../abis/LendingPool.json";
import TokenInput from "./TokenInput";
import TxButton from "./TxButton";

/**
 * 借贷池面板组件
 */
export default function PoolPanel({ signer, provider, account }) {
  const [tokenBalance, setTokenBalance] = useState("0");
  const [userDeposit, setUserDeposit] = useState("0");
  const [userBorrow, setUserBorrow] = useState("0");
  const [availableBorrow, setAvailableBorrow] = useState("0");
  const [totalDeposits, setTotalDeposits] = useState("0");
  const [totalBorrows, setTotalBorrows] = useState("0");
  const [availableLiquidity, setAvailableLiquidity] = useState("0");
  const [depositVal, setDepositVal] = useState("");
  const [borrowVal, setBorrowVal] = useState("");
  const [repayVal, setRepayVal] = useState("");
  const [withdrawVal, setWithdrawVal] = useState("");

  const { sendTx, pending, error, clearError } = useAsyncTx();

  const token = useContract(CONTRACT_ADDRESSES.ERC20Token, ERC20TokenABI, signer || provider);
  const pool = useContract(CONTRACT_ADDRESSES.LendingPool, LendingPoolABI, signer || provider);

  // 加载数据
  useEffect(() => {
    if (!token || !pool || !provider) return;

    let mounted = true;

    const load = async () => {
      try {
        // 总是加载池子统计数据
        const [totalDep, totalBor, liquidity] = await Promise.all([
          pool.totalDeposits().catch(() => "0"),
          pool.totalBorrows().catch(() => "0"),
          pool.getAvailableLiquidity().catch(() => "0"),
        ]);

        if (!mounted) return;

        setTotalDeposits(formatToken(totalDep));
        setTotalBorrows(formatToken(totalBor));
        setAvailableLiquidity(formatToken(liquidity));

        // 如果有账户,加载用户数据
        if (account) {
          const [balance, deposit, borrow, available] = await Promise.all([
            token.balanceOf(account).catch(() => "0"),
            pool.userDeposits(account).catch(() => "0"),
            pool.userBorrows(account).catch(() => "0"),
            pool.getAvailableBorrow(account).catch(() => "0"),
          ]);

          if (!mounted) return;

          setTokenBalance(formatToken(balance));
          setUserDeposit(formatToken(deposit));
          setUserBorrow(formatToken(borrow));
          setAvailableBorrow(formatToken(available));
        } else {
          // 没有账户时重置用户数据
          setTokenBalance("0");
          setUserDeposit("0");
          setUserBorrow("0");
          setAvailableBorrow("0");
        }
      } catch (e) {
        console.error("Load data error:", e);
      }
    };

    load();
    const interval = setInterval(load, 5000); // 每5秒刷新一次

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, pool, provider, account]);

  // 确保 allowance 足够
  const ensureAllowance = async (amount) => {
    if (!token || !pool || !signer || !account) return;

    const allowance = await token.allowance(account, CONTRACT_ADDRESSES.LendingPool);
    if (allowance.lt(amount)) {
      await sendTx(token.connect(signer).approve(CONTRACT_ADDRESSES.LendingPool, amount));
    }
  };

  // 存款
  const handleDeposit = async () => {
    if (!token || !pool || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      const amt = parseToken(depositVal);
      if (amt.lte(0)) {
        alert("请输入有效的金额");
        return;
      }

      await ensureAllowance(amt);
      await sendTx(pool.connect(signer).deposit(amt), () => {
        setDepositVal("");
        // 刷新数据
        setTimeout(() => window.location.reload(), 2000);
      });
    } catch (e) {
      console.error("Deposit error:", e);
      alert(formatError(e));
    }
  };

  // 借款
  const handleBorrow = async () => {
    if (!pool || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      const amt = parseToken(borrowVal);
      if (amt.lte(0)) {
        alert("请输入有效的金额");
        return;
      }

      await sendTx(pool.connect(signer).borrow(amt), () => {
        setBorrowVal("");
        setTimeout(() => window.location.reload(), 2000);
      });
    } catch (e) {
      console.error("Borrow error:", e);
      alert(formatError(e));
    }
  };

  // 还款
  const handleRepay = async () => {
    if (!token || !pool || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      const amt = parseToken(repayVal);
      if (amt.lte(0)) {
        alert("请输入有效的金额");
        return;
      }

      await ensureAllowance(amt);
      await sendTx(pool.connect(signer).repay(amt), () => {
        setRepayVal("");
        setTimeout(() => window.location.reload(), 2000);
      });
    } catch (e) {
      console.error("Repay error:", e);
      alert(formatError(e));
    }
  };

  // 提取
  const handleWithdraw = async () => {
    if (!pool || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      const amt = parseToken(withdrawVal);
      if (amt.lte(0)) {
        alert("请输入有效的金额");
        return;
      }

      await sendTx(pool.connect(signer).withdraw(amt), () => {
        setWithdrawVal("");
        setTimeout(() => window.location.reload(), 2000);
      });
    } catch (e) {
      console.error("Withdraw error:", e);
      alert(formatError(e));
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-4">借贷池</h2>

      {/* 池子统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">总存款</div>
          <div className="text-lg font-semibold">{totalDeposits}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">总借款</div>
          <div className="text-lg font-semibold">{totalBorrows}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">可用流动性</div>
          <div className="text-lg font-semibold">{availableLiquidity}</div>
        </div>
      </div>

      {/* 用户信息 */}
      {account && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">代币余额</div>
            <div className="text-lg font-semibold">{tokenBalance}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">我的存款</div>
            <div className="text-lg font-semibold">{userDeposit}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">我的借款</div>
            <div className="text-lg font-semibold">{userBorrow}</div>
            <div className="text-xs text-gray-500">可借: {availableBorrow}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          错误: {formatError(error)}
        </div>
      )}

      {/* 操作区域 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 存款 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">存款</h3>
          <TokenInput
            label="存款金额"
            value={depositVal}
            onChange={setDepositVal}
            balance={tokenBalance}
            onMax={() => setDepositVal(tokenBalance)}
            disabled={!account || pending}
          />
          <TxButton onClick={handleDeposit} disabled={!account} pending={pending}>
            存款
          </TxButton>
        </div>

        {/* 借款 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">借款</h3>
          <TokenInput
            label="借款金额"
            value={borrowVal}
            onChange={setBorrowVal}
            balance={availableBorrow}
            onMax={() => setBorrowVal(availableBorrow)}
            disabled={!account || pending}
          />
          <TxButton onClick={handleBorrow} disabled={!account} pending={pending}>
            借款
          </TxButton>
        </div>

        {/* 还款 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">还款</h3>
          <TokenInput
            label="还款金额"
            value={repayVal}
            onChange={setRepayVal}
            balance={userBorrow}
            onMax={() => setRepayVal(userBorrow)}
            disabled={!account || pending}
          />
          <TxButton onClick={handleRepay} disabled={!account} pending={pending}>
            还款
          </TxButton>
        </div>

        {/* 提取 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">提取</h3>
          <TokenInput
            label="提取金额"
            value={withdrawVal}
            onChange={setWithdrawVal}
            balance={userDeposit}
            onMax={() => setWithdrawVal(userDeposit)}
            disabled={!account || pending}
          />
          <TxButton onClick={handleWithdraw} disabled={!account} pending={pending}>
            提取
          </TxButton>
        </div>
      </div>
    </div>
  );
}

