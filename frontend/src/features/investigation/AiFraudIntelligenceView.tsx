'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Binary,
  Workflow,
  Search,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  ChevronRight,
  Shield,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

export const AiFraudIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'simulator' | 'theory'>('scanner');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual forensic override flags
  const [flags, setFlags] = useState<{
    flag_visual_tamper: boolean;
    flag_invalid_utr: boolean;
    flag_amount_anomaly: boolean;
    flag_beneficiary_mismatch: boolean;
    flag_missing_watermark: boolean;
  }>({
    flag_visual_tamper: false,
    flag_invalid_utr: false,
    flag_amount_anomaly: false,
    flag_beneficiary_mismatch: false,
    flag_missing_watermark: false,
  });

  // Simulator Form State
  const [simTxnId, setSimTxnId] = useState<string>('TXN-882194');
  const [simAmount, setSimAmount] = useState<number>(85000);
  const [simBeneficiary, setSimBeneficiary] = useState<string>('unknown_p2p_broker@upi');
  const [simUtr, setSimUtr] = useState<string>('FAKE_UTR_9921');

  // Theory Tab Module
  const [activeTheoryModule, setActiveTheoryModule] = useState<'bayes' | 'ao_star' | 'forensics' | 'domain'>('bayes');

  useEffect(() => {
    async function loadSamples() {
      try {
        const data = await api.getFraudAiSamples();
        setSamples(data.samples || []);
      } catch (err) {
        console.warn('Could not load fraud samples:', err);
      }
    }
    loadSamples();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a voucher or transaction screenshot to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (flags.flag_visual_tamper) formData.append('flag_visual_tamper', 'true');
    if (flags.flag_invalid_utr) formData.append('flag_invalid_utr', 'true');
    if (flags.flag_amount_anomaly) formData.append('flag_amount_anomaly', 'true');
    if (flags.flag_beneficiary_mismatch) formData.append('flag_beneficiary_mismatch', 'true');
    if (flags.flag_missing_watermark) formData.append('flag_missing_watermark', 'true');

    try {
      const data = await api.analyzeReceiptScreenshot(formData);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulator = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.analyzeTransactionAi({
        transaction_id: simTxnId,
        amount: Number(simAmount),
        beneficiary_account: simBeneficiary,
        utr: simUtr,
        flags: flags,
      });
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleScenario = async (sample: any) => {
    if (sample.type === 'screenshot' || sample.type === 'clean') {
      setActiveTab('scanner');
      setFlags({
        flag_visual_tamper: !!sample.flags?.flag_visual_tamper,
        flag_invalid_utr: !!sample.flags?.flag_invalid_utr,
        flag_amount_anomaly: !!sample.flags?.flag_amount_anomaly,
        flag_beneficiary_mismatch: !!sample.flags?.flag_beneficiary_mismatch,
        flag_missing_watermark: !!sample.flags?.flag_missing_watermark,
      });
      // Fetch the actual benchmark image from static assets
      try {
        const imgName = sample.id === 'sample_fake_upi' ? 'sample_FRAUD_transaction_receipt.png' : 'sample_REAL_transaction_receipt.png';
        const res = await fetch(`http://localhost:8000/api/fraud-ai/samples/${imgName}`);
        const blob = await res.blob();
        const file = new File([blob], imgName, { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
      } catch (err) {
        console.warn('Could not auto-load benchmark image:', err);
      }
    } else {
      setActiveTab('simulator');
      setSimTxnId(sample.id);
      setSimAmount(sample.amount);
      setSimBeneficiary(sample.beneficiary);
      setSimUtr(sample.utr);
      setFlags({
        flag_visual_tamper: !!sample.flags?.flag_visual_tamper,
        flag_invalid_utr: !!sample.flags?.flag_invalid_utr,
        flag_amount_anomaly: !!sample.flags?.flag_amount_anomaly,
        flag_beneficiary_mismatch: !!sample.flags?.flag_beneficiary_mismatch,
        flag_missing_watermark: !!sample.flags?.flag_missing_watermark,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent Multimodal AI & Mathematical Verification</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Bayesian & AO* Fraud Intelligence
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Combines <strong>OpenCV Computer Vision Forensics</strong> (Laplacian & ELA Discontinuity), 
              <strong> Bayes’ Theorem Sequential Risk Updating</strong>, and <strong>AO* AND-OR Graph Search</strong> with autonomous advisory reasoning.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/10 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scanner' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Receipt Forensics
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'simulator' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" /> Parameter Simulator
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'theory' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Research & Viva Hub
            </button>
          </div>
        </div>
      </div>

      {/* Benchmark Presets Bar */}
      {samples.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Benchmark Scenarios & Novelty Demos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLoadSampleScenario(s)}
                className="p-3 text-left rounded-xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600 mb-1 flex items-center justify-between">
                    <span>{s.title}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600">
                      {s.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {s.description}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-bold text-orange-600 flex items-center gap-1">
                  Load & Inspect <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: RECEIPT FORENSICS SCANNER */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-orange-600" /> Upload Transaction Voucher or Screenshot
              </h3>

              {/* Dropzone */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-orange-50/20 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg border border-slate-200 shadow-2xs object-contain"
                    />
                    <p className="text-xs font-medium text-slate-700">{selectedFile?.name}</p>
                    <span className="text-[11px] text-orange-600 font-semibold underline">Click to replace file</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Drag & drop receipt screenshot</p>
                    <p className="text-[11px] text-slate-500">Supports PNG, JPG, WebP (UPI, GPay, PhonePe, Invoices)</p>
                  </div>
                )}
              </div>

              {/* Synthetic Overrides */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Forensic & Parameter Overrides (Test Bench)
                </label>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flags.flag_visual_tamper}
                      onChange={(e) => setFlags({ ...flags, flag_visual_tamper: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium text-slate-800">Simulate Digital Splicing / Font Tamper</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flags.flag_invalid_utr}
                      onChange={(e) => setFlags({ ...flags, flag_invalid_utr: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium text-slate-800">Simulate Invalid / Non-12-digit UTR</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flags.flag_amount_anomaly}
                      onChange={(e) => setFlags({ ...flags, flag_amount_anomaly: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium text-slate-800">Simulate High-Value Amount Outlier (&gt;3σ)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flags.flag_beneficiary_mismatch}
                      onChange={(e) => setFlags({ ...flags, flag_beneficiary_mismatch: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium text-slate-800">Simulate Unregistered Beneficiary VPA</span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleScanReceipt}
                disabled={isLoading || !selectedFile}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-orange-500/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Multimodal Forensic Inspection...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Run AI Forensics & Proof Search
                  </>
                )}
              </button>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Forensic Results */}
          <div className="lg:col-span-7 space-y-4">
            {!result ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Awaiting Transaction Voucher Analysis</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload an image or load a benchmark preset above to inspect computer vision metrics, Bayesian probability progression, and AO* problem reduction graph.
                </p>
              </div>
            ) : (
              <RenderAnalysisResult result={result} previewUrl={previewUrl} />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARAMETER SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" /> Transaction Parameters Simulation
              </h3>
              <p className="text-xs text-slate-500">
                Simulate arbitrary payment transfer requests to evaluate the mathematical risk shift in real-time.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction ID / Reference</label>
                  <input
                    type="text"
                    value={simTxnId}
                    onChange={(e) => setSimTxnId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monetary Amount (INR ₹)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Beneficiary Account / VPA</label>
                  <input
                    type="text"
                    value={simBeneficiary}
                    onChange={(e) => setSimBeneficiary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UTR / 12-digit Banking Ref ID</label>
                  <input
                    type="text"
                    value={simUtr}
                    onChange={(e) => setSimUtr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-700 block">Flag Indicators:</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flags.flag_amount_anomaly}
                    onChange={(e) => setFlags({ ...flags, flag_amount_anomaly: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Amount Anomaly (>3.5σ baseline deviation)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flags.flag_invalid_utr}
                    onChange={(e) => setFlags({ ...flags, flag_invalid_utr: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Invalid UTR Syntax / Non-conforming syntax</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flags.flag_beneficiary_mismatch}
                    onChange={(e) => setFlags({ ...flags, flag_beneficiary_mismatch: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Beneficiary Mismatch / Unverified Counterparty</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flags.flag_missing_watermark}
                    onChange={(e) => setFlags({ ...flags, flag_missing_watermark: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Missing NPCI / Bank Security Seals</span>
                </label>
              </div>

              <button
                onClick={handleRunSimulator}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                    Computing Bayesian & AO* Proof...
                  </>
                ) : (
                  <>
                    <Binary className="w-4 h-4 text-orange-400" />
                    Evaluate Transaction Risk
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {!result ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 space-y-3">
                <Sliders className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">Transaction Simulator Ready</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Configure the simulated transaction parameters on the left and click "Evaluate Transaction Risk" to trigger the probabilistic models.
                </p>
              </div>
            ) : (
              <RenderAnalysisResult result={result} previewUrl={null} />
            )}
          </div>
        </div>
      )}

      {/* TAB 3: THEORY, MATHEMATICAL ARCHITECTURE & VIVA HUB */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          {/* Module Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'bayes', label: '1. Bayes’ Theorem Updating' },
              { id: 'ao_star', label: '2. AO* AND-OR Graph Search' },
              { id: 'forensics', label: '3. Image Forensics & ELA' },
              { id: 'domain', label: '4. Domain & Intent Filter' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveTheoryModule(m.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTheoryModule === m.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {activeTheoryModule === 'bayes' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Binary className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Bayesian Probabilistic Updating</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than treating fraud as a static binary flag, our system uses <strong>Bayes’ Theorem</strong> to continually shift belief odds.
                Starting from an unconditioned baseline retail fraud prior $P(\text{Fraud}) = 2.5\%$, each incoming independent evidence signal $E_k$ updates the odds via calibrated Likelihood Ratios (Bayes Factors).
              </p>
              <div className="p-4 rounded-xl bg-slate-900 text-orange-400 font-mono text-xs overflow-x-auto">
                P(Fraud | E1..Ek) = [ P(Fraud) * Π P(Ei | Fraud) ] / [ P(Fraud) * Π P(Ei | Fraud) + P(~Fraud) * Π P(Ei | ~Fraud) ]
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Calibrated Likelihood Ratios</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>Visual Tampering: P(E|F)=0.88 vs P(E|~F)=0.015 (BF = 58.6x)</li>
                    <li>Invalid UTR Syntax: P(E|F)=0.92 vs P(E|~F)=0.010 (BF = 92.0x)</li>
                    <li>Beneficiary Mismatch: P(E|F)=0.82 vs P(E|~F)=0.030 (BF = 27.3x)</li>
                    <li>Amount Outlier (&gt;3σ): P(E|F)=0.74 vs P(E|~F)=0.040 (BF = 18.5x)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Why This Beats Rule Engines</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Single weak anomalies never trigger false-positive panics. Compounding evidence exponentially shifts posterior belief toward certainty, providing mathematical proof rather than arbitrary heuristics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTheoryModule === 'ao_star' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">AO* (AND-OR Graph Search) Problem Reduction</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fraud verification is modeled as an <strong>AND-OR State-Space Graph</strong>. The root hypothesis <em>GOAL_FRAUD</em> is an OR node satisfied if any valid attack channel is established:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                <div>GOAL_FRAUD (OR Node)</div>
                <div className="pl-4">├── OR-Branch 1: Visual Forgery (AND: Pixel Tamper + Missing Seals)</div>
                <div className="pl-4">├── OR-Branch 2: Reference Spoofing (AND: Invalid UTR + Unregistered VPA)</div>
                <div className="pl-4">└── OR-Branch 3: Behavioral Outlier (AND: Amount Outlier + Time Burst)</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The <strong>AO* algorithm</strong> executes bottom-up heuristic cost revision: OR-nodes select the minimum child hyperedge ($f = \min \sum c_i + h_i$), while AND-nodes accumulate proof costs ($\sum c_i + h_i$). A fraud verdict is confirmed only when the optimal proof subtree cost satisfies $f &lt; 5.0$ and is completely solved.
              </p>
            </div>
          )}

          {activeTheoryModule === 'forensics' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Computer Vision Forensics & Laplacian ELA</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fake receipt generators (e.g. spoof UPI apps) paste crisp digital vector text over pre-compressed background templates. 
                Our OpenCV pipeline calculates the <strong>Laplacian Variance</strong> across an 8x8 spatial grid:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">1. Laplacian Variance</div>
                  <div className="text-slate-500 mt-1">Measures high-frequency gradient edge sharpness across the document surface.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">2. Discontinuity Ratio</div>
                  <div className="text-slate-500 mt-1">Ratios &gt;2.8 or &lt;0.35 between amount bounding box and background indicate digital splicing.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">3. Canny Edge Density</div>
                  <div className="text-slate-500 mt-1">Verifies presence of authentic bank typography and seal boundaries.</div>
                </div>
              </div>
            </div>
          )}

          {activeTheoryModule === 'domain' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Intelligent Pre-Inference Domain Classifier</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In real-world deployment, attackers or confused users submit out-of-domain media (such as university examination hall tickets, Aadhaar cards, or utility bills).
                A naive fraud detector falsely flags these as "fraudulent vouchers with missing UTR".
              </p>
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 text-xs text-slate-800">
                <strong>Pre-Filter Guarantee:</strong> Our Stage-0 classifier inspects semantic entity signatures before initiating fraud engines. Unrelated documents are gracefully recognized with their true identity (e.g. "Academic Examination Admit Card"), while mathematical fraud scoring is strictly reserved for payment transactions.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponent: Render Detailed AI Analysis Result
const RenderAnalysisResult: React.FC<{ result: any; previewUrl: string | null }> = ({ result, previewUrl }) => {
  const verdict = result.verdict || {};
  const isFraud = verdict.is_fraud;
  const isTransaction = result.is_transaction_document !== false;
  const advisory = result.gemini_agent_advisory || {};
  const bayes = result.bayesian_analysis || {};
  const aoStar = result.ao_star_search || {};
  const forensics = result.forensics || {};
  const fields = result.extracted_fields || {};

  return (
    <div className="space-y-4">
      {/* 1. Verdict Card */}
      <div
        className={`p-5 rounded-2xl border ${
          !isTransaction
            ? 'bg-amber-50/60 border-amber-300 text-amber-900'
            : isFraud
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        } shadow-sm`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            {isFraud ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <h3 className="text-base font-black tracking-tight">{verdict.title || 'ANALYSIS COMPLETE'}</h3>
              <p className="text-xs opacity-90">{verdict.recommendation}</p>
            </div>
          </div>
          {isTransaction && (
            <div className="text-right">
              <div className="text-2xl font-black">{verdict.risk_score_100}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                {verdict.risk_level} RISK
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Autonomous Explainable Advisory */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>Multimodal AI Forensic Synthesis</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Identified Document</span>
            <div className="font-bold text-slate-800">{advisory.what_is_this || 'Payment Voucher'}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Transaction Intent</span>
            <div className="font-bold text-slate-800">{advisory.payment_purpose || 'Standard Settlement'}</div>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-1">Forensic Evaluation:</span>
          {advisory.detailed_reasoning}
        </div>
        {advisory.suggested_actions && advisory.suggested_actions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-700 block">Recommended Protocol:</span>
            <ul className="space-y-1">
              {advisory.suggested_actions.map((act: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Bayesian Step-by-Step Risk Progression */}
      {bayes.is_applicable && bayes.steps && bayes.steps.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Binary className="w-4 h-4 text-orange-600" />
              <span>Bayesian Likelihood Ratio Updating Steps</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Prior: {(bayes.prior_probability * 100).toFixed(1)}% → Posterior: {(bayes.posterior_probability * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            {bayes.steps.map((st: any) => (
              <div key={st.step_num} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center">
                      {st.step_num}
                    </span>
                    <span>{st.evidence_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{st.explanation}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                    +{st.delta_pct}% Risk
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    BF: {st.bayes_factor}x | New: {(st.posterior_prob * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AO* Proof Tree & Graph Search Decomposition */}
      {aoStar.is_applicable && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Workflow className="w-4 h-4 text-orange-600" />
              <span>AO* Heuristic Proof Tree Decomposition</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Optimal Cost f={aoStar.optimal_cost}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-tight">
            {aoStar.explanation}
          </p>

          {aoStar.proof_tree_nodes && aoStar.proof_tree_nodes.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-700 block">Active Proof Tree Nodes:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {aoStar.proof_tree_nodes.map((node: any) => (
                  <div
                    key={node.id}
                    className={`p-2.5 rounded-xl border ${
                      node.is_solved
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{node.label}</span>
                      <span className="text-[10px] uppercase font-semibold px-1 rounded bg-white/70">
                        {node.node_type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Cost: {node.cost}</span>
                      <span>{node.is_solved ? 'Proved' : 'Unproved'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Forensics & OCR Extraction Metadata */}
      {forensics.dimensions && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800">Computer Vision Forensics Data:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Laplacian Var:</span>
              <span className="font-mono font-bold text-slate-700">{forensics.laplacian_variance}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ELA Ratio:</span>
              <span className="font-mono font-bold text-slate-700">{forensics.discontinuity_ratio}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Splicing Clipping:</span>
              <span className={`font-bold ${forensics.has_clipping_artifacts ? 'text-rose-600' : 'text-emerald-600'}`}>
                {forensics.has_clipping_artifacts ? 'DETECTED' : 'CLEAN'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Extracted UTR:</span>
              <span className="font-mono font-bold text-slate-700">{fields.utr || 'None'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
