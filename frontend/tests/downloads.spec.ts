import { expect, test, type Page } from '@playwright/test'

const staff = { id: 901, email: 'setup@example.test', name: 'Test Staff', initials: 'TS', role: 'focal', program: 'SETUP' }
const director = { ...staff, id: 902, email: 'director@example.test', role: 'provincial_director', program: undefined }

// Native OPFS handles exercise real IndexedDB structured cloning and file writes
// in isolated browser storage, without touching a user's download directory.
async function prepare(page: Page, user = staff, picker = 'folder') {
  await page.addInitScript(({ user, picker }) => {
    localStorage.setItem('dprms.mock-user', JSON.stringify(user))
    Object.assign(window, { pickerCalls: 0, testFolder: 'Default', testAlerts: [] })
    window.alert = (message) => (window as any).testAlerts.push(message)
    if (picker === 'unsupported') {
      Object.defineProperty(window, 'showDirectoryPicker', { value: undefined, configurable: true })
    } else {
      Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: async function () {
        if (this !== window) throw new Error('Directory picker lost its Window receiver')
        ;(window as any).pickerCalls += 1
        if (picker === 'cancel') throw new DOMException('Canceled', 'AbortError')
        return (await navigator.storage.getDirectory()).getDirectoryHandle((window as any).testFolder, { create: true })
      } })
    }
  }, { user, picker })
  await page.route('**/__download-tests', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>Download regression fixture</body></html>' }))
  await page.goto('/__download-tests')
}

for (const [role, program, folders] of [
  ['focal', 'SETUP', ['SETUP']], ['proponent', 'GIA', ['GIA']],
  ['system_admin', undefined, ['GIA', 'SETUP']], ['provincial_director', undefined, ['GIA', 'SETUP']], ['rpmo', undefined, ['GIA', 'SETUP']],
] as const) {
  test(`initialization creates only authorized folders for ${role} ${program ?? 'both'}`, async ({ page }) => {
    await prepare(page, { ...staff, role, program } as typeof staff)
    const result = await page.evaluate(async () => {
      const manager = await import('/src/services/downloadManager.ts')
      const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
      await manager.initializeDownloadDirectories(user)
      const before = (window as any).pickerCalls
      await manager.chooseDefaultDownloadRoot(user)
      const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('Default')
      const names = []
      for await (const name of root.keys()) names.push(name)
      await manager.initializeDownloadDirectories(user)
      return { before, calls: (window as any).pickerCalls, names: names.sort() }
    })
    expect(result).toEqual({ before: 0, calls: 1, names: [...folders] })
  })
}

for (const prepared of [false, true]) {
  test(`canceling the first picker still downloads, prepared=${prepared}`, async ({ page }) => {
    await prepare(page, staff, 'cancel')
    const download = page.waitForEvent('download')
    const result = await page.evaluate(async (prepared) => {
      const manager = await import('/src/services/downloadManager.ts')
      const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
      const directory = prepared ? await manager.prepareDownloadDirectory(user) : undefined
      const result = await manager.downloadBlob({ blob: new Blob(['receipt']), directory, fileName: 'receipt.txt', program: 'SETUP', user })
      return { result, calls: (window as any).pickerCalls, alerts: (window as any).testAlerts }
    }, prepared)
    expect((await download).suggestedFilename()).toBe('SETUP_receipt.txt')
    expect(result.result.usedBrowserFallback).toBe(true)
    expect(result.calls).toBe(1)
    expect(result.alerts).toEqual([])
  })
}

