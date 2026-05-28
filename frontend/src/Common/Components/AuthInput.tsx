import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const AuthInput: React.FC<Props> = ({ label, className = '', type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className={`block text-left mb-4 ${className}`}>
      {label && <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>}
      <div className="relative">
        <input
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2D2A8C]"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D2A8C] transition-colors"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
};

export default AuthInput;

