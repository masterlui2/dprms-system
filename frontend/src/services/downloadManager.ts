import { ROLES } from '../config/permissions'
import type { MockUser } from '../lib/mockAuth'
import type { ApplicationProgram } from '../types/application'

const DATABASE_NAME = 'dprms-download-directories'
const DATABASE_VERSION = 1
const STORE_NAME = 'preferences'
const preferenceCache = new Map<string, StoredPreference | null>()
const METADATA_PREFIX = 'dprms.download-directory.'

type PermissionMode = 'read' | 'readwrite'
type PermissionStateValue = 'denied' | 'granted' | 'prompt'

interface DirectoryHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission?: (descriptor?: { mode?: PermissionMode }) => Promise<PermissionStateValue>
  requestPermission?: (descriptor?: { mode?: PermissionMode }) => Promise<PermissionStateValue>
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    id?: string
    mode?: PermissionMode
    startIn?: FileSystemHandle | string
  }) => Promise<FileSystemDirectoryHandle>
}

type StoredPreference = {
  customDirectory?: FileSystemDirectoryHandle
  customSubpath?: string
  defaultRoot?: FileSystemDirectoryHandle
  key: string
  mode: 'custom' | 'default'
  updatedAt: string
}

export type DownloadDirectoryState = {
  activePath: string
  authorizedPrograms: ApplicationProgram[]
  browserSupported: boolean
  configured: boolean
  mode: 'custom' | 'default'
  permission: PermissionStateValue | 'unknown'
  customSubpath: string
}

export type DownloadResult = {
  destination: string
  fallbackReason?: string
  usedBrowserFallback: boolean
}

export type PreparedDownloadDirectory = { browserFallbackReason?: string }

function userKey(user: MockUser): string {
  return `user:${user.id ?? user.email.trim().toLowerCase()}`
}

function mirrorPreference(preference: StoredPreference): void {
  const root = preference.mode === 'custom' ? preference.customDirectory : preference.defaultRoot
  try {
    window.localStorage.setItem(`${METADATA_PREFIX}${preference.key}`, JSON.stringify({
      mode: preference.mode,
      rootName: root?.name,
      customSubpath: preference.mode === 'custom' ? preference.customSubpath ?? '' : '',
    }))
  } catch {
    // Directory handles remain persisted in IndexedDB when localStorage is disabled.
  }
}

/** Display metadata only; actual access is always checked against the saved handle. */
export function getCachedDownloadDirectoryState(user: MockUser): DownloadDirectoryState {
  const programs = getAuthorizedDownloadPrograms(user)
  const state: DownloadDirectoryState = {
    activePath: 'Browser Downloads · choose a folder to enable program routing',
    authorizedPrograms: programs,
    browserSupported: Boolean(directoryPicker() && window.indexedDB),
    configured: false,
    mode: 'default',
    permission: 'unknown',
    customSubpath: '',
  }
  try {
    const metadata = JSON.parse(window.localStorage.getItem(`${METADATA_PREFIX}${userKey(user)}`) ?? 'null')
    if (metadata && typeof metadata.rootName === 'string') {
      state.mode = metadata.mode === 'custom' ? 'custom' : 'default'
      state.customSubpath = typeof metadata.customSubpath === 'string' ? metadata.customSubpath : ''
      state.activePath = pathForDefault([metadata.rootName, state.customSubpath].filter(Boolean).join(' / '), programs)
      state.configured = true
    }
  } catch { /* The authoritative state will be loaded from IndexedDB. */ }
  return state
}

function pickerId(prefix: string, user: MockUser): string {
  const identity = String(user.id ?? user.email.trim().toLowerCase())
  let hash = 0
  for (const character of identity) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function readPreference(user: MockUser): Promise<StoredPreference | null> {
  const key = userKey(user)
  if (preferenceCache.has(key)) return preferenceCache.get(key) ?? null
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const preference = (request.result as StoredPreference | undefined) ?? null
      preferenceCache.set(key, preference)
      if (preference) mirrorPreference(preference)
      resolve(preference)
    }
    transaction.oncomplete = () => database.close()
  })
}

