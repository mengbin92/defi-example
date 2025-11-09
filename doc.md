# 第 12 课：前端 DApp 集成与用户交互（React + ethers.js 实战）

## 一、学习目标（本课结束你将能）

* 理解前端与智能合约交互的基本架构（Provider / Signer / Contract / Events / Off-chain indexer）。
* 用 `ethers.js` 在 React 中完成常见流程：Connect Wallet、Approve、Deposit、Borrow、Repay、提案/投票。
* 用 Hooks 抽象常用逻辑（useProvider/useSigner/useContract/useAsyncTx），实现整洁可复用的 UI 接口。
* 处理生产级问题：gas 估算、链切换、交易失败回滚、乐观 UI、事件订阅。
* 本地测试、集成、部署到 Vercel/Netlify 的要点。

---

## 二、架构概览与设计要点

推荐架构（前端单页 / React）：

* `Provider` 层（ethers Provider / Signer）

  * Read-only provider（RPC）用于链上数据读取
  * Signer provider（Metamask / WalletConnect）用于签名 tx
* `Contracts` 层

  * 抽象合同实例，按 network + address + ABI 组织
* `State` 层（React Context / Zustand / Redux）

  * 存放 wallet、chain、常用合约实例、用户余额、交易队列
* `UI` 层

  * 小组件：ConnectButton、TokenInput、TxButton、Modal、Notifications
  * 页面：Pool、Borrow、Dashboard、Governance
* 可选后端（indexer / subgraph / TheGraph / Moralis）用于复杂查询与历史数据（避免前端频繁做 RPC scans）

设计要点（工程角度）：

* 把所有链交互封装在 Hook 中（便于测试与替换）
* 所有交易使用统一 `sendTx` 函数，负责：gas 估算、签名、等待、回滚、通知、重试策略
* 事件监听做防抖与去重（event logs 可能重复）
* 对 ERC20：始终做 `allowance` 检查并把 `approve` 做成 UX 流程（2 步：approve -> action）
* UI 对失败场景友好提示：revert message、nonce 溢出、insufficient funds、approval needed
* 支持链切换（提示用户切换到目标 chain 并尝试 programmatic switch）

---

## 三、核心前端概念（详细解释）

### Provider / Signer / Contract

* **Provider**：只读的链连接（JsonRpcProvider），用于 read calls（balanceOf、totalDeposits）。
* **Signer**：代表用户签名交易（window.ethereum.getSigner()）。
* **Contract**：ethers.Contract(providerOrSigner)；用 provider 调 read、用 signer 调写 tx。

### ERC20 流程（常见误区）

* 在调用 `pool.deposit()`（合约从用户 `transferFrom` 取款）前，必须 `token.approve(pool, amount)`。
* 把 `approve` 的 gas 和等待纳入 UX（显示 pending、等待 confirmations）。
* 有时 approve 需要先将 allowance 设为 0 再设新值以支持某些 ERC20（老代币 bug），但大多数现代代币支持直接设定。

### 事件监听 vs 轮询

* 事件监听（`contract.on('Deposit', handler)`）低延迟，但在断线/刷新后可能丢失历史事件 → 后端 indexer 或 RPC `getLogs` 补偿。
* 生产环境：结合 indexer（TheGraph）与事件监听，监听做 UX 推送，indexer 做页面历史展示与分页。

### Gas 估算与用户体验

* 使用 `contract.estimateGas.functionName(...args)` 做估算；若估算失败（revert），在前端要捕获错误并显示可读提示。
* 对于复杂交易（多合约调用、重入可能），预估 gas 加安全系数（1.2x）并用 `gasLimit` 提交，避免因网络费用波动导致失败。

### Error/ Revert 处理

* Ethers 抛出的错误 message 常常包含 JSON RPC 数据，解析方式要 robust（有时 revert message 在 `error.error.message` 或 `error.data` 下）。
* 把 revert 显示成可理解文本，如“存款失败：余额不足”或“许可不足，请先 Approve”。

