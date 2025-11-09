# DeFi Lending Pool Frontend

基于 React + ethers.js 构建的 DeFi 借贷池前端应用。

## 功能特性

- ✅ 钱包连接 (MetaMask)
- ✅ 借贷池操作 (存款、借款、还款、提取)
- ✅ 治理功能 (创建提案、投票)
- ✅ 实时数据更新
- ✅ 交易状态管理
- ✅ 错误处理与用户提示

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **ethers.js 5** - 以太坊交互库
- **Tailwind CSS** - 样式框架

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置合约地址

合约地址已配置在 `src/utils/constants.js` 中：

```javascript
export const CONTRACT_ADDRESSES = {
  ERC20Token: "0x3A220f351252089D385b29beca14e27F204c296A",
  LendingPool: "0xdB7d6AB1f17c6b31909aE466702703dAEf9269Cf",
  GovToken: "0x537e697c7AB75A26f9ECF0Ce810e3154dFcaaf44",
  SimpleGovernor: "0x880EC53Af800b5Cd051531672EF4fc4De233bD5d",
  RewardDistributor: "0x3Dc2cd8F2E345951508427872d8ac9f635fBe0EC",
};
```

### 3. 配置 RPC URL

在 `src/utils/constants.js` 中配置 RPC URL：

```javascript
export const RPC_URL = "http://localhost:8545"; // 本地开发
// 或
export const RPC_URL = "https://sepolia.infura.io/v3/YOUR_KEY"; // 测试网
```

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 5. 构建生产版本

```bash
npm run build
```

## 项目结构

```
defi-frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── ConnectButton.jsx
│   │   ├── TokenInput.jsx
│   │   ├── TxButton.jsx
│   │   ├── PoolPanel.jsx
│   │   └── GovernancePanel.jsx
│   ├── hooks/               # React Hooks
│   │   ├── useProvider.js
│   │   ├── useWallet.js
│   │   ├── useContract.js
│   │   └── useAsyncTx.js
│   ├── utils/               # 工具函数
│   │   ├── constants.js
│   │   └── format.js
│   ├── abis/                # 合约 ABI
│   │   ├── ERC20Token.json
│   │   ├── LendingPool.json
│   │   ├── GovToken.json
│   │   ├── SimpleGovernor.json
│   │   └── RewardDistributor.json
│   ├── App.jsx              # 主应用组件
│   ├── main.jsx             # 入口文件
│   └── index.css            # 全局样式
├── contracts/                # 智能合约源码
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 使用说明

### 连接钱包

1. 确保已安装 MetaMask 浏览器扩展
2. 点击右上角"连接钱包"按钮
3. 在 MetaMask 中确认连接

### 借贷池操作

#### 存款
1. 在"存款"区域输入金额
2. 点击"最大"按钮可填入全部余额
3. 点击"存款"按钮
4. 首次存款需要先 Approve，然后再次点击"存款"

#### 借款
1. 确保有足够的存款作为抵押品
2. 在"借款"区域输入金额（不能超过可用借款额度）
3. 点击"借款"按钮

#### 还款
1. 在"还款"区域输入金额
2. 点击"还款"按钮
3. 首次还款需要先 Approve

#### 提取
1. 在"提取"区域输入金额
2. 确保提取后仍满足抵押率要求
3. 点击"提取"按钮

### 治理功能

#### 创建提案
1. 确保有足够的治理代币（至少 10 GOV）
2. 填写提案描述
3. 输入目标合约地址
4. 输入 calldata（可以使用 ethers.js 的 Interface.encodeFunctionData() 生成）
5. 点击"创建提案"

#### 投票
1. 在提案列表中找到要投票的提案
2. 选择支持、反对或弃权
3. 点击"投票"按钮

## 本地开发

### 使用 Hardhat/Anvil 本地节点

1. 启动本地节点：

```bash
# 使用 Anvil (Foundry)
anvil

# 或使用 Hardhat
npx hardhat node
```

2. 部署合约到本地节点
3. 更新 `src/utils/constants.js` 中的合约地址
4. 在 MetaMask 中添加本地网络（http://localhost:8545）
5. 导入测试账户私钥

## 注意事项

- 所有交易都需要支付 gas 费用
- 首次使用代币需要先 Approve
- 确保网络连接正常
- 建议在测试网先测试

## 许可证

MIT

