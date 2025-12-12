import React from "react";
import ComplaintItem from "./ComplaintItem";
import FeedbackItem from "./FeedbackItem";

const previousData = [
  {
    id: 1,
    type: "complaint",
    message: "Delay in order delivery.",
    response: "We are investigating the issue.",
    date: "2025-02-03",
  },
  {
    id: 1,
    type: "complaint",
    message: "Delay in order delivery.",
    response: "We are investigating the issue.",
    date: "2025-02-03",
  },
  {
    id: 2,
    type: "feedback",
    message: "Great UI design!",
    response: "Thank you for your valuable feedback.",
    date: "2025-01-26",
  },
  {
    id: 2,
    type: "feedback",
    message: "Great UI design!",
    response: "Thank you for your valuable feedback.",
    date: "2025-01-26",
  },
];

const PreviousSection = () => {
  const complaints = previousData.filter((i) => i.type === "complaint");
  const feedbacks = previousData.filter((i) => i.type === "feedback");

  return (
    <div className="space-y-6">

      <div className="bg-gray-100 p-4 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-3 text-blue-600">Previous Feedback</h2>
        <div className="space-y-4">
          {feedbacks.map((item) => (
            <FeedbackItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-3 text-red-600">Previous Complaints</h2>
        <div className="space-y-4">
          {complaints.map((item) => (
            <ComplaintItem key={item.id} item={item} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default PreviousSection;
