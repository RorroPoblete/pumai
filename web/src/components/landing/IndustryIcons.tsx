const iconClass = "w-full h-full";

export function HealthcareIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heart with pulse line */}
      <defs>
        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path
        d="M24 42s-16-9.2-16-20.6C8 14.8 13.4 10 19.2 10c3.2 0 6.2 1.8 4.8 1.8 4.8S27 10 28.8 10C34.6 10 40 14.8 40 21.4 40 32.8 24 42 24 42z"
        fill="url(#healthGrad)"
        opacity="0.15"
      />
      <path
        d="M24 40s-14-8.4-14-18.6C10 15.6 14.6 12 19.2 12c2.6 0 4.8 1.4 4.8 1.4S26.2 12 28.8 12C33.4 12 38 15.6 38 21.4 38 31.6 24 40 24 40z"
        stroke="url(#healthGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Pulse line */}
      <path
        d="M10 24h8l2-6 4 12 3-8 2 2h9"
        stroke="#A78BFA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AutomotiveIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="autoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Car body */}
      <rect x="6" y="22" width="36" height="12" rx="3" fill="url(#autoGrad)" opacity="0.15" />
      <path
        d="M10 22l4-8h20l4 8"
        stroke="url(#autoGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="6" y="22" width="36" height="12" rx="3"
        stroke="url(#autoGrad)"
        strokeWidth="2"
        fill="none"
      />
      {/* Wheels */}
      <circle cx="15" cy="34" r="4" fill="#0a0a0a" stroke="#A78BFA" strokeWidth="2" />
      <circle cx="15" cy="34" r="1.5" fill="#8B5CF6" />
      <circle cx="33" cy="34" r="4" fill="#0a0a0a" stroke="#A78BFA" strokeWidth="2" />
      <circle cx="33" cy="34" r="1.5" fill="#8B5CF6" />
      {/* Windows */}
      <path d="M16 22l3-6h5v6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 16h5l3 6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      {/* Headlight */}
      <rect x="38" y="25" width="3" height="3" rx="1" fill="#A78BFA" opacity="0.6" />
    </svg>
  );
}

export function RealEstateIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="estateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Building */}
      <rect x="8" y="16" width="16" height="24" rx="1" fill="url(#estateGrad)" opacity="0.12" />
      <rect x="8" y="16" width="16" height="24" rx="1" stroke="url(#estateGrad)" strokeWidth="2" fill="none" />
      {/* Building 2 */}
      <rect x="26" y="10" width="14" height="30" rx="1" fill="url(#estateGrad)" opacity="0.08" />
      <rect x="26" y="10" width="14" height="30" rx="1" stroke="url(#estateGrad)" strokeWidth="2" fill="none" />
      {/* Windows building 1 */}
      <rect x="12" y="20" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="17" y="20" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="12" y="26" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="17" y="26" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      {/* Door */}
      <rect x="14" y="34" width="4" height="6" rx="0.5" fill="#8B5CF6" opacity="0.4" />
      {/* Windows building 2 */}
      <rect x="30" y="14" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="35" y="14" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="30" y="20" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="35" y="20" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="30" y="26" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="35" y="26" width="3" height="3" rx="0.5" fill="#A78BFA" opacity="0.5" />
      {/* Antenna */}
      <line x1="33" y1="10" x2="33" y2="5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="33" cy="4" r="1.5" fill="#8B5CF6" />
    </svg>
  );
}

export function EcommerceIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ecomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Bag body */}
      <path
        d="M10 18h28l-3 22H13L10 18z"
        fill="url(#ecomGrad)"
        opacity="0.12"
      />
      <path
        d="M10 18h28l-3 22H13L10 18z"
        stroke="url(#ecomGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Handle */}
      <path
        d="M18 18v-4a6 6 0 1112 0v4"
        stroke="#A78BFA"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Star/sparkle */}
      <path
        d="M24 26l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L19 29.5l3.5-.5L24 26z"
        fill="#8B5CF6"
        opacity="0.5"
      />
    </svg>
  );
}

export function TradesIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tradeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Wrench */}
      <path
        d="M14 34l14-14"
        stroke="url(#tradeGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M32 10a8 8 0 00-10.5 10.5L14 28l6 6 7.5-7.5A8 8 0 0032 10z"
        fill="url(#tradeGrad)"
        opacity="0.12"
        stroke="url(#tradeGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bolt head */}
      <circle cx="30" cy="18" r="3" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <circle cx="30" cy="18" r="1" fill="#8B5CF6" />
      {/* Handle grip */}
      <rect x="10" y="30" width="8" height="8" rx="2" fill="url(#tradeGrad)" opacity="0.15" stroke="url(#tradeGrad)" strokeWidth="1.5" transform="rotate(-45 14 34)" />
      {/* Spark */}
      <line x1="36" y1="12" x2="40" y2="8" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="16" x2="42" y2="14" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HospitalityIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hospGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Cloche dome */}
      <path
        d="M8 30h32"
        stroke="url(#hospGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 30c0-8 5.4-14 12-14s12 6 12 14"
        fill="url(#hospGrad)"
        opacity="0.12"
        stroke="url(#hospGrad)"
        strokeWidth="2"
      />
      {/* Handle */}
      <line x1="24" y1="16" x2="24" y2="12" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="10" r="2" fill="#8B5CF6" opacity="0.6" stroke="#A78BFA" strokeWidth="1.5" />
      {/* Plate */}
      <path
        d="M6 30c0 2 4 4 18 4s18-2 18-4"
        stroke="url(#hospGrad)"
        strokeWidth="2"
        fill="url(#hospGrad)"
        fillOpacity="0.08"
      />
      {/* Steam lines */}
      <path d="M18 8c0-2 2-3 1-5" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M24 6c0-2 2-3 1-5" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M30 8c0-2 2-3 1-5" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