test('custom subfolders persist across reloads and stay isolated by account', async ({ page }) => {
  await prepare(page)
  await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    await manager.chooseDefaultDownloadRoot(user)
    ;(window as any).testFolder = 'Custom'
    await manager.chooseCustomDownloadDirectory(user)
    await manager.saveDownloadSubpath(user, 'Reports\\2026')
  })
  await page.reload()
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    const cached = manager.getCachedDownloadDirectoryState(user)
    const state = await manager.getDownloadDirectoryState(user)
    const other = await manager.getDownloadDirectoryState({ ...user, id: 999 })
    const saved = await manager.downloadBlob({ blob: new Blob(['content']), fileName: 'report.txt', user })
    const duplicate = await manager.downloadBlob({ blob: new Blob(['second']), fileName: 'report.txt', user })
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('Custom')
    const reports = await (await (await root.getDirectoryHandle('Reports')).getDirectoryHandle('2026')).getDirectoryHandle('SETUP')
    const contents = await (await (await reports.getFileHandle('report.txt')).getFile()).text()
    const reset = await manager.resetDownloadDirectory(user)
    return { cached, state, other, saved, duplicate, contents, reset, calls: (window as any).pickerCalls }
  })
  expect(result.cached.activePath).toBe('Custom / Reports/2026 / SETUP')
  expect(result.state.activePath).toBe(result.cached.activePath)
  expect(result.other.configured).toBe(false)
  expect(result.saved.destination).toBe('Custom / Reports/2026 / SETUP / report.txt')
  expect(result.duplicate.destination).toContain('report (1).txt')
  expect(result.contents).toBe('content')
  expect(result.reset.activePath).toBe('Default / SETUP')
  expect(result.calls).toBe(0)
})

for (const hasDefault of [true, false]) {
test(`a missing custom handle reports its fallback, default available=${hasDefault}`, async ({ page }) => {
  await prepare(page)
  await page.evaluate(async (hasDefault) => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    await manager.chooseDefaultDownloadRoot(user)
    await new Promise<void>((resolve) => {
      const request = indexedDB.open('dprms-download-directories', 1)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('preferences', 'readwrite')
        const store = transaction.objectStore('preferences')
        const read = store.get(`user:${user.id}`)
        read.onsuccess = () => store.put({ ...read.result, mode: 'custom', customDirectory: undefined, defaultRoot: hasDefault ? read.result.defaultRoot : undefined })
        transaction.oncomplete = () => { db.close(); resolve() }
      }
    })
  }, hasDefault)
  await page.reload()
  const download = hasDefault ? null : page.waitForEvent('download')
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    const saved = await manager.downloadBlob({ blob: new Blob(['proof']), fileName: 'receipt.txt', user })
    return { saved, alerts: (window as any).testAlerts, calls: (window as any).pickerCalls }
  })
  if (hasDefault) {
    expect(result.saved.destination).toBe('Default / SETUP / receipt.txt')
    expect(result.alerts).toEqual(['The custom download folder is unavailable. DPRMS saved this file to your default SETUP folder instead.'])
  } else {
    expect((await download)!.suggestedFilename()).toBe('SETUP_receipt.txt')
    expect(result.saved.usedBrowserFallback).toBe(true)
    expect(result.alerts).toEqual(['The configured download folder is unavailable. DPRMS sent this file to your browser downloads instead.'])
  }
  expect(result.calls).toBe(0)
})
}

test('removed custom and default folders fall back to browser downloads', async ({ page }) => {
  await prepare(page)
  const download = page.waitForEvent('download')
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    await manager.chooseDefaultDownloadRoot(user)
    ;(window as any).testFolder = 'Custom'
    await manager.chooseCustomDownloadDirectory(user)
    const root = await navigator.storage.getDirectory()
    await root.removeEntry('Custom', { recursive: true })
    await root.removeEntry('Default', { recursive: true })
    await manager.initializeDownloadDirectories(user)
    const saved = await manager.downloadBlob({ blob: new Blob(['proof']), fileName: 'receipt.txt', user })
    return { saved, alerts: (window as any).testAlerts }
  })
  expect((await download).suggestedFilename()).toBe('SETUP_receipt.txt')
  expect(result.saved.usedBrowserFallback).toBe(true)
  expect(result.alerts).toHaveLength(1)
})

