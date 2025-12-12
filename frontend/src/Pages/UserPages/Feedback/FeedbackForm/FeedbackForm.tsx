import React, { useState } from "react";
import { FaPaperPlane, FaComments } from "react-icons/fa";

const FeedbackForm = () => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"feedback" | "complaint">("feedback");

  const submitForm = () => {
    if (!message.trim()) return alert("Please type your message");
    alert(`Submitted as ${type}: ${message}`);
    setMessage("");
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaComments /> Submit Your Feedback or Complaint
      </h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setType("feedback")}
          className={`px-4 py-2 rounded-lg border 
            ${type === "feedback" ? "bg-blue-600 text-white" : "bg-gray-200"}
          `}
        >
          Feedback
        </button>

        <button
          onClick={() => setType("complaint")}
          className={`px-4 py-2 rounded-lg border 
            ${type === "complaint" ? "bg-red-600 text-white" : "bg-gray-200"}
          `}
        >
          Complaint
        </button>
      </div>

      <textarea
        className="w-full border rounded-lg p-3 h-32 focus:outline-blue-500"
        placeholder={
          type === "feedback"
            ? "Write your feedback here..."
            : "Describe your complaint..."
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={submitForm}
        className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 
          text-white px-5 py-2 rounded-lg"
      >
        <FaPaperPlane /> Submit
      </button>
    </div>
  );
};

export default FeedbackForm;
