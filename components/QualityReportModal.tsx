"use client";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface QualityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
}

export default function QualityReportModal({ isOpen, onClose, datasetName }: QualityReportModalProps) {
  if (!isOpen) return null;

  const metrics = [
    { label: "Schema Compliance", value: "100%", status: "success" },
    { label: "Terminal Artifacts", value: "0%", status: "success" },
    { label: "JSON Validity", value: "100%", status: "success" },
    { label: "Field Completeness", value: "100%", status: "success" },
    { label: "Duplicate Records", value: "0%", status: "success" },
    { label: "PII Contamination", value: "0%", status: "success" },
  ];

  const validationSteps = [
    { step: "1", title: "Automated Schema Validation", description: "Every record validated against JSON schema" },
    { step: "2", title: "Regex Cleaning", description: "Terminal artifacts eliminated via regex patterns" },
    { step: "3", title: "Human Verification", description: "Edge cases reviewed by ML engineers" },
    { step: "4", title: "Final Quality Check", description: "Comprehensive validation before delivery" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--border)] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[var(--text)]">Quality Report</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Dataset Info */}
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-2">{datasetName}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Generated on January 15, 2026 • Last updated January 20, 2026
            </p>
          </div>

          {/* Metrics Grid */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Validation Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {metric.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[var(--warning)]" />
                    )}
                    <span className="text-sm text-[var(--text-muted)]">{metric.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text)]">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Process */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Validation Process</h3>
            <div className="space-y-4">
              {validationSteps.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--lime)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text)]">{item.title}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-[var(--success-dim)] border border-[var(--success)]/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-[var(--success)]" />
              <h3 className="font-semibold text-[var(--text)]">Compliance Status</h3>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                GDPR Compliant
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                DPDP Compliant
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                100% PII-Free
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Synthetically Generated
              </li>
            </ul>
          </div>

          {/* Additional Documentation */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Documentation Included</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Data dictionary with field descriptions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Schema documentation (JSON Schema)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Usage examples and integration guides
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Quality methodology documentation
              </li>
            </ul>
          </div>

          {/* Provenance */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Data Provenance</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                100% synthetically generated
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                No real user data or PII
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Clean collection methods
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Ethical generation process
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[var(--surface2)] text-[var(--text)] font-semibold rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface3)] transition"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-primary"
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