test('cold start never requests permission and denied access falls back', async ({ page }) => {
  await prepare(page)
  const download = page.waitForEvent('download')
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    await manager.chooseDefaultDownloadRoot(user)
    let requests = 0
    Object.assign(FileSystemDirectoryHandle.prototype, {
      queryPermission: async () => 'prompt',
      requestPermission: async () => { requests++; return 'denied' },
    })
    await manager.initializeDownloadDirectories(user)
    const coldStartRequests = requests
    const saved = await manager.downloadBlob({ blob: new Blob(['proof']), fileName: 'receipt.txt', user })
    return { coldStartRequests, saved }
  })
  await download
  expect(result.coldStartRequests).toBe(0)
  expect(result.saved.usedBrowserFallback).toBe(true)
})

test('multi-program legacy callers infer filenames and have a deterministic default', async ({ page }) => {
  await prepare(page, director as typeof staff)
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    const inferred = await manager.downloadBlob({ blob: new Blob(['a']), fileName: 'SETUP_report.csv', user })
    const defaulted = await manager.downloadBlob({ blob: new Blob(['b']), fileName: 'report.csv', user })
    return { inferred, defaulted }
  })
  expect(result.inferred.destination).toContain('/ SETUP /')
  expect(result.defaulted.destination).toContain('/ GIA /')
})

test('unassigned and unauthorized programs cannot write and paths cannot escape the chosen root', async ({ page }) => {
  await prepare(page)
  const messages = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    await manager.chooseDefaultDownloadRoot(user)
    const messages = []
    for (const operation of [
      () => manager.downloadBlob({ blob: new Blob(['a']), fileName: 'report.csv', program: 'GIA', user }),
      () => manager.downloadBlob({ blob: new Blob(['a']), fileName: 'report.csv', user: { ...user, program: undefined } }),
      () => manager.saveDownloadSubpath(user, '../Outside'),
      () => manager.saveDownloadSubpath(user, 'C:\\Outside'),
    ]) {
      try { await operation() } catch (error) { messages.push((error as Error).message) }
    }
    return messages
  })
  expect(messages).toHaveLength(4)
  expect(messages[0]).toContain('not authorized')
  expect(messages[1]).toContain('assigned program')
  expect(messages[2]).toContain('relative subfolder')
  expect(messages[3]).toContain('relative subfolder')
})

test('CSV preserves quotes, commas and newlines while neutralizing formulas', async ({ page }) => {
  await prepare(page)
  const result = await page.evaluate(async () => {
    const { createCsvBlob } = await import('/src/utils/csv.ts')
    const blob = createCsvBlob([['A,B', 'say "hello"', 'line\nbreak', '=SUM(1,2)', -4, '@command']])
    return { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())).slice(0, 3), csv: await blob.text() }
  })
  expect(result.bytes).toEqual([239, 187, 191])
  expect(result.csv).toBe('"A,B","say ""hello""","line\nbreak","\'=SUM(1,2)","-4","\'@command"\r\n')
})

test('unsupported browsers download without requiring a program from multi-program callers', async ({ page }) => {
  await prepare(page, director as typeof staff, 'unsupported')
  const download = page.waitForEvent('download')
  const result = await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    return manager.downloadBlob({ blob: new Blob(['content']), fileName: 'SETUP_report.csv', user: JSON.parse(localStorage.getItem('dprms.mock-user')!) })
  })
  expect((await download).suggestedFilename()).toBe('SETUP_report.csv')
  expect(result.usedBrowserFallback).toBe(true)
})

test('unavailable IndexedDB does not prevent a browser download', async ({ page }) => {
  await prepare(page)
  const download = page.waitForEvent('download')
  const result = await page.evaluate(async () => {
    indexedDB.open = () => { throw new DOMException('Storage blocked', 'SecurityError') }
    const manager = await import('/src/services/downloadManager.ts')
    return manager.downloadBlob({ blob: new Blob(['content']), fileName: 'report.csv', user: JSON.parse(localStorage.getItem('dprms.mock-user')!) })
  })
  await download
  expect(result.usedBrowserFallback).toBe(true)
})