async function writePreference(preference: StoredPreference): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(preference)
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => {
      database.close()
      preferenceCache.set(preference.key, preference)
      mirrorPreference(preference)
      resolve()
    }
  })
}

async function permissionFor(
  handle: FileSystemDirectoryHandle,
  requestIfNeeded: boolean,
): Promise<PermissionStateValue> {
  const permissionHandle = handle as DirectoryHandleWithPermission
  if (!permissionHandle.queryPermission) return 'granted'

  const current = await permissionHandle.queryPermission({ mode: 'readwrite' })
  if (current === 'granted' || !requestIfNeeded || !permissionHandle.requestPermission) {
    return current
  }
  return permissionHandle.requestPermission({ mode: 'readwrite' })
}

function directoryPicker(): DirectoryPickerWindow['showDirectoryPicker'] {
  return (window as DirectoryPickerWindow).showDirectoryPicker
}

async function pickDirectory(id: string): Promise<FileSystemDirectoryHandle> {
  const picker = directoryPicker()
  if (!picker) throw new Error('DIRECTORY_PICKER_UNAVAILABLE')
  return picker.call(window, { id, mode: 'readwrite', startIn: 'downloads' })
}

export function getAuthorizedDownloadPrograms(user: MockUser): ApplicationProgram[] {
  if (
    user.role === ROLES.SYSTEM_ADMIN ||
    user.role === ROLES.PROVINCIAL_DIRECTOR ||
    user.role === ROLES.RPMO
  ) {
    return ['GIA', 'SETUP']
  }

  if (user.program === 'SETUP' || user.program === 'GIA') return [user.program]

  return []
}

async function initializeProgramFolders(
  root: FileSystemDirectoryHandle,
  user: MockUser,
): Promise<void> {
  for (const program of getAuthorizedDownloadPrograms(user)) {
    await root.getDirectoryHandle(program, { create: true })
  }
}

function pathForDefault(rootName: string, programs: ApplicationProgram[]): string {
  if (programs.length === 0) return 'No program is assigned to this account'
  if (programs.length === 1) return `${rootName} / ${programs[0]}`
  return `${rootName} / {GIA, SETUP}`
}

export async function getDownloadDirectoryState(user: MockUser): Promise<DownloadDirectoryState> {
  const programs = getAuthorizedDownloadPrograms(user)
  const supported = Boolean(directoryPicker() && window.indexedDB)
  if (!supported) {
    return {
      activePath: 'Browser Downloads (folder routing is not supported)',
      authorizedPrograms: programs,
      browserSupported: false,
      configured: false,
      mode: 'default',
      permission: 'unknown',
      customSubpath: '',
    }
  }

  const preference = await readPreference(user)
  const mode = preference?.mode ?? 'default'
  const activeHandle = mode === 'custom' ? preference?.customDirectory : preference?.defaultRoot
  if (!activeHandle) {
    return {
      activePath: programs.length === 0
        ? 'No program is assigned to this account'
        : programs.length === 1
          ? `Choose a DPRMS root folder / ${programs[0]}`
          : 'Choose a DPRMS root folder / {GIA, SETUP}',
      authorizedPrograms: programs,
      browserSupported: true,
      configured: false,
      mode,
      permission: 'unknown',
      customSubpath: preference?.customSubpath ?? '',
    }
  }

  let permission: PermissionStateValue = 'denied'
  try { permission = await permissionFor(activeHandle, false) } catch { /* A stale handle remains visible so it can be changed. */ }
  return {
    activePath: pathForDefault([activeHandle.name, mode === 'custom' ? preference?.customSubpath : ''].filter(Boolean).join(' / '), programs),
    authorizedPrograms: programs,
    browserSupported: true,
    configured: true,
    mode,
    permission,
    customSubpath: mode === 'custom' ? preference?.customSubpath ?? '' : '',
  }
}

