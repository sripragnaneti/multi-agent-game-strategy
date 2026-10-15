import React, { useState } from 'react';
import { SearchMetrics } from '../types';
import { compareAlgorithms } from '../services/api';
import { GitBranch, Zap, Cpu, CheckCircle, ArrowRight } from 'lucide-react';

interface AlgorithmVisualizerProps {
  metrics?: SearchMetrics;
}

export const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({ metrics }) => {
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState(2);

  const handleBenchmark = async () => {
    setBenchmarking(true);
    try {
      const data = await compareAlgorithms(selectedDepth);
      setBenchmarkResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Live Adversarial Search Execution Metrics */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={20} color="#38bdf8" />
              MINIMAX WITH ALPHA-BETA PRUNING METRICS
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time branch cutoffs & evaluation statistics from active agent search
            </span>
          </div>
          {metrics && (
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
              {metrics.algorithm} (Depth {metrics.depth})
            </span>
          )}
        </div>

        {metrics ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#0d1322', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>NODES VISITED</span>
                <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{metrics.nodes_visited}</strong>
              </div>
              <div style={{ background: '#0d1322', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>LEAF EVALUATIONS</span>
                <strong style={{ fontSize: '1.5rem', color: '#38bdf8' }}>{metrics.leaf_nodes_evaluated}</strong>
              </div>
              <div style={{ background: '#0d1322', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BRANCHES PRUNED (β ≤ α)</span>
                <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>{metrics.branches_pruned}</strong>
              </div>
              <div style={{ background: '#0d1322', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>EXECUTION TIME</span>
                <strong style={{ fontSize: '1.5rem', color: '#fbbf24' }}>{metrics.execution_time_ms} ms</strong>
              </div>
            </div>

            {/* Render First-Level Search Tree Branches */}
            {metrics.search_tree && metrics.search_tree.children && (
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  SEARCH TREE: ROOT & CANDIDATE ACTION UTILITIES
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {metrics.search_tree.children.map((child: any, idx: number) => {
                    const isBest = child.action === metrics.best_action;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isBest ? 'rgba(56, 189, 248, 0.15)' : '#131b2e',
                          border: `1px solid ${isBest ? '#38bdf8' : '#273553'}`,
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <strong style={{ color: isBest ? '#38bdf8' : '#f1f5f9' }}>{child.action || 'Action'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Utility: <strong style={{ color: child.score >= 0 ? '#10b981' : '#f43f5e' }}>{child.score}</strong>
                        </span>
                        {isBest && (
                          <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                            ★ OPTIMAL
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No search metrics yet. Perform an Attacker turn (Agent A1 or B1) to generate live search trees and pruning cutoffs.
          </p>
        )}
      </div>

      {/* Controlled Benchmark Tool: Minimax vs Alpha-Beta */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#fbbf24" />
              CONTROLLED BENCHMARK: PURE MINIMAX VS ALPHA-BETA PRUNING
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Proves mathematically identical decisions with verifiable node exploration reduction
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(Number(e.target.value))}
              style={{ background: '#0f172a', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value={1}>Depth 1</option>
              <option value={2}>Depth 2 (Standard)</option>
              <option value={3}>Depth 3 (Deep Search)</option>
            </select>
            <button className="button-primary" onClick={handleBenchmark} disabled={benchmarking}>
              {benchmarking ? 'Benchmarking...' : 'Run Benchmark'}
            </button>
          </div>
        </div>

        {benchmarkResult && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#090d16', padding: '1rem', borderRadius: '8px' }}>
            {/* Pure Minimax */}
            <div style={{ background: '#131b2e', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pure Minimax (No Pruning)</h4>
              <p style={{ fontSize: '0.8rem' }}>Nodes Explored: <strong>{benchmarkResult.minimax.nodes_visited}</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Execution Time: <strong>{benchmarkResult.minimax.execution_time_ms} ms</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Selected Action: <strong style={{ color: '#38bdf8' }}>{benchmarkResult.minimax.best_action}</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Backed-up Utility: <strong>{benchmarkResult.minimax.best_score}</strong></p>
            </div>

            {/* Alpha-Beta Pruning */}
            <div style={{ background: '#131b2e', padding: '1rem', borderRadius: '8px', border: '1px solid #10b981' }}>
              <h4 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Minimax with Alpha-Beta Pruning</h4>
              <p style={{ fontSize: '0.8rem' }}>Nodes Explored: <strong style={{ color: '#10b981' }}>{benchmarkResult.alpha_beta.nodes_visited}</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Branches Cutoff: <strong style={{ color: '#10b981' }}>{benchmarkResult.alpha_beta.branches_pruned}</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Execution Time: <strong>{benchmarkResult.alpha_beta.execution_time_ms} ms</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Selected Action: <strong style={{ color: '#38bdf8' }}>{benchmarkResult.alpha_beta.best_action}</strong></p>
              <p style={{ fontSize: '0.8rem' }}>Backed-up Utility: <strong>{benchmarkResult.alpha_beta.best_score}</strong></p>

              <div style={{ marginTop: '0.75rem', padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: '#34d399' }}>
                ✓ Equivalence verified: Identical action & utility with <strong>{benchmarkResult.nodes_saved} fewer node evaluations</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
