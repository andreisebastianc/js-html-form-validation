# Integrating ValidityState with Ember.js

ValidityState is framework-independent and integrates elegantly with Ember.js using components and tracked properties, maintaining the same validation logic across all frameworks.

## Key Benefits for Design Systems

1. **Framework Independence**: Same validation logic works in React, Ember.js, Vue, vanilla JS
2. **Native Browser APIs**: No additional validation libraries needed
3. **Consistent Behavior**: All frameworks use the same ValidityState properties
4. **HTML-First**: Validation rules live in HTML attributes, making them portable

## Approach: Component-Based Pattern

The best approach for Ember.js is to create reusable components that wrap ValidityState:

```javascript
// app/components/validated-form.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

// Framework-independent validation logic (same as React and vanilla JS)
function getValidationMessage(input) {
  const validity = input.validity;

  if (validity.valid) return '';

  const label = input.getAttribute('aria-label') || input.name || input.id || 'This field';

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

export default class ValidatedFormComponent extends Component {
  @tracked errors = [];
  formElement = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  validateForm(event) {
    event.preventDefault();

    if (!this.formElement) return;

    const inputs = this.formElement.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input)
        });
      }
    });

    this.errors = newErrors;

    if (newErrors.length === 0) {
      // Form is valid - call the onSubmit callback
      const formData = new FormData(this.formElement);
      this.args.onSubmit?.(Object.fromEntries(formData));
    }
  }

  @action
  clearErrors() {
    this.errors = [];
  }
}
```

## Error Summary Component

```javascript
// app/components/error-summary.js
import Component from '@glimmer/component';

export default class ErrorSummaryComponent extends Component {
  get hasErrors() {
    return this.args.errors?.length > 0;
  }

  get errorCount() {
    return this.args.errors?.length || 0;
  }

  get pluralSuffix() {
    return this.errorCount === 1 ? '' : 's';
  }
}
```

```handlebars
{{! app/components/error-summary.hbs }}
{{#if this.hasErrors}}
  <div class="error-summary" role="alert" aria-live="polite">
    <h3>
      Please fix the following {{this.errorCount}} error{{this.pluralSuffix}}:
    </h3>
    <ul>
      {{#each @errors as |error|}}
        <li>{{error.message}}</li>
      {{/each}}
    </ul>
  </div>
{{/if}}
```

## Example 1: Basic Form Component

```javascript
// app/components/registration-form.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

// Import the shared validation function
function getValidationMessage(input) {
  // ... same implementation as above
}

export default class RegistrationFormComponent extends Component {
  @tracked errors = [];
  formElement = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    const inputs = this.formElement.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input)
        });
      }
    });

    this.errors = newErrors;

    if (newErrors.length === 0) {
      const formData = new FormData(this.formElement);
      console.log('Form is valid!', Object.fromEntries(formData));
      alert('Form submitted successfully!');
      this.errors = [];
      this.formElement.reset();
    }
  }
}
```

```handlebars
{{! app/components/registration-form.hbs }}
<form {{on "submit" this.handleSubmit}} {{did-insert this.registerForm}} novalidate>
  <ErrorSummary @errors={{this.errors}} />

  <div class="form-group">
    <label for="email">Email (required):</label>
    <Input
      @type="email"
      id="email"
      name="email"
      aria-label="Email"
      required={{true}}
    />
  </div>

  <div class="form-group">
    <label for="username">Username (3-15 characters, alphanumeric):</label>
    <Input
      @type="text"
      id="username"
      name="username"
      aria-label="Username"
      required={{true}}
      minlength="3"
      maxlength="15"
      pattern="[a-zA-Z0-9]+"
      title="Only alphanumeric characters allowed"
    />
  </div>

  <div class="form-group">
    <label for="age">Age (18-120):</label>
    <Input
      @type="number"
      id="age"
      name="age"
      aria-label="Age"
      required={{true}}
      min="18"
      max="120"
    />
  </div>

  <button type="submit">Submit</button>
</form>
```

## Example 2: Custom Validation (Password Match)

```javascript
// app/components/password-form.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

function getValidationMessage(input) {
  // ... same implementation
}

export default class PasswordFormComponent extends Component {
  @tracked errors = [];
  formElement = null;
  passwordInput = null;
  confirmInput = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  registerPassword(element) {
    this.passwordInput = element;
  }

  @action
  registerConfirm(element) {
    this.confirmInput = element;
  }

  @action
  validatePasswordMatch() {
    if (this.passwordInput && this.confirmInput) {
      if (this.confirmInput.value !== this.passwordInput.value) {
        this.confirmInput.setCustomValidity('Passwords do not match');
      } else {
        this.confirmInput.setCustomValidity('');
      }
    }
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    // Run custom validation
    this.validatePasswordMatch();

    const inputs = this.formElement.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input)
        });
      }
    });

    this.errors = newErrors;

    if (newErrors.length === 0) {
      console.log('Form is valid and passwords match!');
      alert('Password form submitted successfully!');
      this.errors = [];
      this.formElement.reset();
    }
  }
}
```

