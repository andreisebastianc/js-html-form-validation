// ============================================================================
// HTML Form Validation - Browser APIs Exploration
// Using ValidityState with Error Summary at Top of Form
// ============================================================================

// Get custom error message based on ValidityState
function getValidationMessage(input) {
    const validity = input.validity;

    if (validity.valid) {
        return '';
    }

    if (validity.valueMissing) {
        return `${getFieldLabel(input)} is required.`;
    }

    if (validity.typeMismatch) {
        if (input.type === 'email') {
            return `${getFieldLabel(input)}: Please enter a valid email address.`;
        }
        if (input.type === 'url') {
            return `${getFieldLabel(input)}: Please enter a valid URL.`;
        }
        return `${getFieldLabel(input)}: Please match the requested format.`;
    }

    if (validity.tooShort) {
        return `${getFieldLabel(input)}: Please enter at least ${input.minLength} characters (you entered ${input.value.length}).`;
    }

    if (validity.tooLong) {
        return `${getFieldLabel(input)}: Please enter no more than ${input.maxLength} characters.`;
    }

    if (validity.rangeUnderflow) {
        return `${getFieldLabel(input)}: Please enter a value greater than or equal to ${input.min}.`;
    }

    if (validity.rangeOverflow) {
        return `${getFieldLabel(input)}: Please enter a value less than or equal to ${input.max}.`;
    }

    if (validity.patternMismatch) {
        return `${getFieldLabel(input)}: ${input.title || 'Please match the requested format.'}`;
    }

    if (validity.customError) {
        return `${getFieldLabel(input)}: ${input.validationMessage}`;
    }

    return `${getFieldLabel(input)}: ${input.validationMessage || 'Please enter a valid value.'}`;
}

// Get a friendly field label from the input
function getFieldLabel(input) {
    const label = input.closest('.form-group')?.querySelector('label');
    if (label) {
        return label.textContent.replace(/[:\(\)]/g, '').split('(')[0].trim();
    }
    return input.name || input.id || 'This field';
}

// Collect all validation errors from a form using ValidityState
function collectFormErrors(form) {
    const errors = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message');

        if (!input.checkValidity()) {
            const errorMessage = getValidationMessage(input);

            // Ensure input has an ID for linking
            if (!input.id) {
                input.id = input.name || `input-${Math.random().toString(36).substr(2, 9)}`;
            }

            errors.push({
                input: input,
                inputId: input.id,
                message: errorMessage
            });

            // Show inline error message
            if (errorElement) {
                errorElement.textContent = errorMessage;
            }

            input.classList.add('invalid');
            input.classList.remove('valid');
        } else {
            // Clear inline error message
            if (errorElement) {
                errorElement.textContent = '';
            }

            input.classList.remove('invalid');
            if (input.value) {
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
            }
        }
    });

    return errors;
}

// Display error summary at the top of the form
function displayErrorSummary(form, errors) {
    const errorSummary = form.querySelector('.error-summary');

    if (errors.length === 0) {
        errorSummary.style.display = 'none';
        errorSummary.innerHTML = '';
        return;
    }

    const errorCount = errors.length;
    const pluralSuffix = errorCount === 1 ? '' : 's';

    let html = `<h3>Please fix the following ${errorCount} error${pluralSuffix}:</h3><ul>`;

    errors.forEach((error, index) => {
        // Create clickable link to the input using its ID
        html += `<li><a href="#${error.inputId}" class="error-link" data-input-id="${error.inputId}">${error.message}</a></li>`;
    });

    html += '</ul>';

    errorSummary.innerHTML = html;
    errorSummary.style.display = 'block';

    // Add click handlers to error links
    errorSummary.querySelectorAll('.error-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const inputId = this.getAttribute('data-input-id');
            const input = document.getElementById(inputId);

            if (input) {
                // Scroll input into view
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Focus the input
                setTimeout(() => {
                    input.focus();
                }, 300); // Wait for scroll to complete
            }
        });
    });

    // Scroll to error summary
    errorSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Validate form and display errors in summary
function validateForm(form) {
    const errors = collectFormErrors(form);
    displayErrorSummary(form, errors);
    return errors.length === 0;
}

