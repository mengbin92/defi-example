# 治理页面测试指南

## 前置要求

1. **治理代币余额**: 至少需要 10 GOV 才能创建提案
2. **投票权**: 需要先委托（delegate）治理代币给自己才能获得投票权
3. **目标合约**: 准备要治理的合约地址（如 LendingPool）

## 测试步骤

### 第一步：准备治理代币

#### 1.1 检查治理代币余额

1. 连接钱包
2. 切换到"治理"标签页
3. 查看"治理代币余额"
4. 确保至少有 10 GOV（提案阈值）

#### 1.2 委托代币给自己（重要！）

**注意**: ERC20Votes 代币需要先委托才能获得投票权！

在浏览器控制台执行：

```javascript
// 获取合约实例
const { ethers } = require('ethers');
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// GovToken ABI (需要包含 delegate 函数)
const govTokenABI = [
  "function delegate(address delegatee) external",
  "function getVotes(address account) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const govTokenAddress = "0xBAdc777C579B497EdE07fa6FF93bdF4E31793F24";
const govToken = new ethers.Contract(govTokenAddress, govTokenABI, signer);

// 委托给自己
const account = await signer.getAddress();
await govToken.delegate(account);
```

或者使用前端工具（见下文）。

### 第二步：生成 Calldata

#### 2.1 使用浏览器控制台生成

在浏览器控制台执行：

```javascript
const { ethers } = require('ethers');

// 示例：修改 LendingPool 的抵押率
const lendingPoolABI = [
  "function setCollateralRatio(uint256 _ratio) external"
];

const iface = new ethers.utils.Interface(lendingPoolABI);
const calldata = iface.encodeFunctionData("setCollateralRatio", [20000]); // 200%
console.log("Calldata:", calldata);
// 输出: 0x...

// 示例：修改最大借款率
const calldata2 = iface.encodeFunctionData("setMaxBorrowRatio", [9000]); // 90%
console.log("Calldata:", calldata2);
```

#### 2.2 常用治理操作示例

**修改抵押率** (setCollateralRatio):
```javascript
const iface = new ethers.utils.Interface([
  "function setCollateralRatio(uint256 _ratio) external"
]);
const calldata = iface.encodeFunctionData("setCollateralRatio", [20000]); // 200%
```

**修改最大借款率** (setMaxBorrowRatio):
```javascript
const iface = new ethers.utils.Interface([
  "function setMaxBorrowRatio(uint256 _ratio) external"
]);
const calldata = iface.encodeFunctionData("setMaxBorrowRatio", [9000]); // 90%
```

**修改治理地址** (setGovernance):
```javascript
const iface = new ethers.utils.Interface([
  "function setGovernance(address _governance) external"
]);
const newGovernance = "0x..."; // 新治理地址
const calldata = iface.encodeFunctionData("setGovernance", [newGovernance]);
```

### 第三步：创建提案

1. 在"治理"标签页，找到"创建提案"区域
2. 填写提案信息：
   - **提案描述**: 例如 "将抵押率从 150% 调整为 200%"
   - **目标合约地址**: `0x3CB5b6E26e0f37F2514D45641F15Bd6fEC2E0c4c` (LendingPool)
   - **Calldata**: 使用上面生成的 calldata
3. 点击"创建提案"
4. 在 MetaMask 中确认交易
5. 等待交易确认

**注意**: 
- 创建提案需要至少 10 GOV 的投票权
- 提案创建后需要等待 1 个区块（votingDelay）才能开始投票

### 第四步：查看提案

提案创建后，可以通过以下方式查看：

#### 4.1 使用浏览器控制台

```javascript
const governorABI = [
  "function proposalCount() external view returns (uint256)",
  "function state(uint256 proposalId) external view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
  "function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)"
];

const governorAddress = "0x90Ea96DBA5bbbb4D2F798C47FE23453054c0FAB4";
const governor = new ethers.Contract(governorAddress, governorABI, provider);

// 获取最新提案 ID（需要监听 ProposalCreated 事件）
// 或者手动记录创建提案时返回的 proposalId

// 查看提案状态
const proposalId = 1; // 替换为实际提案 ID
const state = await governor.state(proposalId);
console.log("Proposal State:", state); // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed

// 查看投票情况
const votes = await governor.proposalVotes(proposalId);
console.log("Votes:", votes);
```

#### 4.2 使用前端界面

前端界面会显示提案列表（如果已实现）。

### 第五步：投票

#### 5.1 投票选项

- **支持 (For)**: `support = 1`
- **反对 (Against)**: `support = 0`
- **弃权 (Abstain)**: `support = 2`