```handlebars
{{! app/components/password-form.hbs }}
<form {{on "submit" this.handleSubmit}} {{did-insert this.registerForm}} novalidate>
  <ErrorSummary @errors={{this.errors}} />

  <div class="form-group">
    <label for="email2">Email:</label>
    <Input
      @type="email"
      id="email2"
      name="email"
      aria-label="Email"
      required={{true}}
    />
  </div>

  <div class="form-group">
    <label for="password">Password (min 8 characters):</label>
    <Input
      @type="password"
      id="password"
      name="password"
      aria-label="Password"
      required={{true}}
      minlength="8"
      {{did-insert this.registerPassword}}
      {{on "input" this.validatePasswordMatch}}
    />
  </div>

  <div class="form-group">
    <label for="confirmPassword">Confirm Password:</label>
    <Input
      @type="password"
      id="confirmPassword"
      name="confirmPassword"
      aria-label="Confirm Password"
      required={{true}}
      {{did-insert this.registerConfirm}}
      {{on "input" this.validatePasswordMatch}}
    />
  </div>

  <button type="submit">Submit</button>
</form>
```

## Example 3: Real-time Field Validation

```javascript
// app/components/realtime-form.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

function getValidationMessage(input) {
  // ... same implementation
}

export default class RealtimeFormComponent extends Component {
  @tracked errors = [];
  formElement = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  validateField(event) {
    const input = event.target;

    if (!input.checkValidity()) {
      const error = {
        field: input.name || input.id,
        message: getValidationMessage(input)
      };

      // Update errors array, replacing existing error for this field
      this.errors = [
        ...this.errors.filter(e => e.field !== error.field),
        error
      ];
    } else {
      // Remove error for this field if it's now valid
      this.errors = this.errors.filter(e => e.field !== (input.name || input.id));
    }
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    const inputs = this.formElement.querySelectorAll('input, select, textarea');
    const newErrors = [];

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        newErrors.push({
          field: input.name || input.id,
          message: getValidationMessage(input)
        });
      }
    });

    this.errors = newErrors;

    if (newErrors.length === 0) {
      console.log('Form is valid!');
      alert('Form submitted successfully!');
      this.errors = [];
      this.formElement.reset();
    }
  }
}
```

```handlebars
{{! app/components/realtime-form.hbs }}
<form {{on "submit" this.handleSubmit}} {{did-insert this.registerForm}} novalidate>
  <ErrorSummary @errors={{this.errors}} />

  <div class="form-group">
    <label for="email3">Email (validated on blur):</label>
    <Input
      @type="email"
      id="email3"
      name="email"
      aria-label="Email"
      required={{true}}
      {{on "blur" this.validateField}}
    />
  </div>

  <div class="form-group">
    <label for="phone">Phone (US format):</label>
    <Input
      @type="tel"
      id="phone"
      name="phone"
      aria-label="Phone"
      required={{true}}
      pattern="\(\d{3}\) \d{3}-\d{4}"
      title="Format: (123) 456-7890"
      placeholder="(123) 456-7890"
      {{on "blur" this.validateField}}
    />
  </div>

  <div class="form-group">
    <label for="website">Website (optional):</label>
    <Input
      @type="url"
      id="website"
      name="website"
      aria-label="Website"
      placeholder="https://example.com"
      {{on "blur" this.validateField}}
    />
  </div>

  <button type="submit">Submit</button>
</form>
```

## Reusable Validation Utility

For even better code reuse, create a utility file:

```javascript
// app/utils/form-validation.js

/**
 * Get a human-readable error message from ValidityState
 * This function is framework-agnostic and can be shared across your design system
 */
export function getValidationMessage(input) {
  const validity = input.validity;

  if (validity.valid) {
    return '';
  }

  const label = input.getAttribute('aria-label') ||
                input.name ||
                input.id ||
                'This field';

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

  if (validity.customError) {
    return `${label}: ${input.validationMessage}`;
  }

  return input.validationMessage || `${label}: Please enter a valid value.`;
}

/**
 * Collect all validation errors from a form
 */
export function collectFormErrors(formElement) {
  const inputs = formElement.querySelectorAll('input, select, textarea');
  const errors = [];

  inputs.forEach(input => {
    if (!input.checkValidity()) {
      errors.push({
        field: input.name || input.id,
        message: getValidationMessage(input),
        input: input
      });
    }
  });

  return errors;
}
```

Then import in your components:

```javascript
import { getValidationMessage, collectFormErrors } from '../utils/form-validation';
```

## Benefits Summary

### For Design System Maintainers:
- ✅ Write validation logic once, use everywhere (React, Ember, Vue, vanilla JS)
- ✅ Document HTML attributes as the source of truth
- ✅ Framework teams can integrate using their patterns
- ✅ No framework-specific validation libraries needed

### For Ember Teams:
- ✅ Use familiar patterns (components, tracked properties, actions)
- ✅ Validation rules live in HTML (portable, readable)
- ✅ Easy to test (just test the component)
- ✅ Works with Ember's component model naturally

### For End Users:
- ✅ Consistent error messages across all apps
- ✅ Accessible error summaries
- ✅ No browser tooltip pop-ups (using `novalidate`)
- ✅ Progressive enhancement friendly

## Comparison with React

Both frameworks can use the exact same `getValidationMessage()` function:

| Aspect | React | Ember.js |
|--------|-------|----------|
| State Management | `useState` | `@tracked` |
| Event Handlers | `useCallback` | `@action` |
| Element Access | `useRef` | `did-insert` modifier |
| Lifecycle | `useEffect` | Modifiers |
| Components | Functional | Class-based (Glimmer) |
| Templates | JSX | Handlebars |

**But the validation logic is identical!**

This makes ValidityState perfect for design systems that need to support multiple frameworks.
