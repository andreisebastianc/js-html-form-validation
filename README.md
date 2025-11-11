# HTML Form Validation with Browser APIs

An exploration of HTML form validation using standard browser APIs. This project demonstrates various approaches to form validation without relying on external libraries.

## Overview

This project showcases five different approaches to HTML form validation:

1. **HTML5 Validation Attributes** - Built-in attributes for basic validation
2. **Constraint Validation API** - JavaScript API for programmatic validation
3. **Custom Validation Logic** - Complex validation rules with `setCustomValidity()`
4. **Real-time Validation** - Validation on input, blur, and submit events
5. **reportValidity() Method** - Native browser validation UI

## Browser APIs Covered

### HTML5 Validation Attributes

Built-in HTML attributes that provide automatic validation:

- `required` - Makes a field mandatory
- `type` - Defines the input type (email, url, number, tel, etc.)
- `pattern` - Regular expression the value must match
- `minlength` / `maxlength` - Minimum/maximum character length
- `min` / `max` - Minimum/maximum value for numbers
- `step` - Allowed value intervals for numbers

**Example:**
```html
<input type="email" required minlength="5" maxlength="50">
<input type="number" min="18" max="120" required>
<input type="text" pattern="[a-zA-Z0-9]+" required>
```

### Constraint Validation API

JavaScript methods and properties for validation:

#### Methods

- **`checkValidity()`** - Returns `true` if valid, `false` if invalid. Does not show UI.
- **`reportValidity()`** - Returns `true` if valid, `false` if invalid. Shows native browser validation messages.
- **`setCustomValidity(message)`** - Sets a custom validation message. Pass empty string to clear.

**Example:**
```javascript
const input = document.getElementById('email');

// Check if valid (no UI shown)
if (input.checkValidity()) {
    console.log('Valid!');
}

// Check and show native validation UI
input.reportValidity();

// Set custom error message
input.setCustomValidity('This email is already taken');

// Clear custom error
input.setCustomValidity('');
```

#### ValidityState Object

The `validity` property returns a `ValidityState` object with these properties:

| Property | Description |
|----------|-------------|
| `valid` | `true` if the element meets all validation constraints |
| `valueMissing` | `true` if `required` attribute is set but no value provided |
| `typeMismatch` | `true` if value doesn't match the input type (email, url, etc.) |
| `patternMismatch` | `true` if value doesn't match the `pattern` attribute |
| `tooLong` | `true` if value exceeds `maxlength` |
| `tooShort` | `true` if value is less than `minlength` |
| `rangeUnderflow` | `true` if value is less than `min` |
| `rangeOverflow` | `true` if value exceeds `max` |
| `stepMismatch` | `true` if value doesn't fit the `step` rules |
| `badInput` | `true` if browser can't convert the input |
| `customError` | `true` if custom validity message is set via `setCustomValidity()` |

**Example:**
```javascript
const input = document.getElementById('password');

if (!input.validity.valid) {
    if (input.validity.valueMissing) {
        console.log('Password is required');
    }
    if (input.validity.tooShort) {
        console.log('Password is too short');
    }
}
```

#### validationMessage Property

Returns the current validation error message:

```javascript
const input = document.getElementById('email');
console.log(input.validationMessage); // "Please enter a valid email address"
```

### Form-level Validation

The form element itself also has validation methods:

```javascript
const form = document.getElementById('myForm');

// Check if entire form is valid
if (form.checkValidity()) {
    console.log('Form is valid!');
} else {
    // Show validation errors for all invalid fields
    form.reportValidity();
}
```

## Implementation Patterns

### Pattern 1: Basic HTML5 Validation with Custom Messages

```javascript
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll('input');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            showError(input, getValidationMessage(input));
            isValid = false;
        } else {
            clearError(input);
        }
    });

    if (isValid) {
        // Submit form
    }
});
```

### Pattern 2: Custom Validation with setCustomValidity()

