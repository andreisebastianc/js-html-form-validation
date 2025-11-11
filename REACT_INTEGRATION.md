# Integrating ValidityState with React

ValidityState is framework-independent and can be elegantly integrated into React codebases while maintaining the same validation logic across all frameworks.

## Key Benefits for Design Systems

1. **Framework Independence**: Same validation logic works in React, Ember.js, Vue, vanilla JS
2. **Native Browser APIs**: No additional validation libraries needed
3. **Consistent Behavior**: All frameworks use the same ValidityState properties
4. **HTML-First**: Validation rules live in HTML attributes, making them portable

## Approach: Custom Hook Pattern

The best approach is to create a custom hook that wraps ValidityState and bridges it with React state management:

```jsx
import { useState, useRef, useCallback } from 'react';

// Framework-independent validation logic (same as our vanilla JS)
function getValidationMessage(input) {
  const validity = input.validity;

  if (validity.valid) return '';

  const label = input.name || input.id || 'This field';

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
  }
  if (validity.tooShort) {
    return `${label}: Please enter at least ${input.minLength} characters.`;
  }
  if (validity.rangeUnderflow) {
    return `${label}: Must be at least ${input.min}.`;
  }
  if (validity.rangeOverflow) {
    return `${label}: Must be at most ${input.max}.`;
  }
  if (validity.patternMismatch) {
    return `${label}: ${input.title || 'Please match the required format.'}`;
  }
  if (validity.customError) {
    return `${label}: ${input.validationMessage}`;
  }

  return input.validationMessage || `${label}: Please enter a valid value.`;
}

// React hook that wraps ValidityState
function useFormValidation() {
  const formRef = useRef(null);
  const [errors, setErrors] = useState([]);

  const validateForm = useCallback(() => {
    if (!formRef.current) return true;

    const inputs = formRef.current.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input)
        });
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    formRef,
    errors,
    validateForm,
    clearErrors
  };
}

// Example React Component
function RegistrationForm() {
  const { formRef, errors, validateForm, clearErrors } = useFormValidation();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const formData = new FormData(formRef.current);
      console.log('Form is valid!', Object.fromEntries(formData));
      clearErrors();
      // Submit to API
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Error Summary - same pattern as vanilla JS */}
      {errors.length > 0 && (
        <div className="error-summary">
          <h3>Please fix the following {errors.length} error{errors.length === 1 ? '' : 's'}:</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email (required):</label>
        <input
          type="email"
          id="email"
          name="email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username (3-15 characters):</label>
        <input
          type="text"
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={15}
          pattern="[a-zA-Z0-9]+"
          title="Only alphanumeric characters allowed"
        />
      </div>

      <div className="form-group">
        <label htmlFor="age">Age (18-120):</label>
        <input
          type="number"
          id="age"
          name="age"
          required
          min={18}
          max={120}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Advanced: Custom Validation with setCustomValidity

```jsx
function PasswordForm() {
  const { formRef, errors, validateForm, clearErrors } = useFormValidation();
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const validatePasswordMatch = useCallback(() => {
    if (passwordRef.current && confirmRef.current) {
      if (confirmRef.current.value !== passwordRef.current.value) {
        confirmRef.current.setCustomValidity('Passwords do not match');
      } else {
        confirmRef.current.setCustomValidity('');
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    validatePasswordMatch();

    if (validateForm()) {
      console.log('Passwords match and form is valid!');
      // Submit
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div className="error-summary">
          <h3>Please fix the following errors:</h3>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          ref={passwordRef}
          type="password"
          id="password"
          name="password"
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
          required
          onChange={validatePasswordMatch}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

## For Ember.js

The same validation logic works in Ember using refs/element access:

```javascript
// app/components/registration-form.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class RegistrationFormComponent extends Component {
  @tracked errors = [];

  @action
  validateForm(event) {
    event.preventDefault();

    const form = event.target;
    const inputs = form.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input) // Same function!
        });
      }
    });

    this.errors = newErrors;

    if (newErrors.length === 0) {
      // Submit form
      console.log('Form is valid!');
    }
  }
}
```

## Benefits Summary

### For Design System Maintainers:
- ✅ Write validation logic once, use everywhere
- ✅ Document HTML attributes as the source of truth
- ✅ Framework teams can integrate using their patterns
- ✅ No framework-specific validation libraries needed

### For Framework Teams:
- ✅ Use familiar patterns (hooks in React, actions in Ember)
- ✅ Validation rules live in HTML (portable, readable)
- ✅ Easy to test (just test the hook/service)
- ✅ Works with controlled and uncontrolled components

### For End Users:
- ✅ Consistent error messages across all apps
- ✅ Accessible error summaries
- ✅ No browser tooltip pop-ups (using `noValidate`)
- ✅ Progressive enhancement friendly

## Design System Documentation Pattern

When documenting for multiple frameworks:

```markdown
## Validation Rules

All forms use HTML5 validation attributes:

- `required` - Field must have a value
- `type="email"` - Must be valid email format
- `minlength="3"` - Minimum character count
- `pattern="[A-Z]+"` - Custom regex validation

### Implementation

**React**: Use the `useFormValidation` hook
**Ember**: Use the `form-validation` service
**Vue**: Use the `useFormValidation` composable
**Vanilla JS**: Use the `validateForm()` function

All implementations check `input.validity` properties and use
`getValidationMessage()` to generate consistent error text.
```

This approach gives you framework independence while working naturally within each framework's patterns!
