import { useState } from "react";
import StarRating from "./StarRating";
import { Send, Loader2, AlertCircle } from "lucide-react";

const ROLE_OPTIONS = ["Client", "Freelancer", "Influencer", "Agency", "Other"];

export default function FeedbackForm({ initialData = {}, onSubmit, submitting = false }) {
  const [formData, setFormData] = useState({
    rating: initialData.rating || 0,
    party_a_name: initialData.party_a_name || "",
    party_b_name: initialData.party_b_name || "",
    role: initialData.role || "",
    feedback_text: initialData.feedback_text || "",
    source_file: initialData.source_file || "",
  });

  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = "Please provide a rating";
    }
    if (!formData.party_a_name.trim()) {
      newErrors.party_a_name = "Party A name is required";
    }
    if (!formData.party_b_name.trim()) {
      newErrors.party_b_name = "Party B name is required";
    }
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }
    if (!formData.feedback_text.trim()) {
      newErrors.feedback_text = "Feedback text is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={formData.rating}
          onChange={(val) => handleChange("rating", val)}
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.rating}
          </p>
        )}
      </div>

      {/* Party A Name */}
      <div>
        <label
          htmlFor="party_a_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Party A Name <span className="text-red-500">*</span>
        </label>
        <input
          id="party_a_name"
          type="text"
          value={formData.party_a_name}
          onChange={(e) => handleChange("party_a_name", e.target.value)}
          placeholder="Enter Party A name"
          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            errors.party_a_name
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
        />
        {errors.party_a_name && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.party_a_name}
          </p>
        )}
      </div>

      {/* Party B Name */}
      <div>
        <label
          htmlFor="party_b_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Party B Name <span className="text-red-500">*</span>
        </label>
        <input
          id="party_b_name"
          type="text"
          value={formData.party_b_name}
          onChange={(e) => handleChange("party_b_name", e.target.value)}
          placeholder="Enter Party B name"
          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            errors.party_b_name
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
        />
        {errors.party_b_name && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.party_b_name}
          </p>
        )}
      </div>

      {/* Role */}
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => handleChange("role", e.target.value)}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            errors.role
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <option value="">Select a role</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.role}
          </p>
        )}
      </div>

      {/* Feedback Text */}
      <div>
        <label
          htmlFor="feedback_text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Feedback <span className="text-red-500">*</span>
        </label>
        <textarea
          id="feedback_text"
          rows={5}
          value={formData.feedback_text}
          onChange={(e) => handleChange("feedback_text", e.target.value)}
          placeholder="Write your feedback here..."
          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-y ${
            errors.feedback_text
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
        />
        {errors.feedback_text && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.feedback_text}
          </p>
        )}
      </div>

      {/* Source File (read-only if pre-filled) */}
      <div>
        <label
          htmlFor="source_file"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Source File
        </label>
        <input
          id="source_file"
          type="text"
          value={formData.source_file}
          onChange={(e) => handleChange("source_file", e.target.value)}
          readOnly={!!initialData.source_file}
          placeholder="Source file name (optional)"
          className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            initialData.source_file
              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
              : "border-gray-300 bg-white"
          }`}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}
