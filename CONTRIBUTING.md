# Contributing to Study Buddy 🎓

Welcome! We're excited that you're interested in contributing to Study Buddy. This guide will help you get started with contributing to our collaborative learning platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

### Our Pledge
- **Be respectful** and inclusive to all contributors
- **Be constructive** in discussions and code reviews
- **Be patient** with newcomers and help them learn
- **Be collaborative** and work together towards common goals

### Unacceptable Behavior
- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that would be inappropriate in a professional setting

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Git** for version control
- **Firebase Account** (free tier)
- **Supabase Account** (free tier)

### Quick Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/study-buddy.git
cd study-buddy

# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase and Supabase credentials

# Start development server
npm run dev
```

## 🛠️ Development Setup

### 1. Fork the Repository
Click the "Fork" button at the top of the GitHub repository page.

### 2. Clone Your Fork
```bash
git clone https://github.com/your-username/study-buddy.git
cd study-buddy
git remote add upstream https://github.com/original-owner/study-buddy.git
```

### 3. Environment Configuration
Create `.env` files with the required environment variables:

**Frontend (.env)**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Optional: AI Features
VITE_GEMINI_API_KEY=your_gemini_key
```

### 4. Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies (optional)
cd ../backend
npm install
```

### 5. Start Development
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

## 🎯 How to Contribute

### Types of Contributions

#### 🐛 Bug Fixes
- Check existing issues or create a new one
- Fork the repo and create a bug-fix branch
- Fix the issue and add tests if applicable
- Submit a pull request

#### ✨ New Features
- Discuss the feature in an issue first
- Wait for approval from maintainers
- Implement the feature following our guidelines
- Add tests and documentation
- Submit a pull request

#### 📚 Documentation
- Fix typos or unclear explanations
- Add examples or tutorials
- Improve API documentation
- Update setup instructions

#### 🎨 Design & UX
- Improve user interface components
- Enhance user experience flows
- Add accessibility improvements
- Create design mockups or prototypes

### Feature Development Process

#### 1. Issue Discussion
- Check existing issues or create a new feature request
- Discuss the feature with maintainers and community
- Get approval before starting development

#### 2. Planning
- Break down the feature into smaller tasks
- Consider impact on existing features
- Plan database schema changes if needed
- Design API interfaces

#### 3. Implementation
- Create a feature branch from `main`
- Follow coding standards and conventions
- Write tests for new functionality
- Update documentation as needed

#### 4. Testing
- Test manually in different browsers
- Run automated tests
- Test on mobile devices
- Verify accessibility compliance

## 🔄 Pull Request Process

### 1. Prepare Your Branch
```bash
# Create a feature branch
git checkout -b feature/amazing-feature

# Keep your branch up-to-date
git fetch upstream
git rebase upstream/main
```

### 2. Make Your Changes
- Follow our coding standards
- Write meaningful commit messages
- Keep commits focused and atomic
- Add tests for new functionality

### 3. Commit Guidelines
```bash
# Good commit messages
git commit -m "feat: add collaborative drawing to whiteboard"
git commit -m "fix: resolve file upload timeout issue"
git commit -m "docs: update Supabase setup instructions"
git commit -m "style: improve mobile responsiveness of chat"

# Commit message format
<type>(<scope>): <description>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting/UI changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 4. Push and Create PR
```bash
# Push to your fork
git push origin feature/amazing-feature

# Create pull request via GitHub UI
```

### 5. PR Requirements
Your pull request must:
- [ ] Have a clear title and description
- [ ] Reference related issues (e.g., "Closes #123")
- [ ] Include screenshots for UI changes
- [ ] Pass all automated checks
- [ ] Have at least one approval from maintainers
- [ ] Be up-to-date with the main branch

### 6. PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Tested on mobile
- [ ] Accessibility verified

## Screenshots
[Include screenshots for UI changes]

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

## 💻 Coding Standards

### TypeScript Guidelines
```typescript
// Use interfaces for props
interface ComponentProps {
  title: string;
  isVisible: boolean;
  onSubmit: (data: FormData) => void;
}

// Use proper typing
const MyComponent: React.FC<ComponentProps> = ({ title, isVisible, onSubmit }) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize re-renders with useMemo/useCallback
- Follow the single responsibility principle
- Use custom hooks for reusable logic

### CSS/Tailwind Guidelines
```tsx
// Good: Organized, readable classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
  <button className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
    Action
  </button>
</div>

