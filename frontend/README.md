# DPRMS frontend

React and TypeScript frontend for the DOST Project and Resource Management System.

Install dependencies with `npm ci` and start the development server with `npm run dev`.
Set `VITE_API_BASE_URL` in a local `.env` file when the API is not served at
`http://127.0.0.1:8000/api`.

Before submitting changes, run:

```sh
npm run format:itd
npm run lint
npm run build
npm test
```

Use `format:itd` for the four-space Allman layout. Running Prettier directly
reverts the required brace style. `lint` runs Oxlint and the ITD source checks.
The Playwright suite starts its own frontend on port 5178 and uses isolated
fixtures and mocked API responses. Install Chromium with `npx playwright install chromium` if it is not already present. `test:downloads` and `test:compliance`
run the two suites separately.

See [DPT-147 conventions and API dependency](../docs/DPT-147_FRONTEND_COMPLIANCE.md)
for naming rules, React exceptions, verification coverage, and the outstanding
backend schema-prefix migration.
