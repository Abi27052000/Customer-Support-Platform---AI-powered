type CheckboxFieldProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
                                                                label,
                                                                checked,
                                                                onChange,
                                                            }) => (
    <label className="flex items-center gap-3">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 text-indigo-600"
        />
        <span className="text-sm text-gray-800">{label}</span>
    </label>
);