// Clear all errors from a form
function clearFormErrors(form) {
    displayErrorSummary(form, []);
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('invalid', 'valid');

        // Clear inline error message
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
}

// Legacy functions for compatibility (now redirect to error summary approach)
function showError(input, message) {
    // Mark field as invalid
    input.classList.add('invalid');
    input.classList.remove('valid');
}

function clearError(input) {
    // Mark field as valid if it has value
    input.classList.remove('invalid');
    if (input.value) {
        input.classList.add('valid');
    } else {
        input.classList.remove('valid');
    }
}

// ============================================================================
// Example 1: Basic HTML5 Validation Attributes
// ============================================================================
const form1 = document.getElementById('form1');

form1.addEventListener('submit', function(event) {
    event.preventDefault();

    if (validateForm(form1)) {
        console.log('Form 1 is valid!', new FormData(form1));
        alert('Form 1 submitted successfully! Check console for data.');
        clearFormErrors(form1);
    } else {
        console.log('Form 1 has validation errors');
    }
});

// Real-time validation on blur for Form 1
form1.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value) {
            if (!this.checkValidity()) {
                showError(this, getValidationMessage(this));
            } else {
                clearError(this);
            }
        }
    });

    input.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            if (this.checkValidity()) {
                clearError(this);
            }
        }
    });
});

// ============================================================================
// Example 2: Constraint Validation API
// ============================================================================
const form2 = document.getElementById('form2');
const password2 = document.getElementById('password2');
const confirmPassword2 = document.getElementById('confirmPassword2');

// Custom validation: Password confirmation match
function validatePasswordMatch() {
    if (confirmPassword2.value !== password2.value) {
        confirmPassword2.setCustomValidity('Passwords do not match');
        return false;
    } else {
        confirmPassword2.setCustomValidity('');
        return true;
    }
}

password2.addEventListener('input', validatePasswordMatch);
confirmPassword2.addEventListener('input', validatePasswordMatch);

form2.addEventListener('submit', function(event) {
    event.preventDefault();

    validatePasswordMatch();

    if (validateForm(form2)) {
        console.log('Form 2 is valid!', new FormData(form2));
        alert('Form 2 submitted successfully! Check console for data.');
        clearFormErrors(form2);
    }
});

// Button to check and display validity state
document.getElementById('checkValidityBtn').addEventListener('click', function() {
    const inputs = form2.querySelectorAll('input');

    inputs.forEach(input => {
        const validityStateElement = input.closest('.form-group').querySelector('.validity-state');

        const validityInfo = {
            valid: input.validity.valid,
            valueMissing: input.validity.valueMissing,
            typeMismatch: input.validity.typeMismatch,
            patternMismatch: input.validity.patternMismatch,
            tooLong: input.validity.tooLong,
            tooShort: input.validity.tooShort,
            rangeUnderflow: input.validity.rangeUnderflow,
            rangeOverflow: input.validity.rangeOverflow,
            customError: input.validity.customError
        };

        const errorProps = Object.entries(validityInfo)
            .filter(([key, value]) => value === true && key !== 'valid')
            .map(([key]) => key);

        if (input.validity.valid) {
            validityStateElement.innerHTML = '<span style="color: green;">✓ Valid</span>';
        } else {
            validityStateElement.innerHTML = `<span style="color: red;">✗ Invalid: ${errorProps.join(', ')}</span>`;
        }
        validityStateElement.style.display = 'block';
    });
});

// ============================================================================
// Example 3: Custom Validation Logic
// ============================================================================
const form3 = document.getElementById('form3');