---

## 四、实战：文件结构（推荐）

```
frontend/
├─ package.json
├─ src/
│  ├─ App.jsx
│  ├─ index.jsx
│  ├─ hooks/
│  │  ├─ useProvider.js
│  │  ├─ useContract.js
│  │  ├─ useWallet.js
│  │  └─ useAsyncTx.js
│  ├─ components/
│  │  ├─ ConnectButton.jsx
│  │  ├─ TokenInput.jsx
│  │  ├─ TxButton.jsx
│  │  ├─ PoolPanel.jsx
│  │  └─ GovernancePanel.jsx
│  ├─ utils/
│  │  ├─ constants.js
│  │  └─ format.js
│  └─ abis/
│     ├─ LendingPool.json
│     └─ GovToken.json
└─ tailwind.config.js
```

---

## 五、关键代码（可直接复制运行）

下面给出最关键的 Hook 和组件实现：`useProvider`、`useWallet`、`useContract`、`useAsyncTx`、以及一个 `PoolPanel`（deposit/borrow）组件。代码尽量短而完整，省去样式细节，但功能齐全。

> 依赖：`ethers`、`react`。命令：
>
> ```
> npm init -y
> npm install react react-dom ethers
> ```

### 1) `src/hooks/useProvider.js`

```javascript
import { useEffect, useState } from "react";
import { ethers } from "ethers";

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
```

### 2) `src/hooks/useWallet.js`

```javascript
import { useState, useEffect, useCallback } from "react";

export function useWallet(provider) {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (!provider) { setAccount(null); setSigner(null); return; }
    const init = async () => {
      try {
        const _signer = provider.getSigner();
        setSigner(_signer);
        const addr = await _signer.getAddress().catch(()=>null);
        setAccount(addr);
        const net = await provider.getNetwork();
        setChainId(net.chainId);
      } catch (e) {
        setAccount(null);
      }
    };
    init();
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) throw new Error("No provider");
    await provider.send("eth_requestAccounts", []);
    const _signer = provider.getSigner();
    setSigner(_signer);
    setAccount(await _signer.getAddress());
    setChainId((await provider.getNetwork()).chainId);
  }, [provider]);

  return { account, signer, chainId, connect, setSigner };
}
```

### 3) `src/hooks/useContract.js`

```javascript
import { useMemo } from "react";
import { ethers } from "ethers";

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
```

### 4) `src/hooks/useAsyncTx.js`

统一发送 tx 的 hook：估 gas、发送、等待、通知。

```javascript
import { useState } from "react";

export function useAsyncTx() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const sendTx = async (txPromise, onReceipt) => {
    setError(null); setPending(true);
    try {
      const tx = await txPromise;
      // if tx is a TransactionResponse
      if (tx.wait) {
        const receipt = await tx.wait();
        if (onReceipt) onReceipt(receipt);
        setPending(false);
        return receipt;
      } else {
        // already receipt-like
        setPending(false);
        return tx;
      }
    } catch (e) {
      // parse revert string
      let msg = e?.error?.message || e?.message || String(e);
      setError(msg);
      setPending(false);
      throw e;
    }
  };

  return { sendTx, pending, error };
}
```

### 5) `src/components/PoolPanel.jsx`

示例：展示 pool stats 并提供 deposit/borrow/repay flow（ERC20）。

