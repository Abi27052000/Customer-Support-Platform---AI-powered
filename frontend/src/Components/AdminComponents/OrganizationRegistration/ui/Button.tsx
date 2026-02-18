type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit";
    variant?: "primary" | "ghost";
    disabled?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  onClick,
                                                  type = "button",
                                                  variant = "primary",
                                                  disabled = false,
                                              }) => {
    const base =
        "px-5 py-3 rounded-xl text-base transition disabled:opacity-50 disabled:cursor-not-allowed";
    const style =
        variant === "primary"
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-white border border-gray-200 hover:bg-gray-50";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${style}`}
        >
            {children}
        </button>
    );
};
