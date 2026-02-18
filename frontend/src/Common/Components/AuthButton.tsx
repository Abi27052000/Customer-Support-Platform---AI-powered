import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AuthButton: React.FC<Props> = ({ children, className = '', ...props }) => (
  <button {...props} className={`px-6 py-2 bg-[#2D2A8C] text-white rounded shadow ${className}`}>
    {children}
  </button>
);

export default AuthButton;

