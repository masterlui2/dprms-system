import { ROLES } from '../config/permissions'
import type { MockUser } from '../lib/mockAuth'
import type { ApplicationProgram } from '../types/application'

const DATABASE_NAME = 'dprms-download-directories'
const DATABASE_VERSION = 1
const STORE_NAME = 'preferences'
const preferenceCache = new Map<string, StoredPreference | null>()

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
}

export type DownloadResult = {
  destination: string
  fallbackReason?: string
  usedBrowserFallback: boolean
}

function userKey(user: MockUser): string {
  return `user:${user.id ?? user.email.trim().toLowerCase()}`
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
  return picker({ id, mode: 'readwrite', startIn: 'downloads' })
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
    }
  }

  const permission = await permissionFor(activeHandle, false)
  return {
    activePath: pathForDefault(activeHandle.name, programs),
    authorizedPrograms: programs,
    browserSupported: true,
    configured: true,
    mode,
    permission,
  }
}

/** Recreates authorized folders on app cold start when permission is already granted. */
export async function initializeDownloadDirectories(user: MockUser): Promise<void> {
  if (!directoryPicker() || !window.indexedDB) return
  const preference = await readPreference(user)
  if (!preference?.defaultRoot) return
  const activeRoot = preference.mode === 'custom'
    ? preference.customDirectory
    : preference.defaultRoot
  if (activeRoot && (await permissionFor(activeRoot, false)) === 'granted') {
    await initializeProgramFolders(activeRoot, user)
    return
  }
  if ((await permissionFor(preference.defaultRoot, false)) === 'granted') {
    await initializeProgramFolders(preference.defaultRoot, user)
  }
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
    key: userKey(user),
    mode: 'custom',
    updatedAt: new Date().toISOString(),
  })
  return getDownloadDirectoryState(user)
}

export async function resetDownloadDirectory(user: MockUser): Promise<DownloadDirectoryState> {
  const current = await readPreference(user)
  if (!current?.defaultRoot) return chooseDefaultDownloadRoot(user)

  const permission = await permissionFor(current.defaultRoot, true)
  if (permission !== 'granted') return chooseDefaultDownloadRoot(user)
  await initializeProgramFolders(current.defaultRoot, user)
  await writePreference({
    ...current,
    key: userKey(user),
    mode: 'default',
    updatedAt: new Date().toISOString(),
  })
  return getDownloadDirectoryState(user)
}

/**
 * Call at the beginning of a user click, before a network request, so a
 * first-time folder picker still has the browser's required user activation.
 */
export async function prepareDownloadDirectory(user: MockUser): Promise<void> {
  if (!directoryPicker() || !window.indexedDB) return
  const preference = await readPreference(user)
  if (!preference?.defaultRoot) {
    await chooseDefaultDownloadRoot(user)
    return
  }

  const activeHandle = preference.mode === 'custom'
    ? preference.customDirectory
    : preference.defaultRoot
  try {
    if (activeHandle && (await permissionFor(activeHandle, true)) === 'granted') {
      await initializeProgramFolders(activeHandle, user)
      return
    }
  } catch {
    // The handle may point to a disconnected or removed folder. Continue to
    // the role-based default recovery below.
  }

  try {
    if ((await permissionFor(preference.defaultRoot, true)) === 'granted') {
      await initializeProgramFolders(preference.defaultRoot, user)
      if (preference.mode === 'custom') {
        window.alert('The custom download folder is unavailable. DPRMS restored your role-based default folders.')
        await writePreference({ ...preference, mode: 'default', updatedAt: new Date().toISOString() })
      }
      return
    }
  } catch {
    // The default handle is also stale; downloadBlob will use its browser fallback.
  }

  if (preference.mode === 'custom') {
    window.alert(
      `The custom download folder is unavailable. DPRMS will use your role-based default or the browser Downloads location.`,
    )
    await writePreference({ ...preference, mode: 'default', updatedAt: new Date().toISOString() })
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

function resolveProgram(user: MockUser, requested?: ApplicationProgram): ApplicationProgram {
  const programs = getAuthorizedDownloadPrograms(user)
  if (requested && programs.includes(requested)) return requested
  if (programs.length === 1) return programs[0]
  if (programs.length === 0) throw new Error('Your account does not have an assigned program.')
  if (requested) throw new Error(`Your account is not authorized for ${requested} downloads.`)
  throw new Error('A program is required for this download.')
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
  fileName,
  program,
  user,
}: {
  blob: Blob
  fileName: string
  program?: ApplicationProgram
  user: MockUser
}): Promise<DownloadResult> {
  const targetProgram = resolveProgram(user, program)
  if (!directoryPicker() || !window.indexedDB) {
    browserDownload(blob, `${targetProgram}_${fileName}`)
    return {
      destination: 'Browser Downloads',
      fallbackReason: 'This browser does not support direct folder access.',
      usedBrowserFallback: true,
    }
  }

  let preference = await readPreference(user)
  if (!preference?.defaultRoot) {
    await chooseDefaultDownloadRoot(user)
    preference = await readPreference(user)
  }
  if (!preference) throw new Error('The download directory could not be configured.')

  if (preference.mode === 'custom' && preference.customDirectory) {
    try {
      if ((await permissionFor(preference.customDirectory, true)) !== 'granted') {
        throw new Error('The custom folder is no longer accessible.')
      }
      await initializeProgramFolders(preference.customDirectory, user)
      const programDirectory = await preference.customDirectory.getDirectoryHandle(targetProgram, {
        create: true,
      })
      const savedName = await writeBlob(programDirectory, blob, fileName)
      return {
        destination: `${preference.customDirectory.name} / ${targetProgram} / ${savedName}`,
        usedBrowserFallback: false,
      }
    } catch (error) {
      const fallbackDirectory = await defaultDirectory(preference, user, targetProgram, true)
      if (fallbackDirectory) {
        const savedName = await writeBlob(fallbackDirectory, blob, fileName)
        await writePreference({ ...preference, mode: 'default', updatedAt: new Date().toISOString() })
        window.alert(
          `The custom download folder is unavailable. This file was saved to the default ${targetProgram} folder instead.`,
        )
        return {
          destination: `${preference.defaultRoot?.name} / ${targetProgram} / ${savedName}`,
          fallbackReason: error instanceof Error ? error.message : 'Custom folder unavailable.',
          usedBrowserFallback: false,
        }
      }
    }
  }

  const destination = await defaultDirectory(preference, user, targetProgram, true)
  if (destination) {
    const savedName = await writeBlob(destination, blob, fileName)
    return {
      destination: `${preference.defaultRoot?.name} / ${targetProgram} / ${savedName}`,
      usedBrowserFallback: false,
    }
  }

  browserDownload(blob, `${targetProgram}_${fileName}`)
  window.alert(
    `The configured folder is unavailable. The file was sent to the browser's Downloads location instead.`,
  )
  return {
    destination: 'Browser Downloads',
    fallbackReason: 'The configured directory is unavailable.',
    usedBrowserFallback: true,
  }
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
  await prepareDownloadDirectory(user)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}).`)
  return downloadBlob({ blob: await response.blob(), fileName, program, user })
}
