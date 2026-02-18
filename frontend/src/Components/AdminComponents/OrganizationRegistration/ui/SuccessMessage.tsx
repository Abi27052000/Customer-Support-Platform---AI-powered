type SuccessMessageProps = {
    orgName: string;
    onReset: () => void;
};

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
                                                                  orgName,
                                                                  onReset,
                                                              }) => (
    <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100">
        <h3 className="text-lg font-semibold text-indigo-800">
            Organization Registered 🎉
        </h3>
        <p className="mt-2 text-gray-700">
            <strong>{orgName}</strong> has been registered successfully.
        </p>

        <button
            onClick={onReset}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
        >
            Register Another
        </button>
    </div>
);