```javascript
import React, { useEffect, useState } from "react";
import { useAsyncTx } from "../hooks/useAsyncTx";
import { useContract } from "../hooks/useContract";
import { formatUnits, parseUnits } from "ethers/lib/utils";

export default function PoolPanel({ signer, provider, tokenAddress, tokenAbi, poolAddress, poolAbi }) {
  const [balance, setBalance] = useState("0");
  const [depositVal, setDepositVal] = useState("");
  const [borrowVal, setBorrowVal] = useState("");
  const { sendTx, pending, error } = useAsyncTx();

  const token = useContract(tokenAddress, tokenAbi, signer || provider);
  const pool = useContract(poolAddress, poolAbi, signer);

  useEffect(() => {
    if (!token || !pool || !provider) return;
    let mounted = true;
    const load = async () => {
      try {
        const [b, td, tb] = await Promise.all([
          token.balanceOf(await provider.getSigner().getAddress()).catch(()=>0),
          pool.totalDeposits().catch(()=>0),
          pool.totalBorrows().catch(()=>0)
        ]);
        if (!mounted) return;
        setBalance(formatUnits(b, 18));
        // you can set pool summary state here
      } catch(e) { console.error(e) }
    };
    load();
    return () => { mounted = false; };
  }, [token, pool, provider]);

  // Approve-then-deposit flow
  const handleDeposit = async () => {
    if (!token || !pool) return alert("connect first");
    const amt = parseUnits(String(depositVal || "0"), 18);
    try {
      // check allowance
      const me = await provider.getSigner().getAddress();
      const allowance = await token.allowance(me, poolAddress);
      if (allowance.lt(amt)) {
        // call approve
        await sendTx(token.connect(signer).approve(poolAddress, amt), ()=>{});
      }
      // now call deposit
      await sendTx(pool.deposit(amt), (r)=>{ console.log("deposit done", r); });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBorrow = async () => {
    if (!pool) return;
    const amt = parseUnits(String(borrowVal || "0"), 18);
    await sendTx(pool.borrow(amt));
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Pool</h3>
      <div className="mt-2">Your token balance: {balance}</div>
      <div className="mt-3">
        <input value={depositVal} onChange={(e)=>setDepositVal(e.target.value)} placeholder="Deposit amount" />
        <button disabled={pending} onClick={handleDeposit}>Deposit</button>
      </div>
      <div className="mt-3">
        <input value={borrowVal} onChange={(e)=>setBorrowVal(e.target.value)} placeholder="Borrow amount" />
        <button disabled={pending} onClick={handleBorrow}>Borrow</button>
      </div>
      {error && <div className="text-red-500 mt-2">Error: {error}</div>}
    </div>
  );
}
```

> 注：上述示例中 `tokenAbi`/`poolAbi`需按实际 ABI 填写。实际 production 建议把 `approve` 封装成独立的 `ensureAllowance(token,pool,amount)` 函数，做并发锁与重试。

---

## 六、治理页面（简化示例）

Governance 通常用 OpenZeppelin `Governor`，前端要支持列提案、创建提案、投票、查看状态。要点：

* 提案的 calldata 要么在后端生成（更安全），要么前端提供 UI 表单并生成 ABI-encoded calldata（复杂）。
* 投票时前端需检查用户的 `votingPower`（ERC20Votes 的 snapshot），并提示是否已委托（delegate）。

简化：用 `governor.propose([...])` + `governor.castVote(proposalId, support)` 即可。编码 calldata 的 helper：`new ethers.utils.Interface([abi]).encodeFunctionData("setReserveFactor", [2000])`。

---

## 七、测试与本地开发

本地开发建议流程：

1. 使用 Foundry / Hardhat 部署合约到本地节点（Anvil / Hardhat node）。
2. 启动前端指向本地 RPC（`http://localhost:8545`）。
3. 用 `wallet`（metamask）添加本地网络并导入私钥（anvil 给的 dev keys）。
4. 在前端用 `provider.send("eth_requestAccounts", [])` 连接钱包并开始交互。

常见调试技巧：

* 在前端打印 transaction receipt（`tx.hash`、`receipt.status`、`logs`）。
* 对 revert：在本地先用 `contract.callStatic.function(...args)` 模拟执行以查看是否会 revert（callStatic 会返回错误 detail）。
* 使用 `hardhat console` / `forge` 调用验证步骤。

---

## 八、生产部署与运维要点

