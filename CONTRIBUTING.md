# 🤝 Contributing to Social Shield

Thank you for your interest in contributing to Social Shield! This guide will help you get started with contributing to our email security analysis platform.

## 📋 Table of Contents

- [🎯 Ways to Contribute](#-ways-to-contribute)
- [🚀 Getting Started](#-getting-started)
- [💻 Development Setup](#-development-setup)
- [📝 Coding Standards](#-coding-standards)
- [🔄 Pull Request Process](#-pull-request-process)
- [🐛 Bug Reports](#-bug-reports)
- [💡 Feature Requests](#-feature-requests)
- [🏷️ Issue Labels](#️-issue-labels)
- [💬 Community](#-community)

## 🎯 Ways to Contribute

### 🔧 Code Contributions

- **Bug fixes**: Help us squash bugs and improve stability
- **New features**: Add exciting functionality to the platform
- **Performance improvements**: Optimize existing code
- **UI/UX enhancements**: Improve user experience and design
- **Tests**: Increase test coverage and reliability

### 📚 Documentation

- **README improvements**: Make documentation clearer
- **API documentation**: Document endpoints and responses
- **Tutorials**: Create guides for common use cases
- **Code comments**: Improve code readability

### 🎨 Design & User Experience

- **UI/UX design**: Mockups and design improvements
- **Accessibility**: Make the app accessible to everyone
- **Mobile optimization**: Improve mobile experience
- **Theme enhancements**: Dark mode and custom themes

### 🧪 Testing & Quality Assurance

- **Manual testing**: Test new features and report bugs
- **Automated testing**: Write unit, integration, and e2e tests
- **Performance testing**: Identify bottlenecks and optimization opportunities
- **Security testing**: Help identify security vulnerabilities

## 🚀 Getting Started

### Prerequisites

Before contributing, make sure you have:

- **Node.js** 18+ and npm 9+
- **Python** 3.9+ and pip
- **MongoDB** (local or Atlas)
- **Git** for version control
- **Code editor** (VS Code recommended)

### First-Time Setup

1. **Fork the repository**

   ```bash
   # Click the "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/yourusername/social-shield.git
   cd social-shield
   ```

2. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/originalowner/social-shield.git
   ```

3. **Install dependencies**

   ```bash
   # Frontend
   cd senti-analysis
   npm install

   # Backend
   cd ../senti-analysis-backend
   npm install

   # Python ML service
   cd ../senti-analysis-flask-backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   # Copy example files
   cp senti-analysis/.env.example senti-analysis/.env
   cp senti-analysis-backend/.env.example senti-analysis-backend/.env
   cp senti-analysis-flask-backend/.env.example senti-analysis-flask-backend/.env

   # Edit each .env file with your API keys
   ```

5. **Start development servers**

   ```bash
   # Terminal 1: Backend
   cd senti-analysis-backend && npm run dev

   # Terminal 2: ML Service
   cd senti-analysis-flask-backend && python app.py

   # Terminal 3: Frontend
   cd senti-analysis && npm run dev
   ```

## 💻 Development Setup

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.flake8",
    "ms-vscode.vscode-json"
  ]
}
```

### Environment Configuration

#### Development Environment

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5000
VITE_FLASK_API_URL=http://localhost:5001
VITE_DEBUG_MODE=true

# Backend (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-shield-dev

# Flask (.env)
FLASK_ENV=development
PORT=5001
DEBUG=true
```

#### Testing Environment

```bash
# Use separate database for testing
MONGODB_URI=mongodb://localhost:27017/social-shield-test
```

### Project Structure

```
social-shield/
├── 📁 senti-analysis/              # React Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable components
│   │   │   ├── 📁 ui/              # Base UI components
│   │   │   └── *.jsx               # Feature components
│   │   ├── 📁 pages/               # Application pages
│   │   ├── 📁 contexts/            # React contexts
│   │   ├── 📁 utils/               # Helper functions
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   └── 📁 styles/              # CSS and animations
│   ├── 📁 public/                  # Static assets
│   └── 📄 package.json
├── 📁 senti-analysis-backend/      # Node.js API
│   ├── 📁 controllers/             # Route handlers
│   ├── 📁 models/                  # Database models
│   ├── 📁 routes/                  # API routes
│   ├── 📁 middleware/              # Custom middleware
│   ├── 📁 utils/                   # Utility functions
│   └── 📁 tests/                   # Backend tests
└── 📁 senti-analysis-flask-backend/ # Python ML Service
    ├── 📄 app.py                   # Flask app
    ├── 📁 models/                  # ML models
    ├── 📁 utils/                   # Python utilities
    └── 📁 tests/                   # Python tests
```

## 📝 Coding Standards

### JavaScript/React Guidelines

#### Code Style

- Use **ESLint** and **Prettier** for consistent formatting
- Follow **Airbnb JavaScript Style Guide**
- Use **functional components** with hooks
- Prefer **arrow functions** for simple functions

#### Naming Conventions

```javascript
// Components: PascalCase
const EmailAnalysis = () => {
  /* ... */
};

// Functions: camelCase
const analyzeEmail = async (emailData) => {
  /* ... */
};

// Constants: UPPER_SNAKE_CASE
const API_ENDPOINTS = {
  /* ... */
};

// Files: kebab-case
// email-analysis.jsx
// user-controller.js
```

#### React Best Practices

```javascript
// ✅ Good: Destructure props
const EmailCard = ({ subject, sender, date }) => {
  return (
    <div className="email-card">
      <h3>{subject}</h3>
      <p>From: {sender}</p>
      <small>{date}</small>
    </div>
  );
};

// ✅ Good: Use custom hooks for logic
const useEmailAnalysis = (emailId) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hook logic here...

  return { analysis, loading };
};

// ✅ Good: Proper error handling
const analyzeEmail = async (email) => {
  try {
    const response = await api.analyzeEmail(email);
    return response.data;
  } catch (error) {
    console.error("Email analysis failed:", error);
    throw new Error("Failed to analyze email");
  }
};
```

### Python Guidelines

#### Code Style

- Follow **PEP 8** style guide
- Use **Black** for code formatting
- Use **flake8** for linting
- Add **type hints** where appropriate

#### Flask Best Practices

```python
# ✅ Good: Use blueprints for organization
from flask import Blueprint

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_email():
    """Analyze email content for sentiment and security."""
    try:
        data = request.get_json()
        result = ml_service.analyze(data)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        return jsonify({"error": "Analysis failed"}), 500

# ✅ Good: Use type hints
def calculate_risk_score(
    content: str,
    sender: str,
    headers: Dict[str, str]
) -> float:
    """Calculate risk score for email content."""
    # Implementation here...
    return risk_score
```

### CSS/Tailwind Guidelines

#### Tailwind Best Practices

```javascript
// ✅ Good: Use semantic class grouping
const EmailCard = () => (
  <div
    className="
    flex flex-col p-6 
    bg-white dark:bg-gray-800 
    border border-gray-200 dark:border-gray-700 
    rounded-lg shadow-sm hover:shadow-md 
    transition-shadow duration-200
  "
  >
    {/* Content */}
  </div>
);

// ✅ Good: Extract complex classes to components
const Button = ({ variant = "primary", children, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};
```

### Testing Standards

#### Frontend Testing (Jest + React Testing Library)

```javascript
// ✅ Good: Test behavior, not implementation
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmailAnalysis } from "../EmailAnalysis";

describe("EmailAnalysis", () => {
  it("should display analysis results when email is analyzed", async () => {
    const mockEmail = {
      subject: "Test Email",
      content: "Hello world",
      sender: "test@example.com",
    };

    render(<EmailAnalysis email={mockEmail} />);

    fireEvent.click(screen.getByText("Analyze"));

    await waitFor(() => {
      expect(screen.getByText("Analysis Complete")).toBeInTheDocument();
    });
  });
});
```

#### Backend Testing (Jest/Mocha)

```javascript
// ✅ Good: Test API endpoints
describe("POST /api/analyze", () => {
  it("should return analysis results for valid email", async () => {
    const emailData = {
      content: "Test email content",
      subject: "Test Subject",
      sender: "test@example.com",
    };

    const response = await request(app)
      .post("/api/analyze")
      .send(emailData)
      .expect(200);

    expect(response.body).toHaveProperty("sentiment");
    expect(response.body).toHaveProperty("risk_score");
  });
});
```

#### Python Testing (pytest)

```python
# ✅ Good: Test ML functions
def test_sentiment_analysis():
    """Test sentiment analysis with sample text."""
    analyzer = SentimentAnalyzer()

    positive_text = "I love this product! It's amazing!"
    result = analyzer.analyze(positive_text)

    assert result['sentiment'] == 'positive'
    assert result['confidence'] > 0.8

def test_phishing_detection():
    """Test phishing detection with known phishing patterns."""
    detector = PhishingDetector()

    suspicious_email = {
        'content': 'Click here to verify your account immediately!',
        'sender': 'noreply@suspicious-bank.com',
        'subject': 'URGENT: Account Verification Required'
    }

    result = detector.analyze(suspicious_email)
    assert result['risk_score'] > 0.7
```

## 🔄 Pull Request Process

### Before Creating a PR

1. **Create an issue** first to discuss the change
2. **Fork the repository** and create a feature branch
3. **Make your changes** following coding standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Test thoroughly** on your local environment

### PR Checklist

- [ ] **Branch**: Created from latest `main` branch
- [ ] **Title**: Clear, descriptive title (max 50 characters)
- [ ] **Description**: Detailed description of changes
- [ ] **Tests**: All tests pass (`npm test`, `pytest`)
- [ ] **Linting**: No linting errors (`npm run lint`)
- [ ] **Documentation**: Updated if necessary
- [ ] **Breaking Changes**: Clearly marked if any
- [ ] **Screenshots**: Include for UI changes
- [ ] **Linked Issues**: Reference related issues

### PR Template

```markdown
## 📝 Description

Brief description of what this PR does.

## 🔗 Related Issues

Closes #123
Fixes #456

## 🧪 Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## 📷 Screenshots (if applicable)

Before/after screenshots for UI changes.

## ⚠️ Breaking Changes

List any breaking changes and migration steps.

## 📋 Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Team members review code changes
3. **Testing**: Reviewers test functionality locally
4. **Approval**: At least one approval required
5. **Merge**: Squash and merge to main branch

## 🐛 Bug Reports

### Before Reporting a Bug

1. **Search existing issues** to avoid duplicates
2. **Update to latest version** and test again
3. **Test in incognito mode** to rule out browser extensions
4. **Check the console** for error messages

### Bug Report Template

```markdown
## 🐛 Bug Description

A clear description of what the bug is.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior

What you expected to happen.

## ❌ Actual Behavior

What actually happened.

## 📷 Screenshots

If applicable, add screenshots.

## 🌐 Environment

- **OS**: [e.g. Windows 10, macOS Big Sur]
- **Browser**: [e.g. Chrome 91, Firefox 89]
- **Version**: [e.g. 1.2.3]
- **Device**: [e.g. Desktop, iPhone 12]

## 📋 Additional Context

Any other context about the problem.

## 🔍 Possible Solution

If you have ideas on how to fix it.
```

## 💡 Feature Requests

### Before Requesting a Feature

1. **Check existing issues** and discussions
2. **Consider the scope** - is this widely useful?
3. **Think about implementation** - is it feasible?
4. **Provide use cases** - why is this needed?

### Feature Request Template

```markdown
## 🚀 Feature Request

Brief description of the feature.

## 💭 Motivation

Why do you want this feature? What problem does it solve?

## 📋 Detailed Description

Detailed description of the feature and how it should work.

## 🎯 Use Cases

Specific examples of how this would be used.

## 🎨 Mockups/Examples

Visual examples or mockups if applicable.

## 🔧 Implementation Ideas

Technical suggestions on how to implement (optional).

## 📈 Priority

- [ ] Nice to have
- [ ] Important
- [ ] Critical

## 🤔 Alternatives

Alternative solutions you've considered.
```

## 🏷️ Issue Labels

### Type Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `question` - Further information is requested
- `help wanted` - Extra attention is needed
- `good first issue` - Good for newcomers

### Priority Labels

- `priority: critical` - Urgent fixes needed
- `priority: high` - Important features
- `priority: medium` - Standard priority
- `priority: low` - Nice to have

### Component Labels

- `frontend` - React frontend changes
- `backend` - Node.js API changes
- `ml` - Machine learning/Python changes
- `ui/ux` - User interface/experience
- `security` - Security-related issues
- `performance` - Performance improvements

### Status Labels

- `status: in progress` - Currently being worked on
- `status: needs review` - Needs code review
- `status: blocked` - Blocked by other issues
- `status: duplicate` - Duplicate of another issue

## 💬 Community

### Communication Channels

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord Server**: Real-time chat with contributors
- **Twitter**: [@SocialShield](https://twitter.com/socialshield) for updates

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

#### Our Pledge

- **Be welcoming** to all contributors
- **Be respectful** of different viewpoints and experiences
- **Accept constructive criticism** gracefully
- **Focus on what's best** for the community
- **Show empathy** towards other community members

### Getting Help

#### For Development Questions

1. **GitHub Discussions** - Ask questions and get help
2. **Discord #dev-help** - Real-time assistance
3. **Stack Overflow** - Tag with `social-shield`

#### For Bug Reports

1. **GitHub Issues** - Report bugs and track fixes
2. **Discord #bug-reports** - Quick bug discussions

#### For Feature Ideas

1. **GitHub Discussions** - Discuss ideas before implementation
2. **Discord #feature-requests** - Brainstorm new features

### Recognition

Contributors are recognized in several ways:

- **README.md** - Listed in contributors section
- **CHANGELOG.md** - Credited for specific contributions
- **Discord Roles** - Special contributor roles
- **Swag** - Stickers and t-shirts for significant contributions
- **Annual Report** - Highlighted in yearly community report

---

Thank you for contributing to Social Shield! Together, we're making email security accessible to everyone. 🛡️✨
