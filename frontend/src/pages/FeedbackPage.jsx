import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FeedbackForm from "../components/FeedbackForm";
import StarRating from "../components/StarRating";
import client from "../api/client";
import {
  CheckCircle2,
  ArrowLeft,
  MessageSquarePlus,
  Loader2,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if we're in "new feedback" mode or "list" mode
  const isNewMode = location.pathname === "/feedback/new";
  const prefilledData = location.state || {};

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // List mode state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    if (!isNewMode) {
      fetchFeedbacks();
    }
  }, [isNewMode]);

  async function fetchFeedbacks() {
    try {
      setLoadingList(true);
      setListError(null);
      const response = await client.get("/api/feedback");
      setFeedbacks(response.data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
      setListError("Failed to load feedbacks");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSubmit(formData) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await client.post("/api/feedback", formData);
      setSubmitSuccess(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setSubmitError(
        err.response?.data?.detail || "Failed to submit feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // New Feedback Mode
  if (isNewMode) {
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
            Back
          </button>

          {/* Success state */}
          {submitSuccess ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Feedback Submitted!
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Your feedback has been saved successfully. Redirecting to dashboard...
              </p>
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 rounded-lg p-2.5">
                  <MessageSquarePlus className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    New Feedback
                  </h1>
                  <p className="text-sm text-gray-500">
                    Fill in the details below to submit your feedback
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                {submitError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mb-6">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm">{submitError}</span>
                  </div>
                )}

                <FeedbackForm
                  initialData={prefilledData}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // List Mode
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedbacks</h1>
            <p className="text-gray-500 text-sm mt-1">
              View all your submitted feedbacks
            </p>
          </div>
          <Link
            to="/feedback/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Feedback
          </Link>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
            </div>
          ) : listError ? (
            <div className="flex items-center justify-center gap-2 py-16 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{listError}</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No feedbacks yet</p>
              <p className="text-xs mt-1 mb-4">
                Submit your first feedback to get started.
              </p>
              <Link
                to="/feedback/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Feedback
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id || fb._id}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating value={fb.rating} readonly />
                        {fb.role && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            {fb.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="font-semibold text-gray-900">
                          {fb.party_a_name}
                        </span>
                        <span className="text-gray-400">&amp;</span>
                        <span className="font-semibold text-gray-900">
                          {fb.party_b_name}
                        </span>
                      </div>
                      {fb.feedback_text && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {fb.feedback_text}
                        </p>
                      )}
                      {fb.source_file && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                          <FileText className="h-3.5 w-3.5" />
                          {fb.source_file}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatDate(fb.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