/** Recreates authorized folders on app cold start when permission is already granted. */
export async function initializeDownloadDirectories(user: MockUser): Promise<void> {
  if (!directoryPicker() || !window.indexedDB) return
  const preference = await readPreference(user)
  if (!preference) return
  const activeRoot = preference.mode === 'custom'
    ? preference.customDirectory
    : preference.defaultRoot
  try {
    if (activeRoot && (await permissionFor(activeRoot, false)) === 'granted') {
      const root = preference.mode === 'custom' ? await subdirectory(activeRoot, preference.customSubpath) : activeRoot
      await initializeProgramFolders(root, user)
      return
    }
  } catch { /* A removed custom folder must not prevent default initialization. */ }
  try {
    if (preference.defaultRoot && (await permissionFor(preference.defaultRoot, false)) === 'granted') {
      await initializeProgramFolders(preference.defaultRoot, user)
    }
  } catch { /* Cold start stays silent; downloads report the fallback destination. */ }
}

export async function chooseDefaultDownloadRoot(user: MockUser): Promise<DownloadDirectoryState> {
  if (getAuthorizedDownloadPrograms(user).length === 0) {
    throw new Error('Your account does not have an assigned program.')
  }
  const root = await pickDirectory(pickerId('dprms-default', user))
  await initializeProgramFolders(root, user)
  const current = await readPreference(user)
  await writePreference({
    ...current,
    customDirectory: current?.customDirectory,
    defaultRoot: root,
    key: userKey(user),
    mode: 'default',
    updatedAt: new Date().toISOString(),
  })
  return getDownloadDirectoryState(user)
}

export async function chooseCustomDownloadDirectory(user: MockUser): Promise<DownloadDirectoryState> {
  if (getAuthorizedDownloadPrograms(user).length === 0) {
    throw new Error('Your account does not have an assigned program.')
  }
  const customDirectory = await pickDirectory(pickerId('dprms-custom', user))
  await initializeProgramFolders(customDirectory, user)
  const current = await readPreference(user)
  await writePreference({
    ...current,
    customDirectory,
    customSubpath: '',
    defaultRoot: current?.defaultRoot ?? customDirectory,
    key: userKey(user),
    mode: 'custom',
    updatedAt: new Date().toISOString(),
  })
  return getDownloadDirectoryState(user)
}

export async function resetDownloadDirectory(user: MockUser): Promise<DownloadDirectoryState> {
  const current = await readPreference(user)
  try {
    if (current?.defaultRoot && (await permissionFor(current.defaultRoot, false)) === 'granted') {
      await initializeProgramFolders(current.defaultRoot, user)
    }
  } catch { /* Retain the saved default; downloads can fall back. */ }
  await writePreference({
    ...current,
    key: userKey(user),
    mode: 'default',
    customSubpath: '',
    updatedAt: new Date().toISOString(),
  })
  return getDownloadDirectoryState(user)
}

