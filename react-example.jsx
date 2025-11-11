/**
 * React Integration Example for ValidityState-based Form Validation
 *
 * This demonstrates how to use ValidityState in React while maintaining
 * framework-independent validation logic for design systems.
 */

import { useState, useRef, useCallback } from 'react';

// ============================================================================
// FRAMEWORK-INDEPENDENT VALIDATION LOGIC
// This exact same logic can be used in Ember, Vue, or vanilla JS
// ============================================================================

/**
 * Get a human-readable error message from ValidityState
 * This function is framework-agnostic and can be shared across your design system
 */
function getValidationMessage(input) {
  const validity = input.validity;

  if (validity.valid) {
    return '';
  }

  // Get friendly field label
  const label = input.getAttribute('aria-label') ||
                input.name ||
                input.id ||
                'This field';

  // Check ValidityState properties in order of priority
  if (validity.valueMissing) {
    return `${label} is required.`;
  }

  if (validity.typeMismatch) {
    if (input.type === 'email') {
      return `${label}: Please enter a valid email address.`;
    }
    if (input.type === 'url') {
      return `${label}: Please enter a valid URL.`;
    }
    return `${label}: Please match the requested format.`;
  }

  if (validity.tooShort) {
    return `${label}: Please enter at least ${input.minLength} characters (you entered ${input.value.length}).`;
  }

  if (validity.tooLong) {
    return `${label}: Please enter no more than ${input.maxLength} characters.`;
  }

  if (validity.rangeUnderflow) {
    return `${label}: Please enter a value greater than or equal to ${input.min}.`;
  }

  if (validity.rangeOverflow) {
    return `${label}: Please enter a value less than or equal to ${input.max}.`;
  }

  if (validity.patternMismatch) {
    return `${label}: ${input.title || 'Please match the requested format.'}`;
  }

  if (validity.stepMismatch) {
    return `${label}: Please enter a valid value. The two nearest valid values are ${input.min} and ${input.max}.`;
  }

  if (validity.badInput) {
    return `${label}: Please enter a valid value.`;
  }

  if (validity.customError) {
    return `${label}: ${input.validationMessage}`;
  }

  return input.validationMessage || `${label}: Please enter a valid value.`;
}

// ============================================================================
// REACT HOOK - Framework-specific wrapper around ValidityState
// ============================================================================

/**
 * Custom React hook for form validation using ValidityState
 *
 * This provides a React-friendly API while using native browser validation
 *
 * @returns {Object} Form validation utilities
 */
export function useFormValidation() {
  const formRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate all inputs in the form using ValidityState
   * Returns true if valid, false if invalid
   */
  const validateForm = useCallback(() => {
    if (!formRef.current) return true;

    setIsValidating(true);

    const inputs = formRef.current.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      // Use native checkValidity() method
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input),
          input: input // Keep reference for focus management
        });
      }
    });

    setErrors(newErrors);
    setIsValidating(false);

    // Focus first invalid input
    if (newErrors.length > 0 && newErrors[0].input) {
      newErrors[0].input.focus();
    }

    return newErrors.length === 0;
  }, []);

  /**
   * Validate a single input field
   */
  const validateField = useCallback((input) => {
    if (!input) return true;

    if (!input.checkValidity()) {
      const error = {
        field: input.name || input.id,
        message: getValidationMessage(input),
        input: input
      };

      // Update errors array, replacing existing error for this field
      setErrors(prev => {
        const filtered = prev.filter(e => e.field !== error.field);
        return [...filtered, error];
      });

      return false;
    } else {
      // Remove error for this field if it's now valid
      setErrors(prev => prev.filter(e => e.field !== (input.name || input.id)));
      return true;
    }
  }, []);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Set custom validation message on an input
   */
  const setCustomValidity = useCallback((input, message) => {
    if (input) {
      input.setCustomValidity(message);
    }
  }, []);

  return {
    formRef,
    errors,
    isValidating,
    validateForm,
    validateField,
    clearErrors,
    setCustomValidity,
    hasErrors: errors.length > 0
  };
}

// ============================================================================
// ERROR SUMMARY COMPONENT
// ============================================================================

