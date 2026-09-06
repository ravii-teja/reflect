import React, { useState, useEffect } from 'react';
import { SecurityAuditResult, SecurityMetricLog } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Play, RefreshCw, Key, Lock, Activity } from 'lucide-react';

interface SecurityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityDrawer: React.FC<SecurityDrawerProps> = ({ isOpen, onClose }) => {
  const { user, getIdToken } = useAuth();
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditResults, setAuditResults] = useState<SecurityAuditResult[]>([]);
  const [metrics, setMetrics] = useState<{
    logs: SecurityMetricLog[];
    rateLimitRemaining: number;
    activeUidHash: string;
    totalMemories: number;
    totalReflections: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadMetrics();
    }
  }, [isOpen, user]);

  const loadMetrics = async () => {
    try {
      const token = await getIdToken();
      const data = await ApiService.getSecurityMetrics(token);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load security metrics:', err);
    }
  };

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      const token = await getIdToken();
      const results = await ApiService.runSecurityAuditSuite(token);
      setAuditResults(results);
      await loadMetrics();
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsRunningAudit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border-l border-[#E8E4DF] w-full max-w-xl h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DF]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF6321]" />
            <h2 className="text-lg font-medium text-[#1A1A1A] tracking-tight">
              Security Architecture & Observability
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Badges */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C8781] uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Identity Model</span>
            </div>
            <div className="text-sm font-medium text-[#1A1A1A]">
              Verified Firebase Token
            </div>
            <div className="text-[11px] text-[#8C8781] mt-1 leading-relaxed">
              Backend extracts UID from claims only. Client-supplied UIDs rejected.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C8781] uppercase tracking-wider mb-1">
              <Key className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Secret Safety</span>
            </div>
            <div className="text-sm font-medium text-[#1A1A1A]">
              GitHub Secrets & Zero Leakage
            </div>
            <div className="text-[11px] text-[#8C8781] mt-1 leading-relaxed">
              Secrets injected strictly via GitHub Secrets at deploy time. Zero credentials committed to repo.
            </div>
          </div>
        </div>

        {/* Live Security Audit Trigger */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] mb-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Live Authorization Matrix Test
            </h3>
            <button
              onClick={handleRunAudit}
              disabled={isRunningAudit || !user}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FF6321] hover:bg-[#E8591E] text-white transition-all shadow-md shadow-[#FF632133] cursor-pointer"
            >
              {isRunningAudit ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Run Live Security Audit</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-[#8C8781] mb-3 leading-relaxed">
            Executes adversary probes (anonymous access, UID spoofing, cross-user IDOR, prompt injection boundary) against live endpoints.
          </p>

          {auditResults.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-[#E8E4DF]">
              {auditResults.map((test, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] text-xs flex items-start justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{test.testName}</span>
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F0EEEA] text-[#2D2A26] border border-[#E8E4DF]">
                        HTTP {test.httpStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B665F] mt-1">{test.description}</p>
                    <p className="text-[10px] text-[#8C8781] font-mono mt-0.5">↳ {test.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rate Limiting & User Scoping */}
        {metrics && (
          <div className="p-4 rounded-2xl bg-white border border-[#E8E4DF] mb-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#FF6321]" />
              <span>Runtime Abuse Controls</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#6B665F]">
              <div>
                <span className="text-[#8C8781] block text-[11px]">Sliding Window Rate Limit</span>
                <span className="font-semibold text-[#1A1A1A]">{metrics.rateLimitRemaining} / 40 remaining</span>
              </div>
              <div>
                <span className="text-[#8C8781] block text-[11px]">User Identity Hash</span>
                <span className="font-mono text-[#1A1A1A]">{metrics.activeUidHash}</span>
              </div>
            </div>
          </div>
        )}

        {/* Structured Audit Logs (Privacy Safe) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C8781]">
              Structured Access Logs (Zero PII)
            </h3>
            <button
              onClick={loadMetrics}
              className="text-[11px] text-[#8C8781] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#1A1A1A] text-[#FAF9F6] p-3.5 rounded-2xl font-mono text-[10px] space-y-1.5 border border-[#2D2A26] shadow-inner">
            {metrics?.logs && metrics.logs.length > 0 ? (
              metrics.logs.map((log) => (
                <div key={log.id} className="leading-tight py-0.5 border-b border-[#2D2A26] pb-1">
                  <span className="text-[#8C8781]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span className="text-[#FF6321]">{log.method}</span>{' '}
                  <span className="text-stone-300">{log.route}</span>{' '}
                  <span className={log.statusCode < 400 ? 'text-emerald-400' : 'text-red-400'}>
                    {log.statusCode}
                  </span>{' '}
                  <span className="text-[#8C8781]">({log.latencyMs}ms)</span>{' '}
                  <span className="text-[#8C8781]">user:{log.userHash}</span>
                </div>
              ))
            ) : (
              <div className="text-[#8C8781] py-6 text-center">
                Waiting for API traffic...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#E8E4DF] flex items-center justify-between text-[11px] text-[#8C8781]">
          <span>Constitution: Defense in depth enforced</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#F0EEEA] hover:bg-[#E8E4DF] text-[#1A1A1A] text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
