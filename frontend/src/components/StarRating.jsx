import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, readonly = false }) {
  const [hoverValue, setHoverValue] = useState(0);

  function handleClick(rating) {
    if (!readonly && onChange) {
      onChange(rating);
    }
  }

  function handleMouseEnter(rating) {
    if (!readonly) {
      setHoverValue(rating);
    }
  }

  function handleMouseLeave() {
    if (!readonly) {
      setHoverValue(0);
    }
  }

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          disabled={readonly}
          className={`p-0.5 transition-transform ${
            readonly
              ? "cursor-default"
              : "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
          }`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= displayValue
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
