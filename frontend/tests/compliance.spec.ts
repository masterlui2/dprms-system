import { expect, test, type Page } from '@playwright/test';

async function prepare(page: Page, scenario = '')
{
    await page.goto(`/tests/compliance.fixture.html?scenario=${scenario}`);
    await expect(page.locator('#root')).not.toBeEmpty();
}

test('table props preserve sorting, filtering, alignment, and empty feedback', async ({ page }, testInfo) =>
{
    await page.setViewportSize({ width: 1400, height: 900 });
    await prepare(page);
    const table = page.getByRole('table');
    await expect(table.getByRole('row')).toHaveCount(4);
    await page.screenshot({ path: testInfo.outputPath('data-table.png') });
    await table.getByRole('button', { name: 'Amount' }).click();
    await expect(table.locator('tbody tr').first()).toContainText('Beta');
    await expect(table.locator('tbody tr').first().locator('td').last()).toHaveClass(/text-right/);
    await table.getByRole('button', { name: 'Amount' }).click();
    await expect(table.locator('tbody tr').first()).toContainText('Gamma');
    await page.getByPlaceholder('Find an entry').fill('Alpha');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table.locator('tbody tr')).toContainText('100');
    await page.getByPlaceholder('Find an entry').fill('missing');
    await expect(page.getByText('No matching entries')).toBeVisible();
});

test('render failure presents a recovery action', async ({ page }, testInfo) =>
{
    await prepare(page, 'render-error');
    await expect(page.getByRole('heading', { name: 'This page could not be displayed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('render-recovery.png') });
    await expect(page.getByText('Synthetic render failure', { exact: true })).toHaveCount(0);
});

test('route failure uses recovery guidance instead of a diagnostic screen', async ({ page }) =>
{
    await prepare(page, 'route-error');
    await expect(page.getByRole('heading', { name: 'This page could not be displayed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
    await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
});

test('unexpected asynchronous failure is visible and dismissible', async ({ page }, testInfo) =>
{
    await prepare(page);
    await page.getByRole('button', { name: 'Fail action' }).click();
    await expect(page.getByRole('alert')).toContainText('The action could not be completed');
    await page.screenshot({ path: testInfo.outputPath('async-recovery.png') });
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
});

test('public navigation and login render without browser errors', async ({ page }, testInfo) =>
{
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Submit GIA Proposal', exact: true })).toBeVisible();
    await expect(page.locator('#home').getByRole('link', { name: 'Register SETUP Proposal', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('landing-page.png') });
    await page.getByRole('link', { name: 'Sign In', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('login-page.png') });
    expect(errors).toEqual([]);
});

test('intentional cancellation does not display an error', async ({ page }) =>
{
    await prepare(page);
    await page.evaluate(() => window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(), reason: new DOMException('Canceled', 'AbortError'),
    })));
    await expect(page.getByRole('alert')).toHaveCount(0);
});

test('diagnostics exclude credentials, payloads, and private error text', async ({ page }) =>
{
    await prepare(page);
    const messages: string[] = [];
    page.on('console', message => { if (message.type() === 'error') messages.push(message.text()); });
    await page.evaluate(async () =>
    {
        const { reportError } = await import('/src/utils/error_reporting.ts');
        const failure = Object.assign(new Error('PRIVATE_CUSTOMER_DATA'), {
            isAxiosError: true,
            code: 'ERR_BAD_RESPONSE',
            config: { headers: { Authorization: 'Bearer SECRET_TOKEN' }, data: 'PRIVATE_FORM_DATA' },
            response: { status: 500, data: 'PRIVATE_RESPONSE' },
        });
        reportError(failure, 'Regression request failed.');
        reportError(failure, 'Same failure propagated.');
    });
    expect(messages.filter(message => message.includes('Regression request failed.'))).toHaveLength(1);
    expect(messages.join('\n')).toContain('500');
    expect(messages.join('\n')).not.toMatch(/PRIVATE_|SECRET_TOKEN|Same failure propagated/);
});

test('authentication preserves the Laravel request and response keys', async ({ page }) =>
{
    await prepare(page);
    await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }));
    let payload: unknown;
    await page.route('**/api/login', async route =>
    {
        payload = route.request().postDataJSON();
        await route.fulfill({ json: { data: { token: 'test-token', user: {
            id: 71, name: 'Test Staff', email: 'staff@example.test', program_type: 'SETUP', role: 'SSCP_FOCAL',
        } }, message: 'Logged in' } });
    });
    const result = await page.evaluate(async () =>
    {
        const { loginWithBackend } = await import('/src/services/auth_service.ts');
        return loginWithBackend('staff@example.test', 'test-password');
    });
    expect(payload).toEqual({ email: 'staff@example.test', password: 'test-password' });
    expect(result.token).toBe('test-token');
    expect(result.user).toMatchObject({ id: 71, name: 'Test Staff', program: 'SETUP', role: 'focal' });
});

test('employee and market writes retain the supported backend schema', async ({ page }) =>
{
    await prepare(page);
    const result = await page.evaluate(async () =>
    {
        const { employeeAdapter, marketAdapter } = await import('/src/services/quarter_resource_adapter.ts');
        return {
            employee: employeeAdapter('indirectEmployees').toPayload({
                name: 'Test Employee', age: 30, employmentStatus: 'Part-timer', sex: 'Female',
                sectoralGroup: 'SC', workdaysQuarter: 20, salaryRate: 450.5,
            }),
            market: marketAdapter('internationalMarkets').toPayload({
                marketName: 'Test Market', address: 'Test Address', condition: 'NEW',
                effectivityDate: '2026-08-10', contactPerson: 'Test Contact', productServiceSold: 'Food', volumeDelivered: 25,
            }),
        };
    });
    expect(result.employee).toEqual({
        employee_name: 'Test Employee', age: 30, status: 'Part-Timer', gender: 'Female',
        sectoral_group: 'Senior', sectoral_classification: 'Senior', employment_type: 'INDIRECT',
        days_of_attendance: 20, salary_rate: 450.5,
    });
    expect(result.market).toEqual({
        market_name: 'Test Market', market_type: 'INTERNATIONAL', address: 'Test Address', condition: 'new',
        effective_date: '2026-08-10', contact_person: 'Test Contact', service: 'Food', volume: 25,
    });
});

test('failed service calls reject and unauthorized responses clear the token', async ({ page }) =>
{
    await prepare(page);
    await page.route('**/api/notifications', route => route.fulfill({ status: 401, json: { message: 'Unauthenticated' } }));
    const result = await page.evaluate(async () =>
    {
        localStorage.setItem('dprms.auth-token', 'expired-test-token');
        const { fetchNotifications } = await import('/src/services/notification_store.ts');
        try
        {
            await fetchNotifications();
            return { rejected: false, token: localStorage.getItem('dprms.auth-token') };
        }
        catch
        {
            return { rejected: true, token: localStorage.getItem('dprms.auth-token') };
        }
    });
    expect(result).toEqual({ rejected: true, token: null });
});