// Custom username validation
const username3 = document.getElementById('username3');
username3.addEventListener('input', function() {
    const value = this.value;

    if (!value) {
        this.setCustomValidity('Username is required');
    } else if (value.length < 3) {
        this.setCustomValidity('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        this.setCustomValidity('Username can only contain letters, numbers, and underscores');
    } else if (value.startsWith('_') || value.endsWith('_')) {
        this.setCustomValidity('Username cannot start or end with an underscore');
    } else {
        this.setCustomValidity('');
    }

    if (this.classList.contains('invalid')) {
        if (!this.checkValidity()) {
            showError(this, getValidationMessage(this));
        } else {
            clearError(this);
        }
    }
});

// Custom phone validation (US format)
const phone3 = document.getElementById('phone3');
phone3.addEventListener('input', function() {
    const value = this.value;
    // Remove all non-digits for validation
    const digits = value.replace(/\D/g, '');

    if (!value) {
        this.setCustomValidity('Phone number is required');
    } else if (digits.length !== 10) {
        this.setCustomValidity('Phone number must have 10 digits');
    } else {
        this.setCustomValidity('');
        // Auto-format the phone number
        this.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    if (this.classList.contains('invalid')) {
        if (!this.checkValidity()) {
            showError(this, getValidationMessage(this));
        } else {
            clearError(this);
        }
    }
});

// Custom credit card validation (Luhn algorithm)
const creditCard3 = document.getElementById('creditCard3');
function luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(digits)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

creditCard3.addEventListener('input', function() {
    const value = this.value;
    const digits = value.replace(/\s/g, '');

    if (!value) {
        this.setCustomValidity('Credit card number is required');
    } else if (digits.length < 13 || digits.length > 19) {
        this.setCustomValidity('Credit card number must be between 13 and 19 digits');
    } else if (!luhnCheck(value)) {
        this.setCustomValidity('Invalid credit card number (failed Luhn check)');
    } else {
        this.setCustomValidity('');
        // Auto-format the card number
        const formatted = digits.match(/.{1,4}/g).join(' ');
        if (formatted !== this.value) {
            this.value = formatted;
        }
    }

    if (this.classList.contains('invalid')) {
        if (!this.checkValidity()) {
            showError(this, getValidationMessage(this));
        } else {
            clearError(this);
        }
    }
});

// Custom ZIP code validation
const zipCode3 = document.getElementById('zipCode3');
zipCode3.addEventListener('input', function() {
    const value = this.value;

    if (!value) {
        this.setCustomValidity('ZIP code is required');
    } else if (!/^\d{5}(-\d{4})?$/.test(value)) {
        this.setCustomValidity('ZIP code must be in format: 12345 or 12345-6789');
    } else {
        this.setCustomValidity('');
    }

    if (this.classList.contains('invalid')) {
        if (!this.checkValidity()) {
            showError(this, getValidationMessage(this));
        } else {
            clearError(this);
        }
    }
});

form3.addEventListener('submit', function(event) {
    event.preventDefault();

    // Trigger validation on all inputs
    const inputs = form3.querySelectorAll('input');
    inputs.forEach(input => {
        input.dispatchEvent(new Event('input'));
    });

    if (validateForm(form3)) {
        console.log('Form 3 is valid!', new FormData(form3));
        alert('Form 3 submitted successfully! Check console for data.');
        clearFormErrors(form3);
    }
});

// ============================================================================
// Example 4: Real-time Validation
// ============================================================================
const form4 = document.getElementById('form4');

// Email validation on blur
const email4 = document.getElementById('email4');
email4.addEventListener('blur', function() {
    if (!this.checkValidity()) {
        showError(this, getValidationMessage(this));
    } else {
        clearError(this);
    }
});

email4.addEventListener('input', function() {
    if (this.classList.contains('invalid')) {
        if (this.checkValidity()) {
            clearError(this);
        }
    }
});

// Password validation on input with strength indicator
const password4 = document.getElementById('password4');
const strengthIndicator = password4.closest('.form-group').querySelector('.password-strength');

password4.addEventListener('input', function() {
    const value = this.value;
    let strength = 0;
    let feedback = [];

    // Length check
    if (value.length >= 8) {
        strength += 1;
    } else {
        feedback.push('at least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(value)) {
        strength += 1;
    } else {
        feedback.push('uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(value)) {
        strength += 1;
    } else {
        feedback.push('lowercase letter');
    }

    // Number check
    if (/\d/.test(value)) {
        strength += 1;
    } else {
        feedback.push('number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        strength += 1;
    } else {
        feedback.push('special character');
    }

    // Set custom validity
    if (value.length < 8) {
        this.setCustomValidity('Password must be at least 8 characters');
    } else if (strength < 3) {
        this.setCustomValidity('Password is too weak. Add: ' + feedback.join(', '));
    } else {
        this.setCustomValidity('');
    }

    // Update strength indicator
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#d73f40', '#dc6551', '#f2b84f', '#bde952', '#3ba62f'];

    if (value) {
        strengthIndicator.textContent = `Strength: ${strengthLabels[strength - 1] || 'Very Weak'}`;
        strengthIndicator.style.color = strengthColors[strength - 1] || strengthColors[0];
        strengthIndicator.style.display = 'block';
    } else {
        strengthIndicator.style.display = 'none';
    }

    // Show errors if field was previously marked invalid
    if (this.classList.contains('invalid')) {
        if (!this.checkValidity()) {
            showError(this, getValidationMessage(this));
        } else {
            clearError(this);
        }
    }
});

// Async validation (simulated)
const coupon4 = document.getElementById('coupon4');
const validatingIndicator = coupon4.closest('.form-group').querySelector('.validating-indicator');
let validationTimeout;

const validCoupons = ['SAVE10', 'DISCOUNT20', 'FREESHIP'];

coupon4.addEventListener('input', function() {
    const value = this.value.toUpperCase();
    this.value = value;

    validatingIndicator.style.display = 'none';

    if (value) {
        clearTimeout(validationTimeout);
        validatingIndicator.style.display = 'inline';

        validationTimeout = setTimeout(() => {
            // Simulate API call
            if (validCoupons.includes(value)) {
                this.setCustomValidity('');
                clearError(this);
                showError(this, '✓ Valid coupon code!');
                this.closest('.form-group').querySelector('.error-message').style.color = 'green';
            } else {
                this.setCustomValidity('Invalid coupon code');
                showError(this, 'Invalid coupon code. Try: SAVE10, DISCOUNT20, or FREESHIP');
            }
            validatingIndicator.style.display = 'none';
        }, 1000);
    } else {
        this.setCustomValidity('');
        clearError(this);
    }
});

form4.addEventListener('submit', function(event) {
    event.preventDefault();

    if (validateForm(form4)) {
        console.log('Form 4 is valid!', new FormData(form4));
        alert('Form 4 submitted successfully! Check console for data.');
        clearFormErrors(form4);
    }
});

// ============================================================================
// Example 5: ValidityState Error Summary Demo
// ============================================================================
const form5 = document.getElementById('form5');

form5.addEventListener('submit', function(event) {
    event.preventDefault();

    if (validateForm(form5)) {
        console.log('Form 5 is valid!', new FormData(form5));
        alert('Form 5 submitted successfully! Check console for data.');
        clearFormErrors(form5);
    }
});

document.getElementById('reportValidityBtn').addEventListener('click', function() {
    // Check validity and show error summary instead of native browser tooltips
    const isValid = validateForm(form5);
    console.log('Form 5 validity:', isValid);
    if (isValid) {
        alert('Form is valid!');
    }
});

// ============================================================================
// Console logging for educational purposes
// ============================================================================
console.log('%cHTML Form Validation with ValidityState & Error Summary', 'font-size: 20px; font-weight: bold; color: #3b82f6;');
console.log('%cKey Concepts:', 'font-size: 16px; font-weight: bold; margin-top: 10px;');
console.log('1. HTML5 Validation Attributes: required, pattern, min, max, minlength, maxlength, type');
console.log('2. Constraint Validation API Methods:');
console.log('   - checkValidity(): Returns boolean, no UI');
console.log('   - setCustomValidity(message): Sets custom error message');
console.log('   - validity: ValidityState object with error properties');
console.log('3. ValidityState Properties: valueMissing, typeMismatch, patternMismatch, tooShort, tooLong, etc.');
console.log('4. Custom Error Summary: Collect all errors and display at top of form');
console.log('5. No Default Browser Tooltips: Using novalidate attribute to prevent native UI');
console.log('\nTry interacting with the forms above to see ValidityState errors accumulated and displayed!');
