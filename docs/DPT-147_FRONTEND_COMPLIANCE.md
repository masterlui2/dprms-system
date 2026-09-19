# DPT-147 frontend conventions

The frontend now uses the ITD naming and layout conventions throughout `frontend/src`.
Run the checks below from `frontend/` before submitting subsequent changes:

```sh
npm ci
npm run format:itd
npm run lint
npm run build
npm test
```

`format:itd` wraps TypeScript and JSX with the pinned Prettier version, then uses
the installed TypeScript compiler formatter to apply Allman braces and four-space
indentation. Use this command instead of running Prettier directly. `check:itd`
checks the source conventions and verifies the formatting without writing files.
`lint` includes that check. `.editorconfig` and `.gitattributes` keep indentation
and source line endings consistent across Windows and Linux.

## Implementation

| Checklist | Frontend treatment |
| --- | --- |
| File names | Utilities, services, hooks, configuration, and types use lowercase snake_case. React component files use PascalCase. Imports and browser-test module paths follow the renamed files. |
| Functions and components | Components use PascalCase; functions use camelCase with normalized acronym casing. Internal implementations have an underscore. Boolean functions use positive predicate names. |
| Variables and props | Local bindings and application-owned data props use the ITD type prefixes. Module data bindings use `g_`; named configuration constants use uppercase snake_case. State setters include their state's type prefix. |
| Layout | Every source file has the system, purpose, programmer, and copyright header. Braced control statements, one declaration per statement, four-space indentation, operator spacing, and literal single-quoted record accessors are enforced. |
| Control flow | Switches have explicit defaults. Counter declarations precede traditional `for` loops. Invalid intervention types throw a descriptive error. |
| Rendering | Compound display conditions are named near the rendering code. Nullable document histories and submenu lists use stable local values so type narrowing remains explicit. |
| Comments | Functions, hooks, and components have descriptions; long blocks have closing annotations. Existing domain explanations remain alongside the relevant processing. |
| Errors | Awaited operations are caught in their function. Catches report through `reportError`, which deduplicates errors and excludes credentials and request/response bodies. Existing local feedback is retained. Render failures and otherwise-unhandled asynchronous failures have recovery UI. |
| API contracts | 73 contract declarations are centralized under `src/types/api`. Service type re-exports preserve compatibility. Payload mappers continue to use the server's actual keys. See the outstanding schema dependency below. |

## Interpretation for React and TypeScript

- React hooks retain the required `use...` spelling even when their files use
  snake_case. React components retain PascalCase, including local components.
- Callback props and imported library functions retain their callable interface
  names. React lifecycle methods (`render`, `componentDidCatch`, and
  `getDerivedStateFromError`), `props`, and `state` retain React's required names.
- Standard React/HTML attributes, including `children`, `key`, `ref`, `className`,
  `style`, `id`, `name`, `value`, `title`, `type`, and `role`, retain their external
  spelling. Destructured local aliases still use the appropriate ITD prefix.
- API keys, persisted document/form record keys, library option names, and route
  parameters are contracts, not local variable names. They are preserved and
  accessed through prefixed local bindings. New custom component data props are
  prefixed. Type and interface names remain PascalCase.
- `const` does not imply a business constant: component state snapshots and
  derived values use data prefixes. Named static configuration uses uppercase;
  mutable module objects, caches, and shared instances use `g_` plus a type prefix.
- TypeScript represents integer, float, double, and currency values as `number`.
  Names distinguish their domain use; indices/counts use `int`, monetary values
  use `cur`, and fractional measurements/rates use `dbl`. Unknown objects and
  mixed unions use `obj`, generic values use `udt`, and `Date` values use `dt` or
  `dtm`. Serialized dates remain strings at the API boundary.
- `for...of` and `for...in` retain their per-iteration bindings. Hoisting those
  bindings would change closure behavior. The counter rule applies to traditional
  `for` loops. Assignment operators such as `+=` retain spaces around operands.
- Tool-discovered configuration and test suffixes, such as `vite.config.ts` and
  `.spec.ts`, keep their platform conventions. The mandatory source checks cover
  `frontend/src`; tests and tooling are checked by their own runners and Oxlint.

## Outstanding backend schema dependency

The checked-out backend does **not** implement the proposed two/three-letter
table-column prefix migration. For example:

- `backend/app/Models/User.php` and authentication responses use `id`, `name`,
  `email`, and `program_type`, rather than `usr_id` and other `usr_` fields.
- `backend/app/Models/Employee.php` and
  `backend/app/Http/Requests/Project/BatchEmployeeRequest.php` use `employee_name`,
  `salary_rate`, `employment_type`, and `sectoral_classification`.
- Quarterly monitoring payloads use `quarter_id`, `product_name`, `market_name`,
  and the existing related record fields.

Renaming those frontend keys to guessed `emp_`, `usr_`, or other prefixes would
break current requests and table/form data. The remaining schema-prefix portion
of DPT-147 requires the corresponding backend migration or an authoritative
old-to-new API field map. Once available, update the DTOs in `src/types/api`, the
service payload/read mappers, and the contract tests together. The current branch
does not claim that this upstream migration is complete.

## Regression coverage

The existing suite covers download permissions, fallback behavior, CSV escaping,
receipt downloads, account settings, monitoring exports, project selection, and
equipment registration. The compliance suite adds table sorting/filtering and
alignment, public navigation/login rendering, authentication payload keys,
employee/market write mappings, diagnostic redaction, cancellation handling,
unauthorized responses, and visible render/async error recovery.

These are browser tests with isolated fixture data and mocked API responses;
they do not replace integration testing against the deployed backend. The
production build's existing large-bundle warning is outside this style refactor.
