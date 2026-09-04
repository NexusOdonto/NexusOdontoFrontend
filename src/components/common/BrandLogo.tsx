import React from 'react';
import nexusLogoIcon from '../../assets/nexus-odonto-logo.webp';

export interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  imageClassName = 'h-9 md:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
  textClassName = 'text-2xl md:text-3xl',
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 1. Isotipo Oficial */}
      <img
        src={nexusLogoIcon}
        alt="NexusOdonto"
        className={imageClassName}
      />

      {/* 2. Texto Tipográfico Adaptativo Light / Dark */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold tracking-tight leading-none ${textClassName}`}>
            <span className="text-slate-900 dark:text-white transition-colors duration-200">
              Nexus
            </span>
            <span className="text-teal-700 dark:text-teal-400 transition-colors duration-200">
              Odonto
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
