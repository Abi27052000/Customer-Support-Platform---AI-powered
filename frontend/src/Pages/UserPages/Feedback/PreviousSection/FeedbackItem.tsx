import React from "react";
import { FaReply } from "react-icons/fa";

type FeedbackData = {
  id: number | string;
  type: string;
  message: string;
  response: string;
  date: string;
};

interface FeedbackItemProps {
  item: FeedbackData;
}

const FeedbackItem = ({ item }: FeedbackItemProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow ">
      <p className="font-semibold text-blue-600">Feedback:</p>
      <p className="text-gray-700">{item.message}</p>
      <p className="text-sm text-gray-400 mt-1">Submitted on {item.date}</p>

      {item.response && (
        <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <div className="flex items-center gap-2 font-semibold text-blue-600">
            <FaReply /> Organization Reply
          </div>
          <p className="text-gray-700 mt-1">{item.response}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackItem;
