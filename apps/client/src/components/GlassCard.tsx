import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "accent" | "elevated" | "subtle";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hoverEffect?: boolean;
  blurIntensity?: "light" | "medium" | "heavy";
  gradient?: boolean;
}

export const GlassCard = ({
  children,
  className = "",
  variant = "default",
  padding = "md",
  hoverEffect = true,
  blurIntensity = "medium",
  gradient = true,
}: GlassCardProps) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5 md:p-6",
    lg: "p-7 md:p-8",
    xl: "p-9 md:p-10",
  };

  const variantClasses = {
    default: "glass-card",
    accent: "glass-card--accent",
    elevated: "glass-card--elevated",
    subtle: "glass-card--subtle",
  };

  const blurIntensityClasses = {
    light: "backdrop-blur-sm",
    medium: "backdrop-blur-md",
    heavy: "backdrop-blur-lg",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        glass-container
        ${variantClasses[variant]}
        ${blurIntensityClasses[blurIntensity]}
        ${paddingClasses[padding]}
        ${gradient ? "has-gradient" : ""}
        ${hoverEffect ? "hover-effect" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

interface GlassMetricProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export const GlassMetric = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  className = "",
}: GlassMetricProps) => (
  <GlassCard variant="subtle" padding="md" blurIntensity="light" className={className}>
    <div className="glass-metric">
      <div className="glass-metric__header">
        {icon && <div className="glass-metric__icon">{icon}</div>}
        <span className="glass-metric__label">{label}</span>
      </div>
      <div className="glass-metric__content">
        <div className="glass-metric__value">{value}</div>
        {trend && trendValue && (
          <div className={`glass-metric__trend trend--${trend}`}>
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} {trendValue}
          </div>
        )}
      </div>
    </div>
  </GlassCard>
);

interface GlassStatProps {
  title: string;
  value: number;
  max?: number;
  unit?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}

export const GlassStat = ({
  title,
  value,
  max = 100,
  unit = "",
  color = "primary",
  size = "md",
}: GlassStatProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClasses = {
    sm: "glass-stat--sm",
    md: "glass-stat--md",
    lg: "glass-stat--lg",
  };

  return (
    <GlassCard variant="accent" padding="lg" className={`glass-stat ${sizeClasses[size]} color--${color}`}>
      <div className="glass-stat__content">
        <h3 className="glass-stat__title">{title}</h3>
        <div className="glass-stat__value">
          {value}
          {unit && <span className="glass-stat__unit">{unit}</span>}
        </div>
        <div className="glass-stat__bar">
          <motion.div
            className="glass-stat__bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="glass-stat__percentage">{Math.round(percentage)}%</div>
      </div>
    </GlassCard>
  );
};

interface GlassFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  accent?: boolean;
}

export const GlassFormSection = ({
  title,
  description,
  children,
  accent = false,
}: GlassFormSectionProps) => (
  <GlassCard
    variant={accent ? "accent" : "default"}
    padding="lg"
    blurIntensity="medium"
    className="glass-form-section"
  >
    <div className="glass-form-section__header">
      <h2 className="glass-form-section__title">{title}</h2>
      {description && <p className="glass-form-section__description">{description}</p>}
    </div>
    <div className="glass-form-section__content">{children}</div>
  </GlassCard>
);

interface GlassButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "glass" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const GlassButton = ({
  children,
  variant = "glass",
  size = "md",
  fullWidth = false,
  onClick,
  disabled = false,
  icon,
  className = "",
}: GlassButtonProps) => {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3",
    lg: "px-7 py-4 text-lg",
  };

  const variantClasses = {
    primary: "glass-button--primary",
    secondary: "glass-button--secondary",
    glass: "glass-button--glass",
    ghost: "glass-button--ghost",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        glass-button
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "glass-button--disabled" : ""}
        ${className}
      `}
    >
      {icon && <span className="glass-button__icon">{icon}</span>}
      <span className="glass-button__label">{children}</span>
    </motion.button>
  );
};
