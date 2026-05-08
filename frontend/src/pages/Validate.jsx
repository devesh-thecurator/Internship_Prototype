import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ValidatePage() {
  const [documents, setDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const [documentsResponse, reportsResponse] = await Promise.all([
      api.get('/uploads/'),
      api.get('/validation/reports/'),
    ]);
    setDocuments(documentsResponse.data);
    setReports(reportsResponse.data);
    setSelectedReport((current) => current || reportsResponse.data[0] || null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const runValidation = async (id) => {
    setLoading(true);
    try {
      const response = await api.post('/validation/process/', { document_id: id });
      await refresh();
      setSelectedReport(response.data);
    } finally {
      setLoading(false);
    }
  };

  const compliance = selectedReport?.compliance_result;
  const risk = selectedReport?.risk_assessments?.[0];
  const documentUrl = selectedReport?.document?.file;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Validation workspace</h3>
        <p className="mt-2 text-slate-500">Review uploaded documents, preview source files, and inspect AI validation findings.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Uploaded documents</h4>
          <div className="mt-4 space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{document.name}</p>
                    <p className="text-sm text-slate-500">
                      Uploaded {new Date(document.uploaded_at).toLocaleString()} · {document.processed ? 'Processed' : 'Awaiting validation'}
                    </p>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => runValidation(document.id)}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {loading ? 'Running...' : 'Validate'}
                  </button>
                </div>
              </div>
            ))}
            {!documents.length && <p className="text-sm text-slate-500">No uploads yet.</p>}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">Validation reports</h4>
          <div className="mt-4 space-y-4">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="block w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{report.document.name}</p>
                    <p className="text-sm text-slate-500">Score: {report.score.toFixed(1)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${report.score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {report.completed ? 'Complete' : 'Pending'}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {report.summary || 'No summary available.'}
                </div>
              </button>
            ))}
            {!reports.length && <p className="text-sm text-slate-500">Run validation to generate report data.</p>}
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm xl:col-span-2">
            <h4 className="text-lg font-semibold text-slate-900">Source preview</h4>
            <div className="mt-4 h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {documentUrl?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={documentUrl} title="PDF preview" className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
                  Preview available for PDFs. Non-PDF documents are processed through OCR/text extraction.
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Match percentage</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{compliance?.match_percentage?.toFixed(1) ?? '0.0'}%</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Compliance score</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{compliance?.compliance_score?.toFixed(1) ?? '0.0'}%</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Risk score</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{risk?.risk_score?.toFixed(1) ?? '0.0'}</p>
              <p className="mt-1 text-sm text-slate-500">{risk?.risk_level ?? 'unknown'} risk</p>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">Mismatch highlights</h4>
            <div className="mt-4 space-y-3">
              {(compliance?.mismatches || []).map((item) => (
                <div key={item} className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Missing or unclear: {item}
                </div>
              ))}
              {!(compliance?.mismatches || []).length && <p className="text-sm text-slate-500">No required-clause mismatches detected.</p>}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-900">AI recommendations</h4>
            <div className="mt-4 space-y-3">
              {(compliance?.recommendations || []).map((item) => (
                <div key={item} className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
              {!(compliance?.recommendations || []).length && <p className="text-sm text-slate-500">No remediation recommendations required.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