```javascript
input.addEventListener('input', function() {
    if (this.value.length < 3) {
        this.setCustomValidity('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(this.value)) {
        this.setCustomValidity('Username can only contain letters, numbers, and underscores');
    } else {
        this.setCustomValidity(''); // Clear error
    }
});
```

### Pattern 3: Real-time Validation

```javascript
// Validate on blur (when user leaves field)
input.addEventListener('blur', function() {
    if (!this.checkValidity()) {
        showError(this, getValidationMessage(this));
    } else {
        clearError(this);
    }
});

// Clear errors on input (while typing)
input.addEventListener('input', function() {
    if (this.classList.contains('invalid')) {
        if (this.checkValidity()) {
            clearError(this);
        }
    }
});
```

### Pattern 4: Async Validation

```javascript
let validationTimeout;

input.addEventListener('input', function() {
    clearTimeout(validationTimeout);

    validationTimeout = setTimeout(() => {
        // Simulate API call
        fetch(`/api/validate?value=${this.value}`)
            .then(response => response.json())
            .then(data => {
                if (data.isValid) {
                    this.setCustomValidity('');
                } else {
                    this.setCustomValidity(data.message);
                }
            });
    }, 500); // Debounce for 500ms
});
```

### Pattern 5: Dependent Field Validation

```javascript
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

function validatePasswordMatch() {
    if (confirmPassword.value !== password.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

password.addEventListener('input', validatePasswordMatch);
confirmPassword.addEventListener('input', validatePasswordMatch);
```

## Advanced Techniques

### Luhn Algorithm (Credit Card Validation)

```javascript
function luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(digits)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}
```

### Phone Number Formatting

```javascript
input.addEventListener('input', function() {
    const digits = this.value.replace(/\D/g, '');

    if (digits.length === 10) {
        this.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
});
```

### Password Strength Indicator

```javascript
function calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return strength; // 0-5
}
```

## Best Practices

### 1. Use `novalidate` Attribute

Add `novalidate` to forms when using custom validation to prevent native browser validation UI:

```html
<form novalidate>
    <!-- Your form fields -->
</form>
```

### 2. Always Validate on the Server

Client-side validation is for user experience only. Always validate on the server for security.

### 3. Provide Clear Error Messages

```javascript
function getValidationMessage(input) {
    const validity = input.validity;

    if (validity.valueMissing) {
        return `${input.name || 'This field'} is required.`;
    }

    if (validity.typeMismatch) {
        if (input.type === 'email') {
            return 'Please enter a valid email address.';
        }
        if (input.type === 'url') {
            return 'Please enter a valid URL.';
        }
    }

    return input.validationMessage;
}
```

### 4. Validate at Appropriate Times

- **On submit** - Always validate the entire form
- **On blur** - Validate individual fields after user leaves them
- **On input** - Clear errors while typing, but wait before showing new errors
- **Debounced** - For expensive validations (e.g., API calls)

### 5. Accessibility Considerations

- Use `aria-invalid="true"` on invalid fields
- Use `aria-describedby` to link error messages to inputs
- Ensure error messages are announced by screen readers

```html
<input type="email"
       id="email"
       aria-invalid="true"
       aria-describedby="email-error">
<span id="email-error" role="alert">Please enter a valid email</span>
```

## Browser Support

The Constraint Validation API is supported in all modern browsers:

- Chrome 10+
- Firefox 4+
- Safari 5+
- Edge (all versions)
- Opera 10+

For IE9 and below, consider a polyfill or fallback validation library.

## Getting Started

1. Clone this repository
2. Open `index.html` in a web browser
3. Interact with the forms to see different validation approaches
4. Open the browser console to see validation logs

## Files

- `index.html` - Main HTML file with 5 different form examples
- `validation.js` - JavaScript implementations of validation patterns
- `styles.css` - Styling for the forms and validation states
- `README.md` - This documentation file

## Further Reading

- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [MDN: Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
- [HTML5 Input Types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)
- [ValidityState Interface](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)

## License

MIT License - feel free to use this code for learning and in your projects.
