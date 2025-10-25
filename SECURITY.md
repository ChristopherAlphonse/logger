# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of @calphonse/logger seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the repository owner at:

- Email: Use the contact information from the [GitHub profile](https://github.com/ChristopherAlphonse)

You should receive a response within 48 hours. If for some reason you do not, please follow up via GitHub to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### What to Expect

After submitting a report, you can expect:

1. **Acknowledgment**: Within 48 hours, we'll acknowledge receipt of your vulnerability report
2. **Initial Assessment**: Within 5 business days, we'll provide an initial assessment of the report
3. **Status Updates**: We'll keep you informed about the progress of fixing the issue
4. **Resolution**: Once the issue is resolved, we'll notify you and publicly disclose the vulnerability (with credit to you, if desired)

## Security Best Practices for Users

When using @calphonse/logger in your applications:

### 1. Sensitive Data Handling

**Never log sensitive information** such as:

- Passwords or authentication tokens
- API keys or secret keys
- Personal Identifiable Information (PII)
- Credit card numbers or financial data
- Session tokens or JWTs

```typescript
// BAD - Logging sensitive data
logger.info('User logged in', { password: user.password, token: jwt });

// GOOD - Log only safe metadata
logger.info('User logged in', { userId: user.id, timestamp: Date.now() });
```

### 2. Production Environment

For production environments, use JSON logging to prevent console injection attacks:

```typescript
const logger = new Logger({
  json: true, // Enable JSON output in production
  level: LogLevel.INFO, // Avoid verbose logging
});
```

### 3. Input Sanitization

The logger automatically sanitizes inputs, but be cautious with user-provided data:

```typescript
// The logger handles this safely, but be aware
logger.info('User input', { userInput: req.body.message });
```

### 4. AI Features

When using AI-powered features:

- AI insights are cached locally by default
- Use local AI (Ollama) for sensitive environments
- Review AI-generated content before acting on it
- Set appropriate caching policies for your security requirements

### 5. Dependency Management

- Keep @calphonse/logger updated to the latest version
- Regularly audit your dependencies with `pnpm audit`
- Enable Dependabot for automatic security updates

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security patch versions as soon as possible

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue to discuss.

---

**Last Updated**: October 25, 2025