#### 5.2 投票步骤

1. 在提案列表中找到要投票的提案
2. 选择投票选项（支持/反对/弃权）
3. 点击"投票"按钮
4. 在 MetaMask 中确认交易
5. 等待交易确认

**注意**:
- 投票只能在提案处于 Active 状态时进行
- 投票后不能更改
- 需要足够的投票权（至少 1 GOV）

### 第六步：执行提案

#### 6.1 执行条件

提案执行需要满足以下条件：
1. 提案状态为 Succeeded（投票通过）
2. 达到法定人数（至少 100 GOV 投票）
3. 投票期已结束
4. 提案已排队（Queued）并等待执行

#### 6.2 执行步骤

1. 等待投票期结束
2. 检查提案状态是否为 Succeeded
3. 点击"执行提案"按钮
4. 在 MetaMask 中确认交易
5. 等待交易确认

**注意**:
- 执行提案需要支付 gas 费用
- 执行后提案状态变为 Executed
- 提案中的操作会在目标合约上执行

## 完整测试流程示例

### 测试场景：修改 LendingPool 抵押率

1. **准备阶段**:
   ```javascript
   // 1. 委托代币
   await govToken.delegate(account);
   
   // 2. 生成 calldata
   const iface = new ethers.utils.Interface([
     "function setCollateralRatio(uint256 _ratio) external"
   ]);
   const calldata = iface.encodeFunctionData("setCollateralRatio", [20000]);
   ```

2. **创建提案**:
   - 描述: "将抵押率从 150% 调整为 200%"
   - 目标: `0x3CB5b6E26e0f37F2514D45641F15Bd6fEC2E0c4c`
   - Calldata: 使用上面生成的 calldata

3. **投票**:
   - 等待 1 个区块后开始投票
   - 选择"支持"并投票

4. **执行**:
   - 等待投票期结束
   - 检查提案状态
   - 执行提案

5. **验证**:
   ```javascript
   const lendingPool = new ethers.Contract(
     "0x3CB5b6E26e0f37F2514D45641F15Bd6fEC2E0c4c",
     ["function collateralRatio() external view returns (uint256)"],
     provider
   );
   const ratio = await lendingPool.collateralRatio();
   console.log("New Collateral Ratio:", ratio.toString()); // 应该是 20000
   ```

## 常见问题

### Q1: 为什么无法创建提案？

**A**: 可能的原因：
- 治理代币余额不足（需要至少 10 GOV）
- 未委托代币（没有投票权）
- 检查提案阈值是否正确

### Q2: 为什么无法投票？

**A**: 可能的原因：
- 提案还未开始（需要等待 votingDelay）
- 提案已过期或已取消
- 没有投票权（需要先委托代币）

### Q3: 如何查看提案 ID？

**A**: 
- 创建提案时，交易日志中会包含 ProposalCreated 事件
- 可以使用事件监听器获取
- 或者手动记录创建提案的交易

### Q4: 提案执行失败怎么办？

**A**: 可能的原因：
- 提案未达到法定人数
- 提案未通过投票
- 目标合约执行失败
- 检查提案状态和错误信息

## 工具函数

### 委托代币

```javascript
async function delegateTokens(signer, govTokenAddress) {
  const govTokenABI = [
    "function delegate(address delegatee) external"
  ];
  const govToken = new ethers.Contract(govTokenAddress, govTokenABI, signer);
  const account = await signer.getAddress();
  const tx = await govToken.delegate(account);
  await tx.wait();
  console.log("Delegated successfully!");
}
```

### 生成 Calldata

```javascript
function generateCalldata(functionName, params, abi) {
  const iface = new ethers.utils.Interface(abi);
  return iface.encodeFunctionData(functionName, params);
}
```

### 查看提案状态

```javascript
async function getProposalState(governorAddress, proposalId, provider) {
  const governorABI = [
    "function state(uint256 proposalId) external view returns (uint8)"
  ];
  const governor = new ethers.Contract(governorAddress, governorABI, provider);
  const state = await governor.state(proposalId);
  const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
  return states[state];
}
```

## 注意事项

1. **委托代币**: ERC20Votes 代币必须委托才能获得投票权
2. **提案阈值**: 创建提案需要至少 10 GOV 的投票权
3. **法定人数**: 提案通过需要至少 100 GOV 的投票
4. **投票期**: 投票期为 45818 个区块（约 1 周）
5. **Gas 费用**: 所有操作都需要支付 gas 费用
6. **测试环境**: 建议先在本地测试网测试

