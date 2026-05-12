import React from 'react';

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  changeType?: "positive" | "negative";
  description?: string;
  iconGradient?: string;
  bgTint?: string;
  borderColor?: string;
  /** Override icon background — Starbucks Green Accent by default */
  iconBg?: string;
}

/**
 * Starbucks-inspired Admin Stat Card
 *
 * Design rules (DESIGN.md):
 * - White card surface, 12px border-radius
 * - Whisper-soft shadow stack
 * - Icon container: House Green (#1E3932) by default
 * - Title: Text Black Soft, UPPERCASE, tight tracking
 * - Value: Large, Starbucks Green (#006241) heading weight
 * - Change badge: pill-shaped (50px radius)
 */
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  description,
  iconGradient,
  bgTint,
  borderColor,
  iconBg,
}: AdminStatCardProps) {
  // Derive icon background: use iconBg prop, or derive from iconGradient, or default to House Green
  const iconBackground = iconBg
    ? iconBg
    : iconGradient
    ? `linear-gradient(135deg, var(--tw-gradient-from, #1E3932), var(--tw-gradient-to, #2b5148))`
    : '#1E3932';

  return (
    <div
      className={`
        bg-white dark:bg-neutral-900 rounded-xl border
        hover:shadow-md hover:-translate-y-0.5
        transition-all duration-300 overflow-hidden relative
        ${borderColor || 'border-neutral-200 dark:border-neutral-800'}
      `}
      style={{
        boxShadow: '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)',
      }}
    >
      {/* Subtle warm canvas tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl dark:hidden"
        style={{ background: 'rgba(242,240,235,0.25)' }}
      />

      <div className="p-5 relative">
        <div className="flex items-start justify-between gap-3">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2 truncate text-neutral-500 dark:text-neutral-400"
              style={{ letterSpacing: '0.08em' }}
            >
              {title}
            </p>
            <p
              className="text-2xl font-bold mb-1 truncate text-green-800 dark:text-green-400"
              style={{ letterSpacing: '-0.16px' }}
            >
              {value}
            </p>
            {(change || description) && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {change && (
                  <span
                    className={`
                      text-[10px] font-bold px-2 py-0.5 whitespace-nowrap rounded-[50px]
                      ${changeType === 'negative' 
                        ? 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                    `}
                  >
                    {change}
                  </span>
                )}
                {description && (
                  <span
                    className="text-[11px] line-clamp-1 text-neutral-500 dark:text-neutral-400"
                  >
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Icon — House Green background */}
          <div
            className={`
              w-11 h-11 rounded-xl flex items-center justify-center
              shadow-sm shrink-0
              ${iconGradient ? `bg-gradient-to-br ${iconGradient}` : ''}
            `}
            style={!iconGradient ? { backgroundColor: iconBg || '#1E3932' } : {}}
          >
            {Icon && <Icon className="w-5 h-5 text-white" />}
          </div>
        </div>
      </div>
    </div>
  );
}
