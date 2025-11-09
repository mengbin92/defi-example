import React, { useEffect, useState } from "react";
import { useAsyncTx } from "../hooks/useAsyncTx";
import { useContract } from "../hooks/useContract";
import { formatToken, formatError } from "../utils/format";
import { CONTRACT_ADDRESSES } from "../utils/constants";
import GovTokenABI from "../abis/GovToken.json";
import SimpleGovernorABI from "../abis/SimpleGovernor.json";
import { ethers } from "ethers";
import TxButton from "./TxButton";
import { GovernanceActions, ProposalState, VoteOption } from "../utils/governance";

/**
 * 治理面板组件
 */
export default function GovernancePanel({ signer, provider, account }) {
  const [govBalance, setGovBalance] = useState("0");
  const [votingPower, setVotingPower] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [proposalThreshold, setProposalThreshold] = useState("0");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalTarget, setProposalTarget] = useState("");
  const [proposalCalldata, setProposalCalldata] = useState("");
  const [calldataAction, setCalldataAction] = useState("setCollateralRatio");
  const [calldataParam, setCalldataParam] = useState("");
  const [showCalldataHelper, setShowCalldataHelper] = useState(false);
  const [showAllProposals, setShowAllProposals] = useState(false);

  const { sendTx, pending, error, clearError } = useAsyncTx();

  const govToken = useContract(CONTRACT_ADDRESSES.GovToken, GovTokenABI, signer || provider);
  const governor = useContract(CONTRACT_ADDRESSES.SimpleGovernor, SimpleGovernorABI, signer || provider);

  // 加载数据
  useEffect(() => {
    if (!govToken || !governor) return;

    const load = async () => {
      try {
        // 总是加载提案阈值
        const threshold = await governor.proposalThreshold().catch(() => "0");
        setProposalThreshold(formatToken(threshold));

        // 如果有账户,加载用户数据
        if (account) {
          const [balance, power] = await Promise.all([
            govToken.balanceOf(account).catch(() => "0"),
            govToken.getVotes(account).catch(() => "0"),
          ]);

          setGovBalance(formatToken(balance));
          setVotingPower(formatToken(power));
        } else {
          // 没有账户时重置用户数据
          setGovBalance("0");
          setVotingPower("0");
        }
      } catch (e) {
        console.error("Load governance data error:", e);
      }
    };

    load();
    const interval = setInterval(load, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, [govToken, governor, account]);

  // 创建提案
  const handleCreateProposal = async () => {
    if (!governor || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();

      if (!proposalTarget || !proposalCalldata || !proposalDescription) {
        alert("请填写完整的提案信息");
        return;
      }

      const targets = [proposalTarget];
      const values = [0];
      const calldatas = [proposalCalldata];

      await sendTx(
        governor.connect(signer).propose(targets, values, calldatas, proposalDescription),
        () => {
          setProposalDescription("");
          setProposalTarget("");
          setProposalCalldata("");
          alert("提案创建成功！");
          loadProposals();
        }
      );
    } catch (e) {
      console.error("Create proposal error:", e);
      alert(formatError(e));
    }
  };

  // 投票
  const handleVote = async (proposalId, support) => {
    if (!governor || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      // 使用 castVote 函数，它只需要 proposalId 和 support 两个参数
      await sendTx(governor.connect(signer).castVote(proposalId, support), () => {
        alert("投票成功！");
        loadProposals();
      });
    } catch (e) {
      console.error("Vote error:", e);
      alert(formatError(e));
    }
  };

  // 执行提案
  const handleExecute = async (proposalId) => {
    if (!governor || !signer) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      await sendTx(governor.connect(signer).execute(proposalId), () => {
        alert("提案执行成功！");
        loadProposals();
      });
    } catch (e) {
      console.error("Execute proposal error:", e);
      alert(formatError(e));
    }
  };

  // 委托代币
  const handleDelegate = async () => {
    if (!govToken || !signer || !account) {
      alert("请先连接钱包");
      return;
    }

    try {
      clearError();
      await sendTx(govToken.connect(signer).delegate(account), () => {
        alert("委托成功！");
        // 刷新数据
        setTimeout(() => window.location.reload(), 2000);
      });
    } catch (e) {
      console.error("Delegate error:", e);
      alert(formatError(e));
    }
  };

  // 生成 calldata
  const handleGenerateCalldata = () => {
    try {
      let calldata = "";
      const param = calldataParam.trim();

      switch (calldataAction) {
        case "setCollateralRatio":
          if (!param) {
            alert("请输入抵押率 (例如: 20000 表示 200%)");
            return;
          }
          calldata = GovernanceActions.setCollateralRatio(parseInt(param));
          break;
        case "setMaxBorrowRatio":
          if (!param) {
            alert("请输入最大借款率 (例如: 9000 表示 90%)");
            return;
          }
          calldata = GovernanceActions.setMaxBorrowRatio(parseInt(param));
          break;
        case "setGovernance":
          if (!param || !ethers.utils.isAddress(param)) {
            alert("请输入有效的治理地址");
            return;
          }
          calldata = GovernanceActions.setGovernance(param);
          break;
        default:
          alert("请选择操作类型");
          return;
      }

      setProposalCalldata(calldata);
      setProposalTarget(CONTRACT_ADDRESSES.LendingPool);
      setShowCalldataHelper(false);
      alert("Calldata 生成成功！");
    } catch (e) {
      console.error("Generate calldata error:", e);
      alert("生成失败: " + formatError(e));
    }
  };

  // 加载提案列表
  const loadProposals = async () => {
    if (!governor || !provider) return;

    try {
      // 从事件获取提案
      const filter = governor.filters.ProposalCreated();
      const events = await provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: CONTRACT_ADDRESSES.SimpleGovernor,
        topics: filter.topics,
      });

      const proposalList = [];
      for (const event of events) {
        const parsed = governor.interface.parseLog(event);
        const proposalId = parsed.args.proposalId;
        
        try {
          const [state, snapshot, deadline, votes] = await Promise.all([
            governor.state(proposalId).catch(() => 0),
            governor.proposalSnapshot(proposalId).catch(() => 0),
            governor.proposalDeadline(proposalId).catch(() => 0),
            governor.proposalVotes(proposalId).catch(() => ({
              againstVotes: 0,
              forVotes: 0,
              abstainVotes: 0,
            })),
          ]);

          // 过滤掉无效状态的提案（Canceled=2, Expired=6）
          // 只显示有效提案：Pending(0), Active(1), Defeated(3), Succeeded(4), Queued(5), Executed(7)
          if (!showAllProposals && (state === 2 || state === 6)) {
            continue; // 跳过 Canceled 和 Expired 的提案
          }

          // 过滤掉空的或测试提案（描述为空或太短）
          const description = parsed.args.description || "";
          if (description.trim().length < 3) {
            continue; // 跳过描述太短的提案
          }

          // 过滤掉明显的测试提案（描述中包含测试关键词）
          const testKeywords = ["test", "测试", "demo", "示例", "example", "fake", "假"];
          const descriptionLower = description.toLowerCase();
          if (!showAllProposals && testKeywords.some(keyword => descriptionLower.includes(keyword))) {
            continue; // 跳过包含测试关键词的提案
          }

          proposalList.push({
            id: proposalId.toString(),
            proposer: parsed.args.proposer,
            targets: parsed.args.targets,
            description: description,
            state: ProposalState[state] || "Unknown",
            stateCode: state,
            snapshot: snapshot.toString(),
            deadline: deadline.toString(),
            votes: {
              against: formatToken(votes.againstVotes || 0),
              for: formatToken(votes.forVotes || 0),
              abstain: formatToken(votes.abstainVotes || 0),
            },
          });
        } catch (e) {
          console.error("Load proposal error:", e);
        }
      }

      // 按 ID 倒序排列
      proposalList.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setProposals(proposalList);
    } catch (e) {
      console.error("Load proposals error:", e);
    }
  };

  // 加载提案列表
  useEffect(() => {
    if (!governor || !provider) return;

    loadProposals();
    const interval = setInterval(loadProposals, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [governor, provider, showAllProposals]);

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-4">治理</h2>

      {/* 用户治理代币信息 */}
      {account && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-purple-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">治理代币余额</div>
            <div className="text-lg font-semibold">{govBalance}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">投票权</div>
            <div className="text-lg font-semibold">{votingPower}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">提案阈值</div>
            <div className="text-lg font-semibold">{proposalThreshold}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          错误: {formatError(error)}
        </div>
      )}

      {/* 创建提案 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">创建提案</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">提案描述</label>
            <textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="描述提案内容..."
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">目标合约地址</label>
            <input
              type="text"
              value={proposalTarget}
              onChange={(e) => setProposalTarget(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Calldata (hex)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={proposalCalldata}
                onChange={(e) => setProposalCalldata(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={() => setShowCalldataHelper(!showCalldataHelper)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {showCalldataHelper ? "隐藏" : "生成"}
              </button>
            </div>
            {showCalldataHelper && (
              <div className="mt-2 p-3 bg-gray-50 border rounded-lg">
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">操作类型</label>
                  <select
                    value={calldataAction}
                    onChange={(e) => setCalldataAction(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="setCollateralRatio">设置抵押率</option>
                    <option value="setMaxBorrowRatio">设置最大借款率</option>
                    <option value="setGovernance">设置治理地址</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    {calldataAction === "setGovernance" ? "治理地址" : "参数值"}
                  </label>
                  <input
                    type="text"
                    value={calldataParam}
                    onChange={(e) => setCalldataParam(e.target.value)}
                    placeholder={
                      calldataAction === "setGovernance"
                        ? "0x..."
                        : calldataAction === "setCollateralRatio"
                        ? "20000 (200%)"
                        : "9000 (90%)"
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <button
                  onClick={handleGenerateCalldata}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  生成 Calldata
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              提示: 可以使用上面的工具生成，或手动输入 calldata
            </p>
          </div>
          <TxButton onClick={handleCreateProposal} disabled={!account} pending={pending}>
            创建提案
          </TxButton>
        </div>
      </div>

      {/* 委托代币 */}
      {account && (
        <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
          <h3 className="text-lg font-semibold mb-2">委托代币</h3>
          <p className="text-sm text-gray-600 mb-3">
            重要: ERC20Votes 代币需要先委托给自己才能获得投票权！
          </p>
          <TxButton onClick={handleDelegate} disabled={!account} pending={pending}>
            委托给自己
          </TxButton>
        </div>
      )}

      {/* 提案列表 */}
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">提案列表</h3>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showAllProposals}
                onChange={(e) => {
                  setShowAllProposals(e.target.checked);
                  loadProposals(); // 重新加载以应用过滤
                }}
                className="rounded"
              />
              显示所有
            </label>
            <button
              onClick={loadProposals}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              刷新
            </button>
          </div>
        </div>
        {proposals.length === 0 ? (
          <p className="text-sm text-gray-500">暂无提案</p>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">提案 #{proposal.id}</h4>
                    <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      proposal.stateCode === 1
                        ? "bg-green-100 text-green-800"
                        : proposal.stateCode === 4
                        ? "bg-blue-100 text-blue-800"
                        : proposal.stateCode === 7
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {proposal.state}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-gray-600">支持</div>
                    <div className="font-semibold">{proposal.votes.for}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">反对</div>
                    <div className="font-semibold">{proposal.votes.against}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">弃权</div>
                    <div className="font-semibold">{proposal.votes.abstain}</div>
                  </div>
                </div>
                {proposal.stateCode === 1 && account && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleVote(proposal.id, VoteOption.For)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={pending}
                    >
                      支持
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, VoteOption.Against)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={pending}
                    >
                      反对
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, VoteOption.Abstain)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                      disabled={pending}
                    >
                      弃权
                    </button>
                  </div>
                )}
                {proposal.stateCode === 5 && account && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleExecute(proposal.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={pending}
                    >
                      执行提案
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

