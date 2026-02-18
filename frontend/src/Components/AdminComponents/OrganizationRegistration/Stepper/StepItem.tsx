type StepItemProps = {
    index: number;
    label: string;
    description?: string;
    isActive: boolean;
    isDone: boolean;
    isLast: boolean;
    onClick: () => void;
};

export const StepItem: React.FC<StepItemProps> = ({
                                                      index,
                                                      label,
                                                      description,
                                                      isActive,
                                                      isDone,
                                                      isLast,
                                                      onClick,
                                                  }) => {
    return (
        <div
            onClick={onClick}
            className={`grid grid-cols-[56px_1fr] gap-3 p-3 rounded-lg cursor-pointer
        ${isActive ? "bg-indigo-50 shadow-sm" : "hover:bg-gray-50"}`}
        >
            {/* Bubble */}
            <div className="flex flex-col items-center">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold
            ${
                        isDone
                            ? "bg-indigo-600 text-white"
                            : isActive
                                ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                : "bg-white border text-indigo-700"
                    }`}
                >
                    {isDone ? "✓" : index + 1}
                </div>

                {!isLast && (
                    <div
                        className={`w-px mt-3 ${
                            isDone ? "bg-indigo-400 h-14" : "bg-gray-200 h-10"
                        }`}
                    />
                )}
            </div>

            {/* Text */}
            <div>
                <p
                    className={`text-sm font-semibold ${
                        isActive ? "text-indigo-700" : "text-gray-800"
                    }`}
                >
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-gray-500 mt-1">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};