test('a canceled preparation stays attached to its own download', async ({ page }) => {
  await prepare(page, staff, 'cancel')
  await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    const user = JSON.parse(localStorage.getItem('dprms.mock-user')!)
    ;(window as any).canceledDirectory = await manager.prepareDownloadDirectory(user)
    Object.defineProperty(window, 'showDirectoryPicker', { value: async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Chosen', { create: true }) })
    await manager.chooseDefaultDownloadRoot(user)
    const other = await manager.downloadBlob({ blob: new Blob(['other']), fileName: 'other.txt', user })
    if (other.usedBrowserFallback) throw new Error('Cancellation affected an unrelated download')
  })
  const download = page.waitForEvent('download')
  await page.evaluate(async () => {
    const manager = await import('/src/services/downloadManager.ts')
    await manager.downloadBlob({ blob: new Blob(['canceled']), directory: (window as any).canceledDirectory, fileName: 'canceled.txt', user: JSON.parse(localStorage.getItem('dprms.mock-user')!) })
  })
  expect((await download).suggestedFilename()).toBe('SETUP_canceled.txt')
})

test('Payment Review downloads the original receipt into SETUP', async ({ page }, testInfo) => {
  await prepare(page)
  const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhZkAAAAASUVORK5CYII=', 'base64')
  await page.route('**/api/setup/projects/34/ledger/12/payments/56/proof', (route) => route.fulfill({ contentType: 'image/png', body: imageBytes }))
  await page.goto('/tests/receipt.fixture.html')
  await page.getByRole('button', { name: 'Download Receipt', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Receipt saved to Default / SETUP / payment-proof.png')
  const bytes = await page.evaluate(async () => {
    const directory = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('Default')).getDirectoryHandle('SETUP')
    return Array.from(new Uint8Array(await (await (await directory.getFileHandle('payment-proof.png')).getFile()).arrayBuffer()))
  })
  expect(Buffer.from(bytes)).toEqual(imageBytes)
  await expect(page.getByRole('link', { name: 'Open', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('receipt-download.png') })
})

async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/setup/monitoring/projects')) {
      const number = Number(url.searchParams.get('page') ?? 1)
      await route.fulfill({ json: {
        data: [{ id: number, reference_number: `SETUP-${number}`, title: number === 1 ? '=Malicious, "title"' : 'Second page project', enterprise_name: 'Test enterprise', manager: 'Test Manager', setup_funding: 100, overall_compliance: 50, pending_reports: number, monitored: true, latest_report: null, last_monitored_at: '2026-09-01', district: 'Mati' }],
        statistics: { active_projects: 999, monitored_count: 999, pending_reports: 999 },
        filters: { districts: ['Mati'] },
        pagination: { current_page: number, last_page: 2, per_page: 1, total: 2, from: number, to: number },
      } })
    } else await route.fulfill({ json: { data: [], statistics: {}, unread_count: 0 } })
  })
}

