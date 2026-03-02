import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import client from "../api/client";
import {
  FileText,
  Sparkles,
  MessageSquarePlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";

export default function ExtractionPage() {
  const { fileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fileName = location.state?.fileName || "Unknown File";
  const mimeType = location.state?.mimeType || "";

  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const [copied, setCopied] = useState(false);

  async function handleExtractText() {
    try {
      setExtracting(true);
      setExtractError(null);
      const response = await client.post("/api/extract/text", {
        file_id: fileId,
        mime_type: mimeType,
      });
      setExtractedText(response.data.text || response.data.content || "");
    } catch (err) {
      console.error("Extraction failed:", err);
      setExtractError(
        err.response?.data?.detail || "Failed to extract text from file"
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleAnalyze() {
    try {
      setAnalyzing(true);
      setAnalyzeError(null);
      const response = await client.post("/api/extract/analyze", {
        file_id: fileId,
        text: extractedText,
      });
      setAnalysis(response.data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalyzeError(
        err.response?.data?.detail || "Failed to analyze text"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function handleCreateFeedback() {
    const feedbackData = {
      party_a_name: analysis?.party_a || "",
      party_b_name: analysis?.party_b || "",
      role: analysis?.role || "",
      feedback_text: analysis?.summary || "",
      source_file: fileName,
    };
    navigate("/feedback/new", { state: feedbackData });
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = extractedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Drive
        </button>

        {/* File Info Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-50 rounded-lg p-3">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {fileName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                File ID: {fileId}
              </p>
              {mimeType && (
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {mimeType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 1: Extract Text */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 text-sm font-bold">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Extract Text
              </h2>
            </div>
            {extractedText && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>

          {!extractedText && !extracting && (
            <button
              onClick={handleExtractText}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Extract Text
            </button>
          )}

          {extracting && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
              <span className="text-sm text-gray-600">
                Extracting text from file...
              </span>
            </div>
          )}

          {extractError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mt-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{extractError}</span>
            </div>
          )}

          {extractedText && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Extracted Content
                </span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {extractedText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: AI Analysis */}
        {extractedText && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 text-sm font-bold">
                  2
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Analysis
                </h2>
              </div>
              {analysis && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>

            {!analysis && !analyzing && (
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </button>
            )}

            {analyzing && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                <span className="text-sm text-gray-600">
                  Analyzing text with AI...
                </span>
              </div>
            )}

            {analyzeError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mt-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{analyzeError}</span>
              </div>
            )}

            {analysis && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Party A
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.party_a || "Not identified"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Party B
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.party_b || "Not identified"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Role
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.role || "Not identified"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Type
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.type || analysis.document_type || "Not identified"}
                    </p>
                  </div>
                </div>

                {(analysis.summary || analysis.description) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Summary
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysis.summary || analysis.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Create Feedback */}
        {analysis && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 text-sm font-bold">
                3
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create Feedback
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Use the extracted information to create a feedback entry.
            </p>
            <button
              onClick={handleCreateFeedback}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Create Feedback
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
