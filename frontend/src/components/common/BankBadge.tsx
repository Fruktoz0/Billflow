import React from 'react';
import { BankAccount } from '../../types';
import { findBankPreset } from '../../utils/bankPresets';

interface BankBadgeProps {
  account?: BankAccount | null;
  bankCode?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const BankBadge: React.FC<BankBadgeProps> = ({
  account,
  bankCode,
  size = 'md',
  className = '',
  showTooltip = true
}) => {
  const preset = findBankPreset(bankCode || account?.bankCode || account?.name || account?.type);
  const tooltipText = account?.name || preset.name;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }[size];

  // Authentic realistic SVG bank emblems
  const renderSvgLogo = () => {
    switch (preset.id) {
      case 'otp':
        // OTP authentic green shield emblem with concentric arcs
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#008836" />
            <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2.4" />
            <circle cx="16" cy="16" r="4.5" fill="white" />
            <path d="M16 7V11.5M16 20.5V25M7 16H11.5M20.5 16H25" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'revolut':
        // Revolut authentic bold R monogram
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#191C1F" />
            <path
              d="M10 8h7.2c3.2 0 5.4 1.8 5.4 4.5 0 2.2-1.4 3.7-3.4 4.2l4.2 7.3h-4.3l-3.6-6.6H13.8v6.6H10V8zm3.8 6.4h3.2c1.3 0 2.2-.7 2.2-1.9 0-1.1-.9-1.9-2.2-1.9h-3.2v3.8z"
              fill="white"
            />
          </svg>
        );

      case 'erste':
        // Erste Bank blue with authentic stylized S-arc emblem
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#0066B3" />
            <circle cx="20" cy="12" r="3.2" fill="#E2001A" />
            <path
              d="M9 14.5c0-3 2.5-5.5 6-5.5 4 0 6.5 2 6.5 5.2 0 3.8-3.5 5.5-6.5 6.5-3 1-4 1.8-4 3.2 0 1.5 1.5 2.6 4 2.6 3 0 5.2-1.4 6-3.2l2.6 1.4c-1.3 2.8-4.5 4.8-8.6 4.8-4.8 0-7.6-2.8-7.6-6.2 0-4 3.8-5.8 7-6.8 3-1 3.8-1.7 3.8-2.8 0-1.2-1.2-2.2-3.2-2.2-2.5 0-4 1.3-4.6 2.8L9 14.5z"
              fill="white"
            />
          </svg>
        );

      case 'unicredit':
        // UniCredit authentic red circular emblem with iconic '1'
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#ED1C24" />
            <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
            <path
              d="M13 14.2l2.6-2.2h2.2v10H15.2v-6.8l-1.4 1-0.8-2z"
              fill="white"
            />
            <circle cx="21.5" cy="10.5" r="2" fill="white" />
          </svg>
        );

      case 'kh':
        // K&H Bank authentic blue with sail geometry
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#003399" />
            <path d="M7 23V9h4v5.5l5-5.5h5l-6 6.5 6.5 7.5h-5.2l-4.3-5.2V23H7z" fill="#00A3E0" />
            <path d="M22 23V9h3v14h-3z" fill="white" />
          </svg>
        );

      case 'raiffeisen':
        // Raiffeisen Bank authentic yellow square with black crossed beams (Giebelkreuz)
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#FEE600" />
            <path
              d="M16 6l-6 6h3.5l2.5-2.5 2.5 2.5H22l-6-6zM10 16l6 6 6-6h-3.5L16 18.5 13.5 16H10z"
              fill="#1A1A1A"
            />
            <path d="M12 11l4 4 4-4v10l-4-4-4 4V11z" fill="#1A1A1A" />
          </svg>
        );

      case 'mbh':
        // MBH Bank authentic deep blue monogram
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#003B77" />
            <path
              d="M7 23V9h3.5l3.5 6.5L17.5 9H21v14h-3v-7.5l-3.5 6.5h-1L10 15.5V23H7z"
              fill="#00D2C4"
            />
            <circle cx="24" cy="16" r="2.5" fill="white" />
          </svg>
        );

      case 'cib':
        // CIB Bank navy blue with gold arc emblem
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#002D62" />
            <path d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10H22c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c2 0 3.7 1 4.8 2.5l3.2-3.2C22.2 7.3 19.3 6 16 6z" fill="#FFD100" />
            <circle cx="16" cy="16" r="2.5" fill="white" />
          </svg>
        );

      case 'granit':
        // Gránit Bank charcoal with diamond geometry
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#2B303A" />
            <polygon points="16,6 26,16 16,26 6,16" stroke="#E0E6ED" strokeWidth="2.5" fill="none" />
            <polygon points="16,11 21,16 16,21 11,16" fill="#E0E6ED" />
          </svg>
        );

      case 'magnet':
        // MagNet Bank green eco leaf emblem
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#459E27" />
            <path
              d="M16 6c5.5 0 10 4.5 10 10 0 5.5-4.5 10-10 10-1.5 0-3-.3-4.3-.9 5-2 8.3-6.9 8.3-12.6V6h-4z"
              fill="white"
            />
            <circle cx="12" cy="18" r="4" fill="#A4D65E" />
          </svg>
        );

      case 'cetelem':
        // Cetelem Bank green circle with smile arc
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#008752" />
            <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2.2" />
            <circle cx="12" cy="14" r="1.5" fill="white" />
            <circle cx="20" cy="14" r="1.5" fill="white" />
            <path d="M12 18.5c1.2 1.5 2.6 2 4 2s2.8-.5 4-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'wise':
        // Wise neon fast arrow
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#163300" />
            <path
              d="M7 11h9l-5.5 12h3.5L25 9H13l2-3H9l-2 5z"
              fill="#9FE870"
            />
          </svg>
        );

      case 'mak':
        // Magyar Államkincstár gold/bronze crest emblem
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#8C6D3B" />
            <path d="M16 7l8 4v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11v-6l8-4z" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 12v8M12 16h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'cash':
        // Cash green realistic banknote
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill="#27AE60" />
            <rect x="6" y="10" width="20" height="12" rx="2" stroke="white" strokeWidth="1.8" fill="none" />
            <circle cx="16" cy="16" r="3" fill="white" />
            <circle cx="9" cy="16" r="1" fill="white" />
            <circle cx="23" cy="16" r="1" fill="white" />
          </svg>
        );

      case 'custom':
      default:
        // Custom Greek column bank building
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full rounded-md shadow-xs" fill="none">
            <rect width="32" height="32" rx="6" fill={account?.color || preset.brandColor} />
            <path d="M7 11l9-5 9 5v2H7v-2z" fill="white" />
            <rect x="9" y="14" width="2.5" height="7" fill="white" />
            <rect x="14.75" y="14" width="2.5" height="7" fill="white" />
            <rect x="20.5" y="14" width="2.5" height="7" fill="white" />
            <rect x="7" y="22" width="18" height="2.5" rx="0.5" fill="white" />
          </svg>
        );
    }
  };

  return (
    <div
      title={showTooltip ? tooltipText : undefined}
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeClasses} ${className}`}
    >
      {renderSvgLogo()}
    </div>
  );
};
