import type { ReactNode, InputHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = ""
}: FormFieldProps) => (
  <div className={`form-field ${className}`}>
    <label className="form-field__label">
      {label}
      {required && <span className="form-field__required" aria-label="required">*</span>}
    </label>

    {hint && (
      <p className="form-field__hint">
        {hint}
      </p>
    )}

    <div className="form-field__input-wrapper">
      {children}
    </div>

    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="form-field__error"
        role="alert"
      >
        {error}
      </motion.p>
    )}
  </div>
);

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <motion.fieldset
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="form-section"
  >
    <legend className="form-section__legend">
      <h2 className="form-section__title">{title}</h2>
      {description && <p className="form-section__description">{description}</p>}
    </legend>
    <div className="form-section__content">
      {children}
    </div>
  </motion.fieldset>
);

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressIndicator = ({ current, total, label }: ProgressIndicatorProps) => (
  <div className="progress-indicator" aria-label={label || `Step ${current} of ${total}`}>
    <div className="progress-indicator__track">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="progress-indicator__step"
          data-completed={i < current}
          data-current={i === current - 1}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
    <p className="progress-indicator__label">
      <span className="progress-indicator__current">{current}</span>
      <span className="progress-indicator__separator">/</span>
      <span className="progress-indicator__total">{total}</span>
      {label && <span className="progress-indicator__text">{label}</span>}
    </p>
  </div>
);

interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onDismiss?: () => void;
}

export const Toast = ({ message, type = "info", onDismiss }: ToastProps) => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    className={`toast toast--${type}`}
    role="status"
    aria-live="polite"
  >
    <p className="toast__message">{message}</p>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="toast__close"
        aria-label="Close notification"
      >
        ✕
      </button>
    )}
  </motion.div>
);
