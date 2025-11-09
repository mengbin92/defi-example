# 快速启动指南

## 前置要求

1. **Node.js** (v16 或更高版本)
2. **MetaMask** 浏览器扩展
3. **本地节点** (Hardhat/Anvil) 或测试网 RPC

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

编辑 `src/utils/constants.js`:

```javascript
// 本地开发
export const RPC_URL = "http://localhost:8545";
export const CHAIN_ID = 31337;

// 或使用测试网
// export const RPC_URL = "https://sepolia.infura.io/v3/YOUR_KEY";
// export const CHAIN_ID = 11155111;
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 4. 连接钱包

1. 打开浏览器访问 `http://localhost:5173`
2. 点击右上角"连接钱包"按钮
3. 在 MetaMask 中确认连接

### 5. 使用借贷池

#### 存款
1. 确保钱包中有 ERC20Token 代币
2. 在"存款"区域输入金额
3. 点击"存款"按钮
4. 首次需要先 Approve，然后再次点击"存款"

#### 借款
1. 确保有足够的存款作为抵押品
2. 在"借款"区域输入金额
3. 点击"借款"按钮

#### 还款
1. 在"还款"区域输入金额
2. 点击"还款"按钮
3. 首次需要先 Approve

#### 提取
1. 在"提取"区域输入金额
2. 确保提取后仍满足抵押率要求
3. 点击"提取"按钮

## 本地开发设置

### 使用 Anvil (Foundry)

```bash
# 启动 Anvil
anvil

# 部署合约 (使用 Hardhat 或其他工具)
npx hardhat deploy --network localhost

# 更新合约地址
# 编辑 src/utils/constants.js 中的 CONTRACT_ADDRESSES
```

### 使用 Hardhat Node

```bash
# 启动 Hardhat 节点
npx hardhat node

# 在另一个终端部署合约
npx hardhat deploy --network localhost

# 更新合约地址
# 编辑 src/utils/constants.js 中的 CONTRACT_ADDRESSES
```

### MetaMask 配置

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 选择"添加网络"或"添加本地网络"
4. 配置:
   - 网络名称: Localhost 8545
   - RPC URL: http://localhost:8545
   - 链 ID: 31337
   - 货币符号: ETH

5. 导入测试账户私钥 (从 Anvil/Hardhat 输出中获取)

## 常见问题

### 1. 连接钱包失败

- 确保已安装 MetaMask
- 检查 MetaMask 是否已解锁
- 尝试刷新页面

### 2. 交易失败

- 检查是否有足够的 gas
- 确保有足够的代币余额
- 检查是否已 Approve (首次使用代币需要)

### 3. 数据不更新

- 等待几秒钟 (数据每 5 秒自动刷新)
- 手动刷新页面
- 检查网络连接

### 4. RPC 错误

- 检查 RPC URL 是否正确
- 确保本地节点正在运行
- 检查网络连接

## 下一步

- 查看 [README.md](./README.md) 了解更多信息
- 查看 [doc.md](./doc.md) 了解详细文档
- 查看合约源码在 `contracts/` 目录

