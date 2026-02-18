import React from 'react';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const AuthSelect: React.FC<Props> = ({ label, children, className = '', ...props }) => {
  return (
    <label className={`block text-left mb-4 ${className}`}>
      {label && <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>}
      <select {...props} className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2D2A8C]">{children}</select>
    </label>
  );
};

export default AuthSelect;