1. **RPC / Rate limits**：生产不要只依赖公共节点（Infura/Alchemy）。使用自建节点或多 provider fallback，并实现 rate limit/backoff。
2. **Indexing**：事件历史与复杂查询依赖 TheGraph 或自建 indexer（避免前端做大量 `getLogs`）。
3. **Relayers / Keepers**：设计 Keeper 激励（例如执行 `accrue`, `liquidate` 的交易奖励）。Keepers 可由后端触发，前端显示状态。
4. **Monitoring**：交易失败率、gas spikes、bridge latency、oracle deltas 都需要监控并告警。
5. **Feature flags / A/B**：通过后端/feature-flag 管理新功能 rollout，避免前端直接暴露危险操作。
6. **Rate-limited actions**：对高频操作做 debounce/rate-limit 并提示用户（避免重复发 tx 导致 nonce 混乱）。

---

## 九、安全与 UX 最佳实践（实战建议）

* **钱包交互明确化**：在每次发送 tx 前弹出确认，显示 gas estimate、nonce、预期链上变化（余额、shares 等）。
* **乐观 UI**：在 tx pending 时展示乐观变化（例如 “预计存款 +100”），但后台需在 tx confirmed 后矫正。
* **失败回滚提示**：把 revert message 解析成用户友好文本并提供解决建议（“approve needed / insufficient allowance”）。
* **避免隐式批准**：对 `approve` 做逐步确认（用户知道为什么需要 approve）。
* **安全显示**：不要在前端保存私钥、不要把敏感 ABI/action 嵌入公共 CDN（易被篡改）。
* **硬件钱包支持**：测试 Ledger / Trezor 的签名流程（一些硬件在多合约调用时拒签）。
* **Accessibility**：按钮要大、颜色对比要足、键盘可访问。

---

## 十、优化点（进阶）

* **Meta-transactions / Gasless UX**：通过 relayer/biconomy 支持 gasless tx，降低入门门槛。需要后端 relayer 签名与 gas 补偿逻辑。
* **Batching**：将 approve + action 合并成一个 meta-tx（后端或合约支持）减少钱包弹窗次数。
* **Optimistic Updates + Queues**：为同一用户维护本地 pending tx 队列与 nonce 管理，避免并发冲突。
* **Front-run / MEV防护**：对关键操作（提案、清算）考虑 private mempool 或执行延时来降低被抢跑风险。

---

## 十一、完整项目启动（示例）

1. 新建 React app（Vite）：

```bash
npm create vite@latest defi-frontend -- --template react
cd defi-frontend
npm install
npm install ethers
```

2. 放入上面 hooks & components，填入合约地址与 ABI（`src/abis/*.json`）。

3. 本地 RPC（Anvil / Hardhat）:

```bash
# anvil (foundry)
anvil

# or hardhat node
npx hardhat node
```

4. 启动前端：

```bash
npm run dev
# 打开 http://localhost:5173
```

5. 将钱包（Metamask）切换到本地节点并导入私钥（Anvil 提供的），然后 Connect Wallet。

---

## 十二、作业与扩展建议

1. 把 `useAsyncTx` 增强为支持：gasEstimate fallback、nonce queue、pending toast、retry。写单元测试覆盖失败场景。
2. 集成 TheGraph（或自建 indexer）来显示所有用户的历史 deposit/borrow/liquidation，用分页加载。
3. 做一个完整的 Governance UI：提案创建表单（可选择 target function）、投票历史、统计图表（投票率、支持率）。
4. 实现 mobile-friendly UX 并做 Lighthouse 性能优化（首屏渲染、RPC calls 节流）。
5. 在前端实现一个 Keeper 控制台（离线签名 + relayer）来触发 `accrueInterest` 与 `liquidate`，并记录回报。

---

## 十三、结语

第 12 课把链上合约与真实用户连接起来：**一个稳健的 DApp 不仅仅是漂亮 UI，而是正确的链交互、清晰的交易反馈、容错的错误处理和可扩展的后端支持**。上面的 Hooks、组件和工程流能快速支撑教学项目与原型开发；要做成生产级产品，还需要把 RPC 冗余、indexer、relayer、监控、合规与安全流程逐步补全。
