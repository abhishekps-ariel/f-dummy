# TypeScript Migration Plan

This document outlines the gradual migration strategy from JavaScript to TypeScript for the FILIR client application. The migration will be done incrementally, ensuring the codebase works at every stage with a mix of `.js`/`.jsx` and `.ts`/`.tsx` files.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Migration Strategy](#migration-strategy)
- [Phase-by-Phase Plan](#phase-by-phase-plan)
- [Conversion Guidelines](#conversion-guidelines)
- [Testing Strategy](#testing-strategy)
- [Progress Tracking](#progress-tracking)

---

## Prerequisites

### 1. Setup TypeScript Configuration

Create `tsconfig.json` in the `client` directory:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2. Install TypeScript Dependencies

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

### 3. Update Vite Configuration

Ensure `vite.config.js` supports TypeScript (should already work with `@vitejs/plugin-react`).

---

## Migration Strategy

### Key Principles
1. **Incremental**: Convert files one at a time, starting from the simplest
2. **Non-breaking**: Each phase should maintain full functionality
3. **Testable**: Run tests/build after each file conversion
4. **Reversible**: Keep original `.js` files in git history
5. **Gradual strictness**: Start with `strict: false`, enable gradually

### Migration Order (Simple → Complex)
1. **Type Definitions** (foundation)
2. **Constants** (no logic, simple types)
3. **Utils** (pure functions, easy to type)
4. **Helpers** (utility functions with some logic)
5. **Services** (API calls, async operations)
6. **Hooks** (React hooks, moderate complexity)
7. **Context** (React context providers)
8. **Simple Components** (small, focused components)
9. **Complex Components** (large components with many dependencies)
10. **Pages** (top-level route components)

---

## Phase-by-Phase Plan

### **Phase 0: Setup & Configuration** ✅
**Status**: Not Started  
**Estimated Time**: 1-2 hours

**Tasks**:
- [ ] Create `tsconfig.json` with appropriate settings
- [ ] Create `tsconfig.node.json` for Node config files
- [ ] Install TypeScript and type definitions
- [ ] Update `package.json` scripts if needed
- [ ] Verify build works with mixed `.js`/`.ts` files

**Files**:
- `tsconfig.json`
- `tsconfig.node.json`
- `package.json`

---

### **Phase 1: Type Definitions & Constants** 
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Complexity**: ⭐ Very Simple

**Goal**: Create shared type definitions and convert simple constant files.

**Files to Convert** (in order):

1. **Type Definitions** (`src/types/`)
   - [ ] Create `src/types/common.types.ts` - Basic shared types
   - [ ] Create `src/types/api.types.ts` - API response/request types
   - [ ] Create `src/types/petition.types.ts` - Petition-related types
   - [ ] Create `src/types/user.types.ts` - User/auth types
   - [ ] Create `src/types/google-maps.d.ts` - Google Maps API declarations

2. **Constants** (`src/constants/`)
   - [ ] `constants/apiEndpoints.js` → `apiEndpoints.ts`
   - [ ] `constants/appConstants.js` → `appConstants.ts`
   - [ ] `constants/routerConstants.js` → `routerConstants.ts`

**Why This Phase First**:
- No runtime logic, just type definitions
- Provides foundation for all other conversions
- Zero risk of breaking functionality
- Helps TypeScript understand existing code

**Conversion Steps**:
1. Rename `.js` to `.ts`
2. Add `export` types for constants
3. Add `as const` for literal types where appropriate
4. Verify imports still work

---

### **Phase 2: Utility Functions**
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Complexity**: ⭐⭐ Simple

**Goal**: Convert pure utility functions with clear input/output types.

**Files to Convert** (in order):

1. `utils/storage.js` → `storage.ts`
2. `utils/logger.js` → `logger.ts`
3. `utils/tokenParser.js` → `tokenParser.ts`
4. `utils/dateUtils.js` → `dateUtils.ts`
5. `utils/currencyUtils.js` → `currencyUtils.ts`
6. `utils/serviceUtils.js` → `serviceUtils.ts`
7. `utils/responseParser.js` → `responseParser.ts`
8. `utils/accessibilityInit.js` → `accessibilityInit.ts`
9. `utils/lazyWithRetry.js` → `lazyWithRetry.ts`

**Why This Phase Second**:
- Pure functions are easiest to type
- Well-defined inputs/outputs
- No React dependencies
- Used by many other files

**Conversion Steps**:
1. Rename `.js` to `.ts`
2. Add parameter types
3. Add return types
4. Add JSDoc comments where helpful
5. Handle `any` types carefully (document why if used)

---

### **Phase 3: Helper Functions**
**Status**: Not Started  
**Estimated Time**: 4-6 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Goal**: Convert helper modules with business logic.

**Files to Convert** (by folder):

#### **Auth Helpers** (`helpers/auth/`)
- [ ] `passwordValidation.js` → `passwordValidation.ts`
- [ ] `formValidation.js` → `formValidation.ts`
- [ ] `mfaUtils.js` → `mfaUtils.ts`
- [ ] `organizationSearch.js` → `organizationSearch.ts`
- [ ] `inviteFlow.js` → `inviteFlow.ts`

#### **Petition Helpers** (`helpers/petitions/`)
- [ ] `petitionFormData.js` → `petitionFormData.ts`
- [ ] `formValidation.js` → `formValidation.ts`
- [ ] `addressValidation.js` → `addressValidation.ts`
- [ ] `inputProcessing.js` → `inputProcessing.ts`
- [ ] `petitionDataMappers.js` → `petitionDataMappers.ts`
- [ ] `pdfExport.js` → `pdfExport.ts`
- [ ] `profileValidation.js` → `profileValidation.ts`
- [ ] `petitionStatusUtils.js` → `petitionStatusUtils.ts`

#### **Message Helpers** (`helpers/messages/`)
- [ ] `messageUtils.js` → `messageUtils.ts`
- [ ] `messageHandlers.js` → `messageHandlers.ts`

**Conversion Steps**:
1. Define interfaces for complex data structures
2. Add types to function parameters
3. Add return types
4. Handle edge cases with union types (`| null`, `| undefined`)
5. Use generics where appropriate

---

### **Phase 4: Services (API Layer)**
**Status**: Not Started  
**Estimated Time**: 5-7 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Goal**: Convert service files that handle API calls.

**Files to Convert** (in order):

1. `services/commonService.js` → `commonService.ts`
2. `services/faqService.js` → `faqService.ts`
3. `services/organizationService.js` → `organizationService.ts`
4. `services/form35BService.js` → `form35BService.ts`
5. `services/authService.js` → `authService.ts`
6. `services/chatService.js` → `chatService.ts`
7. `services/commonPetitionService.js` → `commonPetitionService.ts`
8. `services/petitionApiService.js` → `petitionApiService.ts`

**Why This Phase**:
- Centralized API logic
- Benefits from type definitions created earlier
- Clear request/response contracts

**Conversion Steps**:
1. Define API request/response types (use types from Phase 1)
2. Type function parameters and return types
3. Handle Promise types (`Promise<ResponseType>`)
4. Type error handling
5. Add JSDoc for API endpoints

---

### **Phase 5: Configuration & API Setup**
**Status**: Not Started  
**Estimated Time**: 1-2 hours  
**Complexity**: ⭐⭐ Simple

**Files to Convert**:

1. `config/index.js` → `index.ts`
2. `config/config.dev.js` → `config.dev.ts`
3. `config/config.prod.js` → `config.prod.ts`
4. `api/axiosInstance.js` → `axiosInstance.ts`

**Conversion Steps**:
1. Type configuration objects
2. Add environment variable types
3. Type axios interceptors and instance

---

### **Phase 6: Custom Hooks**
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Files to Convert**:

1. `hooks/useDebounce.js` → `useDebounce.ts`
2. `hooks/useAuthCheck.js` → `useAuthCheck.ts`
3. `hooks/usePetitionCommonData.js` → `usePetitionCommonData.ts`
4. `hooks/usePetitions.js` → `usePetitions.ts`

**Conversion Steps**:
1. Type hook parameters
2. Type return values (tuples, objects)
3. Type state and effects
4. Use React types (`useState<T>`, `useEffect`, etc.)

---

### **Phase 7: React Context**
**Status**: Not Started  
**Estimated Time**: 3-4 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Files to Convert**:

1. `context/TabContext.jsx` → `TabContext.tsx`
2. `context/MessageContext.jsx` → `MessageContext.tsx`
3. `context/PetitionWizardContext.jsx` → `PetitionWizardContext.tsx`
4. `context/AuthContext.jsx` → `AuthContext.tsx`

**Conversion Steps**:
1. Define context value types
2. Type provider props
3. Type context consumers
4. Type custom hooks that use context

---

### **Phase 8: Simple/Shared Components**
**Status**: Not Started  
**Estimated Time**: 6-8 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Goal**: Convert smaller, reusable components first.

#### **Shared Components** (`components/shared/`)
Convert in this order:

1. `LoadingFallback.jsx` → `LoadingFallback.tsx`
2. `ScrollToTop.jsx` → `ScrollToTop.tsx`
3. `PageNotFound.jsx` → `PageNotFound.tsx`
4. `ErrorBoundary.jsx` → `ErrorBoundary.tsx`
5. `LanguageSwitcher.jsx` → `LanguageSwitcher.tsx`
6. `YearPicker.jsx` → `YearPicker.tsx`
7. `CustomInput.jsx` → `CustomInput.tsx`
8. `CustomDropdown.jsx` → `CustomDropdown.tsx`
9. `PasswordGuidelines.jsx` → `PasswordGuidelines.tsx`
10. `SignatureCapture.jsx` → `SignatureCapture.tsx`
11. `AccessibilityControls.jsx` → `AccessibilityControls.tsx`
12. `HighContrastToggle.jsx` → `HighContrastToggle.tsx`
13. `TextSizeController.jsx` → `TextSizeController.tsx`
14. `ImpersonationBanner.jsx` → `ImpersonationBanner.tsx`
15. `Header.jsx` → `Header.tsx`
16. `Sidebar.jsx` → `Sidebar.tsx`
17. `NotificationDropdown.jsx` → `NotificationDropdown.tsx`
18. `RouteError.jsx` → `RouteError.tsx`
19. `SignatureOtpModal.jsx` → `SignatureOtpModal.tsx`

**Conversion Steps**:
1. Define component props interface
2. Add `React.FC<Props>` or function component with typed props
3. Type event handlers
4. Type state with `useState<T>`
5. Type refs with `useRef<T>`
6. Handle children prop typing

---

### **Phase 9: Simple Page Components**
**Status**: Not Started  
**Estimated Time**: 4-5 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Files to Convert**:

1. `pages/Home/index.jsx` → `index.tsx`
2. `pages/Dashboard/index.jsx` → `index.tsx`
3. `pages/FAQ/index.jsx` → `index.tsx`
4. `pages/Training/index.jsx` → `index.tsx`
5. `pages/PageNotFound/index.jsx` → `index.tsx` (if exists)

**Conversion Steps**:
- Same as Phase 8
- Focus on props passed from routes

---

### **Phase 10: Form & Modal Components**
**Status**: Not Started  
**Estimated Time**: 8-10 hours  
**Complexity**: ⭐⭐⭐⭐ Complex

**Files to Convert**:

#### **Auth Pages** (`pages/Auth/`)
- [ ] `Login.jsx` → `Login.tsx`
- [ ] `Register.jsx` → `Register.tsx`
- [ ] `ForgotPassword.jsx` → `ForgotPassword.tsx`
- [ ] `SetNewPassword.jsx` → `SetNewPassword.tsx`
- [ ] `TwoFactorAuth.jsx` → `TwoFactorAuth.tsx`
- [ ] `VerificationPage.jsx` → `VerificationPage.tsx`
- [ ] `VerificationEmailSent.jsx` → `VerificationEmailSent.tsx`
- [ ] `PasswordEmailSent.jsx` → `PasswordEmailSent.tsx`
- [ ] `PasswordChanged.jsx` → `PasswordChanged.tsx`
- [ ] `ImpersonationRequest.jsx` → `ImpersonationRequest.tsx`

#### **Petition Modals** (`components/Petitions/`)
- [ ] `EditJudgementModal.jsx` → `EditJudgementModal.tsx`
- [ ] `EditForeclosureModal.jsx` → `EditForeclosureModal.tsx`
- [ ] `NotesModal.jsx` → `NotesModal.tsx`
- [ ] `TakeOverPetitionModal.jsx` → `TakeOverPetitionModal.tsx`
- [ ] `Form35BAttestationModal.jsx` → `Form35BAttestationModal.tsx`

**Conversion Steps**:
1. Type form data interfaces
2. Type form event handlers
3. Type validation functions
4. Type modal props (onClose, onSave, etc.)

---

### **Phase 11: Medium Complexity Components**
**Status**: Not Started  
**Estimated Time**: 10-12 hours  
**Complexity**: ⭐⭐⭐⭐ Complex

**Files to Convert**:

#### **Message Components** (`components/Messages/`)
- [ ] `DateBreaker.jsx` → `DateBreaker.tsx`
- [ ] `MessageItem.jsx` → `MessageItem.tsx`
- [ ] `MessageInput.jsx` → `MessageInput.tsx`
- [ ] `MessageList.jsx` → `MessageList.tsx`
- [ ] `ChatHeader.jsx` → `ChatHeader.tsx`
- [ ] `ChatArea.jsx` → `ChatArea.tsx`
- [ ] `ConversationsSidebar.jsx` → `ConversationsSidebar.tsx`
- [ ] `MessagesLayout.jsx` → `MessagesLayout.tsx`

#### **Petition Section Components** (`components/Petitions/Sections/`)
- [ ] Start with smallest sections first
- [ ] Work up to more complex ones

#### **Other Components**
- [ ] `components/FAQ/FAQcomponent.jsx` → `FAQcomponent.tsx`
- [ ] `components/Home/HomeHeader.jsx` → `HomeHeader.tsx`
- [ ] `components/Home/HomeFooter.jsx` → `HomeFooter.tsx`
- [ ] `pages/Messages/index.jsx` → `index.tsx`
- [ ] `pages/Notifications/index.jsx` → `index.tsx`
- [ ] `pages/Profile/index.jsx` → `index.tsx`

---

### **Phase 12: Complex Petition Components**
**Status**: Not Started  
**Estimated Time**: 15-20 hours  
**Complexity**: ⭐⭐⭐⭐⭐ Very Complex

**Files to Convert** (in order of complexity):

1. `components/Petitions/PetitionStepper.jsx` → `PetitionStepper.tsx`
2. `components/Petitions/TabBar.jsx` → `TabBar.tsx`
3. `components/Petitions/PetitionContentSidebar.jsx` → `PetitionContentSidebar.tsx`
4. `components/Petitions/MultiStepForm/Step1OrganizationSelection.jsx` → `Step1OrganizationSelection.tsx`
5. Continue with Steps 2-10 in order
6. `components/Petitions/ViewAllPetitions.jsx` → `ViewAllPetitions.tsx`
7. `components/Petitions/PetitionTabContent.jsx` → `PetitionTabContent.tsx` ⚠️ **LARGEST FILE**
8. `components/Petitions/PetitionSteps.jsx` → `PetitionSteps.tsx` ⚠️ **LARGEST FILE**

**Special Considerations**:
- These files are 3000+ lines
- Break into smaller components if possible during conversion
- Use `any` types sparingly, document when used
- Consider splitting large files before conversion

---

### **Phase 13: Routes & Entry Points**
**Status**: Not Started  
**Estimated Time**: 2-3 hours  
**Complexity**: ⭐⭐ Simple

**Files to Convert**:

1. `routes/routes.jsx` → `routes.tsx`
2. `routes/RouteGuard.jsx` → `RouteGuard.tsx`
3. `layout/Layout.jsx` → `Layout.tsx`
4. `App.jsx` → `App.tsx`
5. `main.jsx` → `main.tsx`

**Conversion Steps**:
1. Type route configurations
2. Type route guards
3. Type layout props
4. Type entry point

---

### **Phase 14: Final Polish & Strict Mode**
**Status**: Not Started  
**Estimated Time**: 4-6 hours  
**Complexity**: ⭐⭐⭐ Moderate

**Tasks**:
- [ ] Enable `strict: true` in `tsconfig.json`
- [ ] Fix all strict mode errors
- [ ] Remove all `any` types (or document why they're needed)
- [ ] Add missing type annotations
- [ ] Review and improve type definitions
- [ ] Add JSDoc comments for public APIs
- [ ] Update documentation

---

## Conversion Guidelines

### General Rules

1. **File Naming**:
   - `.js` → `.ts`
   - `.jsx` → `.tsx`
   - Keep same directory structure

2. **Imports**:
   - TypeScript can import from `.js` files
   - No need to update imports immediately
   - Gradually update as dependencies are converted

3. **Type Safety Levels**:
   ```typescript
   // ✅ Good: Specific types
   function calculateTotal(items: OrderItem[]): number { }
   
   // ⚠️ Acceptable during migration: Generic types
   function processData(data: unknown): any { }
   
   // ❌ Avoid: Excessive use of any
   function badFunction(data: any): any { }
   ```

4. **Common Patterns**:

   **Component Props**:
   ```typescript
   interface ButtonProps {
     label: string;
     onClick: () => void;
     disabled?: boolean;
   }
   
   const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
     // ...
   };
   ```

   **State**:
   ```typescript
   const [count, setCount] = useState<number>(0);
   const [user, setUser] = useState<User | null>(null);
   ```

   **Refs**:
   ```typescript
   const inputRef = useRef<HTMLInputElement>(null);
   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   ```

   **Event Handlers**:
   ```typescript
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
     setValue(e.target.value);
   };
   
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
     e.preventDefault();
   };
   ```

   **API Calls**:
   ```typescript
   const fetchUser = async (id: string): Promise<User | null> => {
     try {
       const response = await api.get(`/users/${id}`);
       return response.data as User;
     } catch (error) {
       console.error(error);
       return null;
     }
   };
   ```

5. **Dealing with Third-Party Libraries**:
   - Install `@types/[package-name]` if available
   - Create `.d.ts` files for missing types
   - Use `// @ts-ignore` sparingly and document why

---

## Testing Strategy

### After Each File Conversion

1. **Build Check**:
   ```bash
   npm run build
   ```
   - Should complete without errors
   - Warnings are acceptable during migration

2. **Lint Check**:
   ```bash
   npm run lint
   ```
   - Fix any new linting errors
   - TypeScript ESLint rules may catch new issues

3. **Manual Testing**:
   - Test the feature(s) that use the converted file
   - Verify no runtime errors
   - Check browser console for warnings

4. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   - Should pass (or have acceptable errors)

### After Each Phase

1. Full application build
2. Run full test suite (if exists)
3. Manual smoke testing of affected features
4. Review converted files for consistency

---

## Progress Tracking

### Phase Completion Checklist

For each phase, track:
- [ ] All files converted
- [ ] Build passes
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Manual testing completed
- [ ] Documentation updated

### Current Status

**Overall Progress**: 0% (0/14 phases complete)

| Phase | Status | Files | Progress |
|-------|--------|-------|----------|
| Phase 0: Setup | ⬜ Not Started | 3 | 0% |
| Phase 1: Types & Constants | ⬜ Not Started | ~6 | 0% |
| Phase 2: Utils | ⬜ Not Started | 9 | 0% |
| Phase 3: Helpers | ⬜ Not Started | ~15 | 0% |
| Phase 4: Services | ⬜ Not Started | 8 | 0% |
| Phase 5: Config | ⬜ Not Started | 4 | 0% |
| Phase 6: Hooks | ⬜ Not Started | 4 | 0% |
| Phase 7: Context | ⬜ Not Started | 4 | 0% |
| Phase 8: Simple Components | ⬜ Not Started | ~19 | 0% |
| Phase 9: Simple Pages | ⬜ Not Started | ~5 | 0% |
| Phase 10: Forms & Modals | ⬜ Not Started | ~15 | 0% |
| Phase 11: Medium Components | ⬜ Not Started | ~20 | 0% |
| Phase 12: Complex Components | ⬜ Not Started | ~15 | 0% |
| Phase 13: Routes | ⬜ Not Started | 5 | 0% |
| Phase 14: Final Polish | ⬜ Not Started | - | 0% |

**Total Estimated Time**: ~80-120 hours  
**Recommended Pace**: 1-2 phases per sprint (2 weeks)

---

## Notes & Considerations

### Challenges to Watch For

1. **Large Files**: `PetitionTabContent.jsx` and `PetitionSteps.jsx` are 3000+ lines
   - Consider splitting before conversion
   - Break into smaller components
   - Extract logic to hooks/helpers

2. **Dynamic Imports**: `lazyWithRetry.js` uses dynamic imports
   - Ensure proper typing for lazy-loaded components

3. **Google Maps API**: Custom type declarations needed
   - Create `google-maps.d.ts` early
   - Reference official types if available

4. **Third-Party Libraries**: Some may lack TypeScript support
   - Check for `@types` packages
   - Create custom `.d.ts` files if needed

5. **Mixed Code**: During migration, `.js` and `.ts` files will coexist
   - TypeScript handles this well
   - Gradually update imports as files are converted

### Best Practices

1. **Start Small**: Begin with the simplest files to build confidence
2. **Test Frequently**: Test after each file conversion
3. **Document Decisions**: Comment why `any` is used if needed
4. **Incremental Strictness**: Start with `strict: false`, enable gradually
5. **Code Reviews**: Review each phase before moving to next
6. **Refactor When Converting**: Use conversion as opportunity to improve code

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)
- [Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

---

**Last Updated**: 2024-12-09  
**Next Review**: After Phase 1 completion

