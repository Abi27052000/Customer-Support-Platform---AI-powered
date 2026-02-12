type InputFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
};

export const InputField: React.FC<InputFieldProps> = ({
                                                          label,
                                                          value,
                                                          onChange,
                                                          error,
                                                          type = "text",
                                                          placeholder,
                                                      }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-300 ${
                error ? "border-red-400" : "border-gray-200"
            }`}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
);