// Use custom CSS classes for complex styling
<div className="study-room-card">
  {/* Content */}
</div>
```

### File Organization
```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── features/        # Feature-specific components
│   └── ui/             # Basic UI components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utilities and configurations
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Helper functions
```

### Naming Conventions
- **Components**: PascalCase (`StudyRoom.tsx`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: kebab-case (`study-room.utils.ts`)
- **CSS Classes**: kebab-case (`study-room-header`)

## 🧪 Testing Guidelines

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { StudyRoom } from './StudyRoom';

describe('StudyRoom', () => {
  it('should render study room title', () => {
    render(<StudyRoom title="Math Study Group" />);
    expect(screen.getByText('Math Study Group')).toBeInTheDocument();
  });

  it('should handle join room action', () => {
    const onJoin = jest.fn();
    render(<StudyRoom title="Test Room" onJoin={onJoin} />);
    
    fireEvent.click(screen.getByRole('button', { name: /join/i }));
    expect(onJoin).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage Requirements
- **Minimum 80%** test coverage for new features
- Test critical user flows and edge cases
- Include integration tests for complex features
- Mock external dependencies (Firebase, Supabase)

## 📖 Documentation

### Code Documentation
```typescript
/**
 * Uploads a file to Supabase storage and returns the public URL
 * 
 * @param file - The file to upload
 * @param folder - Optional folder path for organization
 * @returns Promise containing the uploaded file's URL and metadata
 * @throws {Error} When upload fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const result = await uploadToSupabase(file, 'study-materials');
 * console.log(result.url); // https://...
 * ```
 */
export const uploadToSupabase = async (file: File, folder?: string) => {
  // Implementation...
};
```

### README Updates
- Update feature lists when adding new capabilities
- Keep setup instructions current
- Add screenshots for new UI features
- Update architecture diagrams if needed

### API Documentation
Document new API functions, hooks, and services:
```typescript
// hooks/useStudyRoom.ts
/**
 * Hook for managing study room state and operations
 * 
 * @param roomId - Unique identifier for the study room
 * @returns Object containing room data, loading state, and actions
 */
export const useStudyRoom = (roomId: string) => {
  // Hook implementation...
};
```

## 🌟 Recognition

### Contributors Hall of Fame
We recognize our contributors in several ways:
- Listed in README.md contributors section
- Featured in release notes for significant contributions
- Invited to join our contributors Discord server
- Special badges and recognition on GitHub

### Contribution Levels
- **🌱 First-time Contributor**: Made your first PR
- **🔧 Regular Contributor**: Multiple merged PRs
- **⭐ Core Contributor**: Significant feature contributions
- **🏆 Maintainer**: Helps review and guide the project

## 💬 Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat with contributors
- **Email**: [studybuddy.team@example.com] for private matters

### Getting Help
- Check existing issues and documentation first
- Ask questions in GitHub Discussions
- Join our Discord for real-time help
- Tag maintainers in issues if urgent

### Office Hours
- **Weekly Community Call**: Fridays 3PM PST
- **Maintainer Q&A**: First Monday of each month
- **Feature Planning**: Quarterly roadmap sessions

## 🎯 Roadmap & Priorities

### Current Focus Areas
1. **Mobile Optimization** - Better mobile experience
2. **Performance** - Speed improvements and optimization
3. **Accessibility** - WCAG compliance and screen reader support
4. **AI Integration** - Enhanced study assistance features

### How to Pick Issues
- Look for `good first issue` label for beginners
- Check `help wanted` for areas needing contribution
- Review `priority: high` for important features
- Ask maintainers about current needs

## ❓ FAQ

### Q: How long does PR review take?
A: Usually 2-7 days, depending on complexity and reviewer availability.

### Q: Can I work on multiple issues simultaneously?
A: Yes, but please focus on quality over quantity. Limit yourself to 2-3 concurrent issues.

### Q: Do I need to sign a CLA?
A: No, but by contributing, you agree that your contributions will be licensed under MIT.

### Q: Can I contribute if I'm a beginner?
A: Absolutely! We have beginner-friendly issues and mentoring available.

### Q: How do I propose a breaking change?
A: Create an RFC (Request for Comments) issue first to discuss the change with maintainers.

---

## 🙏 Thank You!

Thank you for contributing to Study Buddy! Your efforts help create a better learning experience for students worldwide. Every contribution, no matter how small, makes a difference.

**Happy coding! 🎓✨**

---

*For questions about this guide, please open an issue or reach out to the maintainers.*