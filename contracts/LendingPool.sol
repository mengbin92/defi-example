// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LendingPool
 * @author DeFi Protocol Team
 * @notice 简化的借贷池合约，支持存款、借款和还款功能
 * @dev 该合约实现了基本的借贷功能，使用 ERC20 代币作为抵押品和借贷资产
 *      注意：这是一个简化版本，生产环境需要添加利息计算、清算机制等
 */
contract LendingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice 借贷代币合约地址
    IERC20 public token;

    /// @notice 总存款量
    uint256 public totalDeposits;

    /// @notice 总借款量
    uint256 public totalBorrows;

    /// @notice 用户存款映射
    mapping(address => uint256) public userDeposits;

    /// @notice 用户借款映射
    mapping(address => uint256) public userBorrows;

    /// @notice 抵押率（例如：150% = 15000，表示需要 150% 的抵押品才能借款）
    uint256 public collateralRatio = 15000; // 150%

    /// @notice 最大借款率（例如：80% = 8000，表示最多可以借出存款的 80%）
    uint256 public maxBorrowRatio = 8000; // 80%

    /// @notice 治理地址（可以修改参数）
    address public governance;

    /// @notice 事件：存款
    event Deposit(address indexed user, uint256 amount);

    /// @notice 事件：借款
    event Borrow(address indexed user, uint256 amount);

    /// @notice 事件：还款
    event Repay(address indexed user, uint256 amount);

    /**
     * @notice 构造函数，初始化借贷池
     * @param _token 借贷代币合约地址
     */
    constructor(IERC20 _token) {
        token = _token;
        governance = msg.sender; // 初始治理地址为部署者
    }

    /**
     * @notice 修改治理地址（仅治理地址可调用）
     * @param _governance 新的治理地址
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "Only governance");
        governance = _governance;
    }

    /**
     * @notice 设置抵押率（仅治理地址可调用）
     * @param _ratio 新的抵押率（例如：20000 = 200%）
     */
    function setCollateralRatio(uint256 _ratio) external {
        require(msg.sender == governance, "Only governance");
        require(_ratio >= 10000, "Collateral ratio too low"); // 至少 100%
        collateralRatio = _ratio;
    }

    /**
     * @notice 设置最大借款率（仅治理地址可调用）
     * @param _ratio 新的最大借款率（例如：9000 = 90%）
     */
    function setMaxBorrowRatio(uint256 _ratio) external {
        require(msg.sender == governance, "Only governance");
        require(_ratio <= 10000, "Max borrow ratio too high"); // 最多 100%
        maxBorrowRatio = _ratio;
    }

    /**
     * @notice 存款到借贷池
     * @dev 用户将代币存入借贷池，获得存款凭证
     * @param amount 存款数量
     * @return 是否成功
     */
    function deposit(uint256 amount) external nonReentrant returns (bool) {
        require(amount > 0, "Amount must be greater than 0");

        // 从用户转移代币到合约
        token.safeTransferFrom(msg.sender, address(this), amount);

        // 更新状态
        userDeposits[msg.sender] += amount;
        totalDeposits += amount;

        emit Deposit(msg.sender, amount);
        return true;
    }

    /**
     * @notice 从借贷池借款
     * @dev 用户需要足够的抵押品才能借款
     * @param amount 借款数量
     * @return 是否成功
     */
    function borrow(uint256 amount) external nonReentrant returns (bool) {
        require(amount > 0, "Amount must be greater than 0");
        require(
            totalDeposits >= totalBorrows + amount,
            "Insufficient liquidity"
        );

        uint256 userDeposit = userDeposits[msg.sender];
        uint256 userBorrow = userBorrows[msg.sender];

        // 计算新的借款总额
        uint256 newBorrow = userBorrow + amount;

        // 检查抵押率：新借款总额 * 抵押率 <= 存款总额
        require(
            newBorrow * 10000 <= userDeposit * collateralRatio,
            "Insufficient collateral"
        );

        // 检查最大借款率：新借款总额 <= 存款总额 * 最大借款率
        require(
            newBorrow <= (userDeposit * maxBorrowRatio) / 10000,
            "Exceeds max borrow ratio"
        );

        // 更新状态
        userBorrows[msg.sender] = newBorrow;
        totalBorrows += amount;

        // 转移代币给用户
        token.safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, amount);
        return true;
    }

    /**
     * @notice 还款到借贷池
     * @dev 用户偿还借款，需要先 approve 代币给合约
     * @param amount 还款数量
     * @return 是否成功
     */
    function repay(uint256 amount) external nonReentrant returns (bool) {
        require(amount > 0, "Amount must be greater than 0");

        uint256 userBorrow = userBorrows[msg.sender];
        require(userBorrow >= amount, "Repay amount exceeds borrow");

        // 从用户转移代币到合约
        token.safeTransferFrom(msg.sender, address(this), amount);

        // 更新状态
        userBorrows[msg.sender] -= amount;
        totalBorrows -= amount;

        emit Repay(msg.sender, amount);
        return true;
    }

    /**
     * @notice 提取存款
     * @dev 用户提取存款，需要确保提取后仍满足借款的抵押率要求
     * @param amount 提取数量
     * @return 是否成功
     */
    function withdraw(uint256 amount) external nonReentrant returns (bool) {
        require(amount > 0, "Amount must be greater than 0");

        uint256 userDeposit = userDeposits[msg.sender];
        require(userDeposit >= amount, "Insufficient deposit");

        uint256 userBorrow = userBorrows[msg.sender];
        uint256 newDeposit = userDeposit - amount;

        // 如果有借款，检查提取后是否仍满足抵押率
        if (userBorrow > 0) {
            require(
                userBorrow * 10000 <= newDeposit * collateralRatio,
                "Withdrawal would violate collateral ratio"
            );
        }

        // 更新状态
        userDeposits[msg.sender] = newDeposit;
        totalDeposits -= amount;

        // 转移代币给用户
        token.safeTransfer(msg.sender, amount);

        return true;
    }

    /**
     * @notice 获取用户的可用借款额度
     * @param user 用户地址
     * @return 可用借款额度
     */
    function getAvailableBorrow(address user) external view returns (uint256) {
        uint256 userDeposit = userDeposits[user];
        uint256 userBorrow = userBorrows[user];

        // 基于抵押率计算最大可借额度
        uint256 maxBorrowByCollateral = (userDeposit * collateralRatio) / 10000;

        // 基于最大借款率计算最大可借额度
        uint256 maxBorrowByRatio = (userDeposit * maxBorrowRatio) / 10000;

        // 取两者较小值
        uint256 maxBorrow = maxBorrowByCollateral < maxBorrowByRatio
            ? maxBorrowByCollateral
            : maxBorrowByRatio;

        // 减去已有借款
        if (maxBorrow > userBorrow) {
            return maxBorrow - userBorrow;
        }
        return 0;
    }

    /**
     * @notice 获取池子的可用流动性
     * @return 可用流动性（总存款 - 总借款）
     */
    function getAvailableLiquidity() external view returns (uint256) {
        if (totalDeposits > totalBorrows) {
            return totalDeposits - totalBorrows;
        }
        return 0;
    }
}
