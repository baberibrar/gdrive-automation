import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import client from "../api/client";
import {
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Briefcase,
} from "lucide-react";

export default function ExtractionPage() {
  const { fileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fileName = location.state?.fileName || "Unknown File";
  const mimeType = location.state?.mimeType || "";

  // Processing states
  const [processing, setProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState("extracting"); // extracting | analyzing
  const [error, setError] = useState(null);

  // Data
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState(null);

  // Role selection & feedback generation
  const [selectedRole, setSelectedRole] = useState(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const hasStarted = useRef(false);

  // Auto-run extraction + analysis on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    processDocument();
  }, []);

  async function processDocument() {
    try {
      setProcessing(true);
      setError(null);

      // Step 1: Extract text
      setProcessingStep("extracting");
      const extractResponse = await client.post("/api/extract/text", {
        file_id: fileId,
        mime_type: mimeType,
      });
      const text = extractResponse.data.text || extractResponse.data.content || "";
      setExtractedText(text);

      if (!text.trim()) {
        setError("No text could be extracted from this file.");
        setProcessing(false);
        return;
      }

      // Step 2: AI Analysis
      setProcessingStep("analyzing");
      const analyzeResponse = await client.post("/api/extract/analyze", {
        file_id: fileId,
        text: text,
      });
      setAnalysis(analyzeResponse.data);
      setProcessing(false);
    } catch (err) {
      console.error("Processing failed:", err);
      setError(
        err.response?.data?.detail || "Failed to process file. Please try again."
      );
      setProcessing(false);
    }
  }

  async function handleRoleSelect(role) {
    setSelectedRole(role);
    setGeneratingFeedback(true);

    try {
      const response = await client.post("/api/extract/generate-feedback", {
        text: extractedText,
        analysis: {
          party_a_name: analysis.party_a_name || analysis.party_a || "Unknown",
          party_a_role: analysis.party_a_role || "Unknown",
          party_b_name: analysis.party_b_name || analysis.party_b || "Unknown",
          party_b_role: analysis.party_b_role || "Unknown",
          summary: analysis.summary || analysis.description || "",
        },
        user_role: role,
      });

      // Determine who is giving and receiving feedback based on role
      let partyA, partyB, feedbackRole;
      if (role === "client") {
        // Client giving feedback to freelancer/influencer
        partyA = analysis.party_a_name || analysis.party_a || "";
        partyB = analysis.party_b_name || analysis.party_b || "";
        feedbackRole = "Client";
      } else {
        // Freelancer/influencer giving feedback to client
        partyA = analysis.party_a_name || analysis.party_a || "";
        partyB = analysis.party_b_name || analysis.party_b || "";
        feedbackRole = role === "freelancer" ? "Freelancer" : "Influencer";
      }

      navigate("/feedback/new", {
        state: {
          party_a_name: partyA,
          party_b_name: partyB,
          role: feedbackRole,
          feedback_text: response.data.feedback_text,
          rating: response.data.rating,
          source_file: fileName,
        },
      });
    } catch (err) {
      console.error("Feedback generation failed:", err);
      setError(
        err.response?.data?.detail || "Failed to generate feedback. Please try again."
      );
      setGeneratingFeedback(false);
      setSelectedRole(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {mimeType && (
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {mimeType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Processing State */}
        {processing && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Document
              </h2>
              <p className="text-sm text-gray-500">
                {processingStep === "extracting"
                  ? "Extracting text from file..."
                  : "Analyzing document with AI..."}
              </p>
              {/* Progress dots */}
              <div className="flex items-center gap-3 mt-6">
                <div className={`flex items-center gap-2 text-sm ${
                  processingStep === "extracting" ? "text-red-600 font-medium" : "text-green-600"
                }`}>
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    processingStep === "extracting" ? "bg-red-600 animate-pulse" : "bg-green-500"
                  }`} />
                  Extract
                </div>
                <div className="h-px w-6 bg-gray-300" />
                <div className={`flex items-center gap-2 text-sm ${
                  processingStep === "analyzing" ? "text-red-600 font-medium" : "text-gray-400"
                }`}>
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    processingStep === "analyzing" ? "bg-red-600 animate-pulse" : "bg-gray-300"
                  }`} />
                  Analyze
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    hasStarted.current = false;
                    processDocument();
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Selection - shown after processing is complete */}
        {!processing && !error && analysis && !generatingFeedback && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                What is your role?
              </h2>
              <p className="text-sm text-gray-500">
                Select your role to generate the appropriate feedback
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Freelancer / Influencer */}
              <button
                onClick={() => handleRoleSelect("freelancer")}
                className="group flex flex-col items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer"
              >
                <div className="bg-red-100 group-hover:bg-red-200 rounded-full p-4 transition-colors">
                  <Briefcase className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Freelancer / Influencer
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Generate feedback for the client
                  </p>
                </div>
              </button>

              {/* Client */}
              <button
                onClick={() => handleRoleSelect("client")}
                className="group flex flex-col items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer"
              >
                <div className="bg-red-100 group-hover:bg-red-200 rounded-full p-4 transition-colors">
                  <User className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Client
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Generate feedback for the freelancer
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Generating Feedback State */}
        {generatingFeedback && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Generating Feedback
              </h2>
              <p className="text-sm text-gray-500">
                Creating {selectedRole === "client" ? "feedback for the freelancer" : "feedback for the client"}...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
