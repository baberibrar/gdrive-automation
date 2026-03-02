import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import client from "../api/client";
import {
  FolderOpen,
  MessageSquarePlus,
  MessageSquare,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    try {
      setLoading(true);
      const response = await client.get("/api/feedback");
      setFeedbacks(response.data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
      setError("Failed to load feedbacks");
    } finally {
      setLoading(false);
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

  const quickActions = [
    {
      title: "Browse Google Drive",
      description: "Browse and search your Google Drive files",
      icon: FolderOpen,
      to: "/drive",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Submit Feedback",
      description: "Create a new feedback entry",
      icon: MessageSquarePlus,
      to: "/feedback/new",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "View My Feedbacks",
      description: "See all your submitted feedbacks",
      icon: MessageSquare,
      to: "/feedback",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your Google Drive documents and feedback from one place.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {quickActions.map(({ title, description, icon: Icon, to, color }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Feedbacks */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Feedbacks
              </h2>
            </div>
            <Link
              to="/feedback"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-12 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No feedbacks yet</p>
              <p className="text-xs mt-1">
                Your submitted feedbacks will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {feedbacks.slice(0, 5).map((fb) => (
                <div
                  key={fb.id || fb._id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <StarRating value={fb.rating} readonly />
                        <span className="text-xs text-gray-400">
                          {formatDate(fb.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {fb.party_a_name}
                        </span>
                        <span className="text-gray-400">&amp;</span>
                        <span className="font-medium text-gray-900">
                          {fb.party_b_name}
                        </span>
                        {fb.role && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {fb.role}
                          </span>
                        )}
                      </div>
                      {fb.feedback_text && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 truncate">
                          {fb.feedback_text}
                        </p>
                      )}
                    </div>
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
