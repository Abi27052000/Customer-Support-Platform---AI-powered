import React from "react";
import { FaReply } from "react-icons/fa";

type ComplaintData = {
  id: number | string;
  type: string;
  message: string;
  response: string;
  date: string;
};

interface ComplaintItemProps {
  item: ComplaintData;
}

const ComplaintItem = ({ item }: ComplaintItemProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow ">
      <p className="font-semibold text-red-600">Complaint:</p>
      <p className="text-gray-700">{item.message}</p>
      <p className="text-sm text-gray-400 mt-1">Submitted on {item.date}</p>

      {item.response && (
        <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <FaReply /> Response
          </div>
          <p className="text-gray-700 mt-1">{item.response}</p>
        </div>
      )}
    </div>
  );
};

export default ComplaintItem;