function pathSegments(path = ''): string[] {
  const normalized = path.trim().replace(/\\/g, '/')
  if (!normalized) return []
  const segments = normalized.split('/')
  if (segments.some((part) => !part || part === '.' || part === '..' || /[<>:"|?*]/.test(part) || Array.from(part).some((character) => character.charCodeAt(0) < 32) || /[. ]$/.test(part))) {
    throw new Error('Enter a relative subfolder such as Reports/2026. To use a different drive or absolute path, choose Browse / Change folder.')
  }
  return segments
}

async function subdirectory(root: FileSystemDirectoryHandle, path?: string): Promise<FileSystemDirectoryHandle> {
  let directory = root
  for (const segment of pathSegments(path)) directory = await directory.getDirectoryHandle(segment, { create: true })
  return directory
}

export async function saveDownloadSubpath(user: MockUser, path: string): Promise<DownloadDirectoryState> {
  const customSubpath = pathSegments(path).join('/')
  const current = await readPreference(user)
  const root = current?.mode === 'custom' ? current.customDirectory : current?.defaultRoot
  if (!root) throw new Error('Choose a parent folder before saving a subfolder path.')
  if ((await permissionFor(root, true)) !== 'granted') throw new Error('Allow access to the parent folder before saving this path.')
  await initializeProgramFolders(await subdirectory(root, customSubpath), user)
  await writePreference({ ...current, key: userKey(user), mode: 'custom', customDirectory: root, customSubpath, updatedAt: new Date().toISOString() })
  return getDownloadDirectoryState(user)
}

/**
 * Call at the beginning of a user click, before a network request, so a
 * first-time folder picker still has the browser's required user activation.
 */
export async function prepareDownloadDirectory(user: MockUser): Promise<PreparedDownloadDirectory> {
  if (!directoryPicker() || !window.indexedDB) return {}
  try {
    const preference = await readPreference(user)
    if (!preference || (preference.mode === 'default' && !preference.defaultRoot)) {
      await chooseDefaultDownloadRoot(user)
      return {}
    }
    const handle = preference.mode === 'custom' ? preference.customDirectory : preference.defaultRoot
    // Ask while the click is active. downloadBlob handles recovery and reports
    // the actual destination only after the file has been written.
    if (handle) {
      try {
        if ((await permissionFor(handle, true)) === 'granted') {
          const root = preference.mode === 'custom' ? await subdirectory(handle, preference.customSubpath) : handle
          await initializeProgramFolders(root, user)
          return {}
        }
      } catch { /* Try the default root below. */ }
    }
    if (preference.defaultRoot && preference.defaultRoot !== handle) {
      await permissionFor(preference.defaultRoot, true)
    }
    return {}
  } catch (error) {
    return { browserFallbackReason: error instanceof DOMException && error.name === 'AbortError'
      ? 'Folder selection was canceled.'
      : 'The download folder could not be prepared.' }
  }
}

function cleanFileName(fileName: string): string {
  const printableName = Array.from(fileName)
    .map((character) => character.charCodeAt(0) < 32 ? '_' : character)
    .join('')
  return printableName.replace(/[<>:"/\\|?*]/g, '_').trim() || 'download'
}

async function createCollisionSafeFile(
  directory: FileSystemDirectoryHandle,
  requestedName: string,
): Promise<FileSystemFileHandle> {
  const safeName = cleanFileName(requestedName)
  const dotIndex = safeName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName
  const extension = dotIndex > 0 ? safeName.slice(dotIndex) : ''

  for (let index = 0; index < 1_000; index += 1) {
    const candidate = index === 0 ? safeName : `${baseName} (${index})${extension}`
    try {
      await directory.getFileHandle(candidate)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return directory.getFileHandle(candidate, { create: true })
      }
      throw error
    }
  }
  throw new Error('Unable to create a unique file name.')
}

async function writeBlob(
  directory: FileSystemDirectoryHandle,
  blob: Blob,
  fileName: string,
): Promise<string> {
  const fileHandle = await createCollisionSafeFile(directory, fileName)
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
  return fileHandle.name
}

function browserDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = cleanFileName(fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}

function resolveProgram(user: MockUser, requested?: ApplicationProgram, fileName = ''): ApplicationProgram {
  const programs = getAuthorizedDownloadPrograms(user)
  if (programs.length === 0) throw new Error('Your account does not have an assigned program.')
  if (requested) {
    if (!programs.includes(requested)) throw new Error(`Your account is not authorized for ${requested} downloads.`)
    return requested
  }
  if (programs.length === 1) return programs[0]
  const matches = programs.filter((candidate) => new RegExp(`(^|[^a-z])${candidate}([^a-z]|$)`, 'i').test(fileName))
  if (matches.length === 1) return matches[0]
  // Legacy callers may omit context. Prefer the account's program, then GIA.
  return user.program && programs.includes(user.program) ? user.program : programs[0]
}

async function defaultDirectory(
  preference: StoredPreference,
  user: MockUser,
  program: ApplicationProgram,
  requestPermission: boolean,
): Promise<FileSystemDirectoryHandle | null> {
  if (!preference.defaultRoot) return null
  if ((await permissionFor(preference.defaultRoot, requestPermission)) !== 'granted') return null
  await initializeProgramFolders(preference.defaultRoot, user)
  return preference.defaultRoot.getDirectoryHandle(program, { create: true })
}

export async function downloadBlob({
  blob,
  directory,
  fileName,
  program,
  user,
}: {
  blob: Blob
  directory?: PreparedDownloadDirectory
  fileName: string
  program?: ApplicationProgram
  user: MockUser
}): Promise<DownloadResult> {
  const targetProgram = resolveProgram(user, program, fileName)
  const fallback = (reason: string, alert = false): DownloadResult => {
    const taggedName = new RegExp(`^${targetProgram}([_. -]|$)`, 'i').test(fileName) ? fileName : `${targetProgram}_${fileName}`
    browserDownload(blob, taggedName)
    if (alert) window.alert('The configured download folder is unavailable. DPRMS sent this file to your browser downloads instead.')
    return { destination: 'Browser Downloads', fallbackReason: reason, usedBrowserFallback: true }
  }
  const preparedFallback = directory?.browserFallbackReason
  if (preparedFallback) return fallback(preparedFallback, preparedFallback !== 'Folder selection was canceled.')
  if (!directoryPicker() || !window.indexedDB) {
    return fallback('This browser does not support direct folder access.')
  }

  let preference: StoredPreference | null
  try {
    preference = await readPreference(user)
    if (!preference || (preference.mode === 'default' && !preference.defaultRoot)) {
      await chooseDefaultDownloadRoot(user)
      preference = await readPreference(user)
    }
  } catch (error) {
    const canceled = error instanceof DOMException && error.name === 'AbortError'
    return fallback(canceled ? 'Folder selection was canceled.' : 'The download directory could not be configured.', !canceled)
  }
  if (!preference) return fallback('The download directory could not be configured.', true)

  let customFailure: string | undefined
  if (preference.mode === 'custom') {
    try {
      if (!preference.customDirectory) throw new Error('The saved custom folder is missing.')
      if ((await permissionFor(preference.customDirectory, true)) !== 'granted') {
        throw new Error('The custom folder is no longer accessible.')
      }
      const root = await subdirectory(preference.customDirectory, preference.customSubpath)
      await initializeProgramFolders(root, user)
      const programDirectory = await root.getDirectoryHandle(targetProgram, {
        create: true,
      })
      const savedName = await writeBlob(programDirectory, blob, fileName)
      return {
        destination: `${[preference.customDirectory.name, preference.customSubpath, targetProgram, savedName].filter(Boolean).join(' / ')}`,
        usedBrowserFallback: false,
      }
    } catch (error) {
      customFailure = error instanceof Error ? error.message : 'Custom folder unavailable.'
    }
  }

  try {
    const destination = await defaultDirectory(preference, user, targetProgram, true)
    if (destination) {
      const savedName = await writeBlob(destination, blob, fileName)
      if (customFailure) {
        // Failure to update preferences must never duplicate an already saved file.
        try { await writePreference({ ...preference, mode: 'default', updatedAt: new Date().toISOString() }) } catch { /* Retry persistence on the next settings change. */ }
        window.alert(`The custom download folder is unavailable. DPRMS saved this file to your default ${targetProgram} folder instead.`)
      }
      return {
        destination: `${preference.defaultRoot?.name} / ${targetProgram} / ${savedName}`,
        fallbackReason: customFailure,
        usedBrowserFallback: false,
      }
    }
  } catch { /* Revoked handles and write failures also need a browser fallback. */ }
  return fallback(customFailure ?? 'The configured directory is unavailable.', true)
}

export async function downloadFromUrl({
  fileName,
  program,
  url,
  user,
}: {
  fileName: string
  program?: ApplicationProgram
  url: string
  user: MockUser
}): Promise<DownloadResult> {
  const directory = await prepareDownloadDirectory(user)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}).`)
  return downloadBlob({ blob: await response.blob(), directory, fileName, program, user })
}