function ErrorSummary({ errors }) {
  if (errors.length === 0) return null;

  return (
    <div className="error-summary" role="alert" aria-live="polite">
      <h3>
        Please fix the following {errors.length} error{errors.length === 1 ? '' : 's'}:
      </h3>
      <ul>
        {errors.map((error, index) => (
          <li key={`${error.field}-${index}`}>
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE COMPONENTS
// ============================================================================

/**
 * Example 1: Basic Form with ValidityState
 */
export function BasicForm() {
  const { formRef, errors, validateForm, clearErrors } = useFormValidation();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const formData = new FormData(formRef.current);
      console.log('Form is valid!', Object.fromEntries(formData));
      alert('Form submitted successfully!');
      clearErrors();
      formRef.current.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <ErrorSummary errors={errors} />

      <div className="form-group">
        <label htmlFor="email">Email (required):</label>
        <input
          type="email"
          id="email"
          name="email"
          aria-label="Email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username (3-15 characters, alphanumeric):</label>
        <input
          type="text"
          id="username"
          name="username"
          aria-label="Username"
          required
          minLength={3}
          maxLength={15}
          pattern="[a-zA-Z0-9]+"
          title="Only letters and numbers allowed"
        />
      </div>

      <div className="form-group">
        <label htmlFor="age">Age (18-120):</label>
        <input
          type="number"
          id="age"
          name="age"
          aria-label="Age"
          required
          min={18}
          max={120}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Example 2: Form with Custom Validation (Password Match)
 */
export function PasswordForm() {
  const { formRef, errors, validateForm, clearErrors, setCustomValidity } = useFormValidation();
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const validatePasswordMatch = useCallback(() => {
    if (passwordRef.current && confirmRef.current) {
      if (confirmRef.current.value !== passwordRef.current.value) {
        setCustomValidity(confirmRef.current, 'Passwords do not match');
        return false;
      } else {
        setCustomValidity(confirmRef.current, '');
        return true;
      }
    }
    return true;
  }, [setCustomValidity]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Run custom validation before form validation
    validatePasswordMatch();

    if (validateForm()) {
      console.log('Form is valid and passwords match!');
      alert('Password form submitted successfully!');
      clearErrors();
      formRef.current.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <ErrorSummary errors={errors} />

      <div className="form-group">
        <label htmlFor="email2">Email:</label>
        <input
          type="email"
          id="email2"
          name="email"
          aria-label="Email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password (min 8 characters):</label>
        <input
          ref={passwordRef}
          type="password"
          id="password"
          name="password"
          aria-label="Password"
          required
          minLength={8}
          onChange={validatePasswordMatch}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          ref={confirmRef}
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          aria-label="Confirm Password"
          required
          onChange={validatePasswordMatch}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Example 3: Real-time Field Validation
 */
export function RealtimeValidationForm() {
  const { formRef, errors, validateForm, validateField, clearErrors } = useFormValidation();

  const handleBlur = (e) => {
    // Validate individual field on blur
    validateField(e.target);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Form is valid!');
      alert('Form submitted successfully!');
      clearErrors();
      formRef.current.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <ErrorSummary errors={errors} />

      <div className="form-group">
        <label htmlFor="email3">Email (validated on blur):</label>
        <input
          type="email"
          id="email3"
          name="email"
          aria-label="Email"
          required
          onBlur={handleBlur}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone (US format):</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          aria-label="Phone"
          required
          pattern="\(\d{3}\) \d{3}-\d{4}"
          title="Format: (123) 456-7890"
          placeholder="(123) 456-7890"
          onBlur={handleBlur}
        />
      </div>

      <div className="form-group">
        <label htmlFor="website">Website (optional):</label>
        <input
          type="url"
          id="website"
          name="website"
          aria-label="Website"
          placeholder="https://example.com"
          onBlur={handleBlur}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

// ============================================================================
// DEMO APP
// ============================================================================

export default function App() {
  return (
    <div className="container">
      <h1>ValidityState in React - Design System Example</h1>
      <p className="intro">
        Framework-independent validation using native browser APIs
      </p>

      <section className="example">
        <h2>1. Basic HTML5 Validation</h2>
        <BasicForm />
      </section>

      <section className="example">
        <h2>2. Custom Validation (Password Match)</h2>
        <PasswordForm />
      </section>

      <section className="example">
        <h2>3. Real-time Validation</h2>
        <RealtimeValidationForm />
      </section>
    </div>
  );
}
