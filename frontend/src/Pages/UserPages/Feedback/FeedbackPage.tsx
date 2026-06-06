import FeedbackForm from "./FeedbackForm/FeedbackForm";
import PreviousSection from "./PreviousSection/PreviousSection";
import SupportTicketForm from "./SupportTicketForm";

const FeedbackPage = () => {
  return (
    <div className="p-6 pt-2 w-full space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 shadow-md p-2 rounded">Feedback & Complaints</h1>
      <SupportTicketForm />
      <FeedbackForm />
      <PreviousSection />
    </div>
  );
};

export default FeedbackPage;