test('Account settings work for staff and survive folder changes and reset', async ({ page }, testInfo) => {
  await prepare(page)
  await mockApi(page)
  await page.goto('/dashboard/project-monitoring')
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await page.getByRole('button', { name: 'Export directory', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Report Export Directory' })
  await expect(dialog.getByText('Authorized: SETUP', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Browse / Change folder' }).click()
  await expect(dialog.getByText('Default / SETUP', { exact: true })).toBeVisible()
  await dialog.getByLabel('Subfolder path').fill('Reports/2026')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog.getByText('Default / Reports/2026 / SETUP', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('account-export-directory.png') })
  await dialog.getByRole('button', { name: 'Reset to default' }).click()
  await expect(dialog.getByText('Default / SETUP', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close modal' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'File Settings', exact: true })).toHaveCount(0)
})

test('proponents can open the same Account dialog on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, { ...staff, role: 'proponent', program: 'GIA' })
  await mockApi(page)
  await page.goto('/programs/gia')
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await page.getByRole('button', { name: 'Export directory', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Report Export Directory' })
  await expect(dialog.getByText('Authorized: GIA', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Browse / Change folder' })).toBeEnabled()
  await page.screenshot({ path: testInfo.outputPath('proponent-export-directory-mobile.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('monitoring list exports all matching pages and overview summarizes filtered projects', async ({ page }) => {
  await prepare(page)
  await mockApi(page)
  const pageTwoRequests: URL[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.endsWith('/setup/monitoring/projects') && url.searchParams.get('page') === '2') pageTwoRequests.push(url)
  })
  await page.goto('/dashboard/project-monitoring?view=projects&quarter=Q1&year=2026')
  await page.getByLabel('Search monitored projects').fill('Test')
  await page.getByRole('button', { name: 'Export list', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('CSV saved to Default / SETUP')
  const list = await page.evaluate(async () => {
    const directory = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('Default')).getDirectoryHandle('SETUP')
    for await (const [name, handle] of directory.entries()) if (name.includes('_list_')) return (await handle.getFile()).text()
  })
  expect(list).toContain('Second page project')
  expect(list).toContain("'=Malicious")
  expect(pageTwoRequests.some((url) => url.searchParams.get('search') === 'Test' && url.searchParams.get('quarter') === '1' && url.searchParams.get('year') === '2026')).toBe(true)
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.getByRole('button', { name: 'Export report', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('_report_')
  const report = await page.evaluate(async () => {
    const directory = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('Default')).getDirectoryHandle('SETUP')
    for await (const [name, handle] of directory.entries()) if (name.includes('_report_')) return (await handle.getFile()).text()
  })
  expect(report).toContain('"Active Projects","2"')
  expect(report).toContain('"Pending Reports","3"')
  expect(report).not.toContain('999')
})

test('GIA report exports the selected semester and filtered milestone metrics', async ({ page }) => {
  await prepare(page, { ...staff, program: 'GIA' })
  await mockApi(page)
  await page.route('**/api/gia/monitoring/projects*', (route) => route.fulfill({ json: {
    data: [{ id: 1, reference_number: 'GIA-1', title: 'Climate project', implementing_agency: 'Test Agency', project_leader: 'Test Leader', office_address: 'Mati', grant_amount: 1000, monitoring_status: 'IN_PROGRESS', last_monitored_at: '2026-09-01', milestone_progress: 70, latest_report: null, semestral_context: { year: 2026, semester: 1 }, milestones: [
      { id: 1, number: 1, title: 'Complete', status: 'COMPLETED', completion_percentage: 100 },
      { id: 2, number: 2, title: 'Delayed', status: 'DELAYED', completion_percentage: 40 },
    ] }],
    access: { can_edit: true, read_only: false }, filters: { agencies: ['Test Agency'], statuses: ['IN_PROGRESS'] },
    statistics: { active_grants: 999, monitored_projects: 999, total_grant_amount: 999, average_milestone_progress: 999, pending_milestones: 999, delayed_milestones: 999 },
    pagination: { current_page: 1, last_page: 1, per_page: 6, total: 1, from: 1, to: 1 },
  } }))
  await page.goto('/dashboard/project-monitoring?program=GIA&semester=1&year=2026')
  await page.getByRole('button', { name: 'Export report', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('CSV saved to Default / GIA')
  const csv = await page.evaluate(async () => {
    const directory = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('Default')).getDirectoryHandle('GIA')
    for await (const [name, handle] of directory.entries()) if (name.includes('_report_')) return (await handle.getFile()).text()
  })
  expect(csv).toContain('"Period","1st Semester 2026"')
  expect(csv).toContain('"Total Grant Amount","1000"')
  expect(csv).toContain('"Average Milestone Progress","70"')
  expect(csv).toContain('"Pending Milestones","1"')
  expect(csv).not.toContain('999')
})

test('large project lists can be searched and selected by keyboard', async ({ page }, testInfo) => {
  await page.goto('/tests/project-picker.fixture.html')
  await page.getByRole('button', { name: 'Search and select a GIA project' }).click()
  await expect(page.getByText('120 projects found')).toBeVisible()
  await expect(page.getByText('Showing the first 50 matches. Add another search word to narrow the list.')).toBeVisible()

  const search = page.getByRole('combobox', { name: 'Search active projects' })
  await search.fill('cacao mati')
  await expect(page.getByText('1 project found')).toBeVisible()
  const result = page.getByRole('option', { name: /GIA-2026-0088.*Cacao Processing/ })
  await expect(result).toBeVisible()
  expect((await result.boundingBox())!.height).toBeLessThanOrEqual(42)
  await page.screenshot({ path: testInfo.outputPath('searchable-project-results.png') })
  await search.press('ArrowDown')
  await search.press('Enter')

  await expect(page.getByRole('button', { name: /Active project: GIA-2026-0088/ })).toBeVisible()
  await expect(page.getByTestId('selected-project')).toHaveText('88')
  await expect(page.getByRole('button', { name: 'Change project' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('selected-project.png') })
})

test('equipment registration validates visibly and submits a complete GIA asset', async ({ page }) => {
  let submitted: Record<string, unknown> | null = null
  await page.route('**/api/v1/equipment', async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>
    submitted = payload
    await route.fulfill({ status: 201, json: { message: 'Equipment registered.', data: {
      id: 501, asset_reference: 'GIA-EQ-2026-00501', equipment_name: payload.equipment_name,
      serial_number: payload.serial_number, brand: payload.brand, model: payload.model,
      acquisition_cost: payload.acquisition_cost, acquisition_date: payload.acquisition_date,
      installed_at: null, condition: 'good', status: 'Available', last_checked_at: null,
      program_type: 'GIA', category: 'Laboratory Equipment', organization: 'Davao State University',
      location: payload.location, property_number: 'GIA-EQ-2026-00501', supplier_name: payload.supplier_name,
      specifications: null, unit: 'unit', project: { id: 88, reference_number: 'GIA-2026-0088', title: 'Cacao Research Center', program_type: 'GIA' },
      qr_code: { reference: 'GIA-EQ-2026-00501', data: 'DPRMS:EQUIPMENT:GIA-EQ-2026-00501', is_active: true }, inspection_history: [],
    } } })
  })
  await page.goto('/tests/equipment-registration.fixture.html')

  await page.getByRole('button', { name: 'Register & finish' }).click()
  await expect(page.getByRole('alert')).toContainText('active project, equipment category, equipment name')

  await page.getByRole('button', { name: 'Search and select a GIA project' }).click()
  await page.getByRole('option', { name: /GIA-2026-0088/ }).click()
  await page.getByLabel('Equipment category').selectOption('9')
  await page.getByLabel('Equipment name').fill('Cacao Moisture Analyzer')
  await page.getByLabel('Serial number').fill('GIA-SN-501')
  await page.getByLabel('Brand').fill('DOST Lab')
  await page.getByLabel('Model').fill('CMA-10')
  await page.getByLabel('Procurement cost').fill('125000')
  await page.getByLabel('Supplier').fill('Science Supply Corp')
  await page.getByLabel('Current location').fill('Mati City Laboratory')
  await page.getByRole('button', { name: 'Register & finish' }).click()

  await expect(page.getByTestId('saved-equipment')).toHaveText('Cacao Moisture Analyzer')
  expect(submitted).toMatchObject({ project_id: 88, category_id: 9, program_type: 'GIA', serial_number: 'GIA-SN-501' })
})
