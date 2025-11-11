/**
 * Ember.js Integration Example for ValidityState-based Form Validation
 *
 * This demonstrates how to use ValidityState in Ember.js while maintaining
 * framework-independent validation logic for design systems.
 */

// ============================================================================
// FRAMEWORK-INDEPENDENT VALIDATION LOGIC
// This exact same logic can be used in React, Vue, or vanilla JS
// ============================================================================

/**
 * Get a human-readable error message from ValidityState
 * This function is framework-agnostic and can be shared across your design system
 *
 * Can be placed in: app/utils/form-validation.js
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

/**
 * Collect all validation errors from a form
 */
function collectFormErrors(formElement) {
  const inputs = formElement.querySelectorAll('input, select, textarea');
  const errors = [];

  inputs.forEach(input => {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup?.querySelector('.error-message');

    // Ensure input has an ID for linking
    if (!input.id) {
      input.id = input.name || `input-${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!input.checkValidity()) {
      const errorMessage = getValidationMessage(input);

      errors.push({
        field: input.name || input.id,
        inputId: input.id,
        message: errorMessage,
        input: input
      });

      // Show inline error message
      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
    } else {
      // Clear inline error message
      if (errorElement) {
        errorElement.textContent = '';
      }
    }
  });

  return errors;
}

// ============================================================================
// ERROR SUMMARY COMPONENT
// app/components/error-summary.js
// ============================================================================

import Component from '@glimmer/component';

export class ErrorSummaryComponent extends Component {
  get hasErrors() {
    return this.args.errors?.length > 0;
  }

  get errorCount() {
    return this.args.errors?.length || 0;
  }

  get pluralSuffix() {
    return this.errorCount === 1 ? '' : 's';
  }

  @action
  handleErrorClick(event, inputId) {
    event.preventDefault();
    const input = document.getElementById(inputId);

    if (input) {
      // Scroll input into view
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus the input
      setTimeout(() => {
        input.focus();
      }, 300); // Wait for scroll to complete
    }
  }
}

// app/components/error-summary.hbs
const ErrorSummaryTemplate = `
{{#if this.hasErrors}}
  <div class="error-summary" role="alert" aria-live="polite">
    <h3>
      Please fix the following {{this.errorCount}} error{{this.pluralSuffix}}:
    </h3>
    <ul>
      {{#each @errors as |error|}}
        <li>
          <a
            href="#{{error.inputId}}"
            class="error-link"
            {{on "click" (fn this.handleErrorClick error.inputId)}}
          >
            {{error.message}}
          </a>
        </li>
      {{/each}}
    </ul>
  </div>
{{/if}}
`;

// ============================================================================
// EXAMPLE 1: BASIC FORM COMPONENT
// app/components/registration-form.js
// ============================================================================

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export class RegistrationFormComponent extends Component {
  @tracked errors = [];
  formElement = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    // Use native ValidityState to collect errors
    this.errors = collectFormErrors(this.formElement);

    if (this.errors.length === 0) {
      const formData = new FormData(this.formElement);
      console.log('Form is valid!', Object.fromEntries(formData));
      alert('Form submitted successfully!');

      // Clear form
      this.errors = [];
      this.formElement.reset();
    }
  }
}

// app/components/registration-form.hbs
const RegistrationFormTemplate = `
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
    <span class="error-message"></span>
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
    <span class="error-message"></span>
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
    <span class="error-message"></span>
  </div>

  <button type="submit">Submit</button>
</form>
`;

// ============================================================================
// EXAMPLE 2: CUSTOM VALIDATION (PASSWORD MATCH)
// app/components/password-form.js
// ============================================================================

export class PasswordFormComponent extends Component {
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
        // Use setCustomValidity() for custom validation
        this.confirmInput.setCustomValidity('Passwords do not match');
      } else {
        this.confirmInput.setCustomValidity('');
      }
    }
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    // Run custom validation before collecting errors
    this.validatePasswordMatch();

    // Collect all errors including custom validation
    this.errors = collectFormErrors(this.formElement);

    if (this.errors.length === 0) {
      console.log('Form is valid and passwords match!');
      alert('Password form submitted successfully!');

      this.errors = [];
      this.formElement.reset();
    }
  }
}

// app/components/password-form.hbs
const PasswordFormTemplate = `
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
    <span class="error-message"></span>
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
    <span class="error-message"></span>
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
    <span class="error-message"></span>
  </div>

  <button type="submit">Submit</button>
</form>
`;

// ============================================================================
// EXAMPLE 3: REAL-TIME FIELD VALIDATION
// app/components/realtime-form.js
// ============================================================================

export class RealtimeFormComponent extends Component {
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
        message: getValidationMessage(input),
        input: input
      };

      // Update errors array, replacing existing error for this field
      const filteredErrors = this.errors.filter(e => e.field !== error.field);
      this.errors = [...filteredErrors, error];
    } else {
      // Remove error for this field if it's now valid
      this.errors = this.errors.filter(e => e.field !== (input.name || input.id));
    }
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    // Collect all errors on submit
    this.errors = collectFormErrors(this.formElement);

    if (this.errors.length === 0) {
      console.log('Form is valid!');
      alert('Form submitted successfully!');

      this.errors = [];
      this.formElement.reset();
    }
  }
}

// app/components/realtime-form.hbs
const RealtimeFormTemplate = `
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
    <span class="error-message"></span>
  </div>

  <div class="form-group">
    <label for="phone">Phone (US format):</label>
    <Input
      @type="tel"
      id="phone"
      name="phone"
      aria-label="Phone"
      required={{true}}
      pattern="\\(\\d{3}\\) \\d{3}-\\d{4}"
      title="Format: (123) 456-7890"
      placeholder="(123) 456-7890"
      {{on "blur" this.validateField}}
    />
    <span class="error-message"></span>
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
    <span class="error-message"></span>
  </div>

  <button type="submit">Submit</button>
</form>
`;

// ============================================================================
// EXAMPLE 4: CUSTOM FORM HELPER COMPONENT
// A reusable component that encapsulates validation logic
// app/components/validated-form.js
// ============================================================================

export class ValidatedFormComponent extends Component {
  @tracked errors = [];
  formElement = null;

  @action
  registerForm(element) {
    this.formElement = element;
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    // Collect errors using ValidityState
    this.errors = collectFormErrors(this.formElement);

    if (this.errors.length === 0) {
      // Call the onSubmit callback passed from parent
      const formData = new FormData(this.formElement);
      this.args.onSubmit?.(Object.fromEntries(formData));

      // Clear errors
      this.errors = [];
    }
  }

  @action
  clearErrors() {
    this.errors = [];
  }
}

// app/components/validated-form.hbs
const ValidatedFormTemplate = `
<form {{on "submit" this.handleSubmit}} {{did-insert this.registerForm}} novalidate>
  <ErrorSummary @errors={{this.errors}} />

  {{! Yield block for form content }}
  {{yield}}
</form>
`;

// Usage in parent component:
const ParentComponentUsage = `
<ValidatedForm @onSubmit={{this.handleFormSubmit}}>
  <div class="form-group">
    <label for="email">Email:</label>
    <Input @type="email" id="email" name="email" required={{true}} />
  </div>

  <button type="submit">Submit</button>
</ValidatedForm>
`;

// ============================================================================
// DEMO APPLICATION
// app/controllers/application.js
// ============================================================================

import Controller from '@ember/controller';

export class ApplicationController extends Controller {
  // No special setup needed - components manage their own state
}

// app/templates/application.hbs
const ApplicationTemplate = `
<div class="container">
  <h1>ValidityState in Ember.js - Design System Example</h1>
  <p class="intro">
    Framework-independent validation using native browser APIs
  </p>

  <section class="example">
    <h2>1. Basic HTML5 Validation</h2>
    <RegistrationForm />
  </section>

  <section class="example">
    <h2>2. Custom Validation (Password Match)</h2>
    <PasswordForm />
  </section>

  <section class="example">
    <h2>3. Real-time Validation</h2>
    <RealtimeForm />
  </section>
</div>
`;

// ============================================================================
// UTILITY FILE FOR REUSE
// app/utils/form-validation.js
// ============================================================================

/**
 * Export these functions so they can be imported in any component:
 *
 * import { getValidationMessage, collectFormErrors } from '../utils/form-validation';
 */
export { getValidationMessage, collectFormErrors };

// ============================================================================
// TESTING EXAMPLE
// tests/integration/components/registration-form-test.js
// ============================================================================

import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | registration-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it displays validation errors from ValidityState', async function(assert) {
    await render(hbs`<RegistrationForm />`);

    // Try to submit empty form
    await click('button[type="submit"]');

    // Check that error summary appears
    assert.dom('.error-summary').exists();
    assert.dom('.error-summary li').exists({ count: 3 });
    assert.dom('.error-summary').containsText('Email is required');
    assert.dom('.error-summary').containsText('Username is required');
    assert.dom('.error-summary').containsText('Age is required');
  });

  test('it validates using ValidityState properties', async function(assert) {
    await render(hbs`<RegistrationForm />`);

    // Enter invalid email
    await fillIn('input[name="email"]', 'not-an-email');
    await click('button[type="submit"]');

    // Should show typeMismatch error from ValidityState
    assert.dom('.error-summary').containsText('Please enter a valid email address');
  });

  test('it clears errors when form is valid', async function(assert) {
    await render(hbs`<RegistrationForm />`);

    // Fill valid data
    await fillIn('input[name="email"]', 'test@example.com');
    await fillIn('input[name="username"]', 'john123');
    await fillIn('input[name="age"]', '25');

    await click('button[type="submit"]');

    // Error summary should not exist
    assert.dom('.error-summary').doesNotExist();
  });
});

// ============================================================================
// KEY POINTS
// ============================================================================

/*
 * 1. Component-Based Approach:
 *    - Each form is a component with its own @tracked errors
 *    - No services needed - components are self-contained
 *    - ErrorSummary is a reusable presentation component
 *
 * 2. Framework Independence:
 *    - getValidationMessage() is identical in React and Ember
 *    - Same HTML validation attributes work everywhere
 *    - ValidityState API is the single source of truth
 *
 * 3. Ember Patterns:
 *    - @tracked for reactive state
 *    - @action for event handlers
 *    - did-insert modifier for element access
 *    - {{on}} modifier for event binding
 *
 * 4. Testability:
 *    - Easy to test with @ember/test-helpers
 *    - ValidityState errors are deterministic
 *    - No mocking needed - uses real browser APIs
 *
 * 5. Reusability:
 *    - Extract validation logic to utils/form-validation.js
 *    - Create ValidatedForm component for common patterns
 *    - ErrorSummary component used across all forms
 */
