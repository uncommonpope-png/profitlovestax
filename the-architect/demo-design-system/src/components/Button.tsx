import React from 'react';

export interface ButtonProps {
  label: string;
  variant?: string;
  disabled?: boolean;
  onClick: function;
}

export const Button: React.FC<ButtonProps> = ({ label, variant, disabled, onClick }) => {
  const defaults = {
    variant: 'primary',
    disabled: false,
  };
  return (
    <div className="button">
      {/* Button component */}
      label, variant, disabled, onClick
    </div>
  );
};

Button.displayName = 'Button';
