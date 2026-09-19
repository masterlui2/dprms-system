/**
 * System: DPRMS
 * Purpose: Manage download manager operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ROLES } from '../config/permissions';
import type { MockUser } from '../lib/mock_auth';
import type { ApplicationProgram } from '../types/application';
import { reportError } from '../utils/error_reporting';

const DATABASE_NAME = 'dprms-download-directories';
const DATABASE_VERSION = 1;
const STORE_NAME = 'preferences';
const g_objPreferenceCache = new Map<string, StoredPreference | null>();
const METADATA_PREFIX = 'dprms.download-directory.';

type PermissionMode = 'read' | 'readwrite';
type PermissionStateValue = 'denied' | 'granted' | 'prompt';

interface DirectoryHandleWithPermission extends FileSystemDirectoryHandle
{
    queryPermission?: (objDescriptor?: { mode?: PermissionMode; }) => Promise<PermissionStateValue>;
    requestPermission?: (objDescriptor?: {
        mode?: PermissionMode;
    }) => Promise<PermissionStateValue>;
}

interface DirectoryPickerWindow extends Window
{
    showDirectoryPicker?: (objOptions?: {
        id?: string;
        mode?: PermissionMode;
        startIn?: FileSystemHandle | string;
    }) => Promise<FileSystemDirectoryHandle>;
}

type StoredPreference = {
    customDirectory?: FileSystemDirectoryHandle;
    customSubpath?: string;
    defaultRoot?: FileSystemDirectoryHandle;
    key: string;
    mode: 'custom' | 'default';
    updatedAt: string;
};

export type DownloadDirectoryState = {
    activePath: string;
    authorizedPrograms: ApplicationProgram[];
    browserSupported: boolean;
    configured: boolean;
    mode: 'custom' | 'default';
    permission: PermissionStateValue | 'unknown';
    customSubpath: string;
};

export type DownloadResult = {
    destination: string;
    fallbackReason?: string;
    usedBrowserFallback: boolean;
};

export type PreparedDownloadDirectory = { browserFallbackReason?: string; };

/** User key. */
function _userKey(objUser: MockUser): string
{
    return `user:${objUser.id ?? objUser.email.trim().toLowerCase()}`;
}

/** Mirror preference. */
function _mirrorPreference(objPreference: StoredPreference): void
{
    const objRoot =
        objPreference.mode === 'custom' ? objPreference.customDirectory : objPreference.defaultRoot;
    try
    {
        window.localStorage.setItem(
            `${METADATA_PREFIX}${objPreference.key}`,
            JSON.stringify({
                mode: objPreference.mode,
                rootName: objRoot?.name,
                customSubpath:
                    objPreference.mode === 'custom' ? (objPreference.customSubpath ?? '') : '',
            }),
        );
    } catch (errCaught)
    {
        reportError(errCaught, 'download_manager: mirror preference failed.');

        // Directory handles remain persisted in IndexedDB when localStorage is disabled.
    }
}

/** Display metadata only; actual access is always checked against the saved handle. */
export function getCachedDownloadDirectoryState(objUser: MockUser): DownloadDirectoryState
{
    const arrPrograms = getAuthorizedDownloadPrograms(objUser);
    const objState: DownloadDirectoryState = {
        activePath: 'Browser Downloads · choose a folder to enable program routing',
        authorizedPrograms: arrPrograms,
        browserSupported: Boolean(_directoryPicker() && window.indexedDB),
        configured: false,
        mode: 'default',
        permission: 'unknown',
        customSubpath: '',
    };
    try
    {
        const objMetadata = JSON.parse(
            window.localStorage.getItem(`${METADATA_PREFIX}${_userKey(objUser)}`) ?? 'null',
        );
        if (objMetadata && typeof objMetadata.rootName === 'string')
        {
            objState.mode = objMetadata.mode === 'custom' ? 'custom' : 'default';
            objState.customSubpath =
                typeof objMetadata.customSubpath === 'string' ? objMetadata.customSubpath : '';
            objState.activePath = _pathForDefault(
                [objMetadata.rootName, objState.customSubpath].filter(Boolean).join(' / '),
                arrPrograms,
            );
            objState.configured = true;
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'download_manager: get cached download directory state failed.');
        /* The authoritative state will be loaded from IndexedDB. */
    }
    return objState;
} /* end getCachedDownloadDirectoryState */

/** Picker id. */
function _pickerId(strPrefix: string, objUser: MockUser): string
{
    const strIdentity = String(objUser.id ?? objUser.email.trim().toLowerCase());
    let intHash = 0;
    for (const strCharacter of strIdentity)
    {
        intHash = ((intHash << 5) - intHash + strCharacter.charCodeAt(0)) | 0;
    }
    return `${strPrefix}-${Math.abs(intHash).toString(36)}`;
}

/** Open database. */
function _openDatabase(): Promise<IDBDatabase>
{
    return new Promise((resolve, reject) =>
    {
        const objRequest = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        objRequest.onerror = () => reject(objRequest.error);
        objRequest.onupgradeneeded = () =>
        {
            const objDatabase = objRequest.result;
            if (!objDatabase.objectStoreNames.contains(STORE_NAME))
            {
                objDatabase.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
        objRequest.onsuccess = () => resolve(objRequest.result);
    });
}

/** Read preference. */
async function _readPreference(objUser: MockUser): Promise<StoredPreference | null>
{
    try
    {
        const strKey = _userKey(objUser);
        if (g_objPreferenceCache.has(strKey))
        {
            return g_objPreferenceCache.get(strKey) ?? null;
        }
        const objDatabase = await _openDatabase();
        return new Promise((resolve, reject) =>
        {
            const objTransaction = objDatabase.transaction(STORE_NAME, 'readonly');
            const objRequest = objTransaction.objectStore(STORE_NAME).get(strKey);
            objRequest.onerror = () => reject(objRequest.error);
            objRequest.onsuccess = () =>
            {
                const objPreference = (objRequest.result as StoredPreference | undefined) ?? null;
                g_objPreferenceCache.set(strKey, objPreference);
                if (objPreference)
                {
                    _mirrorPreference(objPreference);
                }
                resolve(objPreference);
            };
            objTransaction.oncomplete = () => objDatabase.close();
        });
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'download_manager: read preference failed.');
        throw errOperation;
    }
} /* end _readPreference */

/** Write preference. */
async function _writePreference(objPreference: StoredPreference): Promise<void>
{
    try
    {
        const objDatabase = await _openDatabase();
        return new Promise((resolve, reject) =>
        {
            const objTransaction = objDatabase.transaction(STORE_NAME, 'readwrite');
            objTransaction.objectStore(STORE_NAME).put(objPreference);
            objTransaction.onerror = () => reject(objTransaction.error);
            objTransaction.oncomplete = () =>
            {
                objDatabase.close();
                g_objPreferenceCache.set(objPreference.key, objPreference);
                _mirrorPreference(objPreference);
                resolve();
            };
        });
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: write preference failed.');
        throw errOperation;
    }
} /* end _writePreference */

/** Permission for. */
async function _permissionFor(
    objHandle: FileSystemDirectoryHandle,
    blnRequestIfNeeded: boolean,
): Promise<PermissionStateValue>
{
    try
    {
        const objPermissionHandle = objHandle as DirectoryHandleWithPermission;
        if (!objPermissionHandle.queryPermission)
        {
            return 'granted';
        }

        const strCurrent = await objPermissionHandle.queryPermission({ mode: 'readwrite' });
        if (
            strCurrent === 'granted' ||
            !blnRequestIfNeeded ||
            !objPermissionHandle.requestPermission
        )
        {
            return strCurrent;
        }
        return objPermissionHandle.requestPermission({ mode: 'readwrite' });
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: permission for failed.');
        throw errOperation;
    }
}

/** Directory picker. */
function _directoryPicker(): DirectoryPickerWindow['showDirectoryPicker']
{
    return (window as DirectoryPickerWindow).showDirectoryPicker;
}

/** Pick directory. */
async function _pickDirectory(strId: string): Promise<FileSystemDirectoryHandle>
{
    const _picker = _directoryPicker();
    if (!_picker)
    {
        throw new Error('DIRECTORY_PICKER_UNAVAILABLE');
    }
    return _picker.call(window, { id: strId, mode: 'readwrite', startIn: 'downloads' });
}

/** Get authorized download programs. */
export function getAuthorizedDownloadPrograms(objUser: MockUser): ApplicationProgram[]
{
    if (
        objUser.role === ROLES.SYSTEM_ADMIN ||
        objUser.role === ROLES.PROVINCIAL_DIRECTOR ||
        objUser.role === ROLES.RPMO
    )
    {
        return ['GIA', 'SETUP'];
    }

    if (objUser.program === 'SETUP' || objUser.program === 'GIA')
    {
        return [objUser.program];
    }

    return [];
}

/** Initialize program folders. */
async function _initializeProgramFolders(
    objRoot: FileSystemDirectoryHandle,
    objUser: MockUser,
): Promise<void>
{
    try
    {
        for (const strProgram of getAuthorizedDownloadPrograms(objUser))
        {
            await objRoot.getDirectoryHandle(strProgram, { create: true });
        }
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: initialize program folders failed.');
        throw errOperation;
    }
}

/** Path for default. */
function _pathForDefault(strRootName: string, arrPrograms: ApplicationProgram[]): string
{
    if (arrPrograms.length === 0)
    {
        return 'No program is assigned to this account';
    }
    if (arrPrograms.length === 1)
    {
        return `${strRootName} / ${arrPrograms[0]}`;
    }
    return `${strRootName} / {GIA, SETUP}`;
}

/** Get download directory state. */
export async function getDownloadDirectoryState(
    objUser: MockUser,
): Promise<DownloadDirectoryState>
{
    try
    {
        const arrPrograms = getAuthorizedDownloadPrograms(objUser);
        const blnSupported = Boolean(_directoryPicker() && window.indexedDB);
        if (!blnSupported)
        {
            return {
                activePath: 'Browser Downloads (folder routing is not supported)',
                authorizedPrograms: arrPrograms,
                browserSupported: false,
                configured: false,
                mode: 'default',
                permission: 'unknown',
                customSubpath: '',
            };
        }

        const objPreference = await _readPreference(objUser);
        const strMode = objPreference?.mode ?? 'default';
        const objActiveHandle =
            strMode === 'custom' ? objPreference?.customDirectory : objPreference?.defaultRoot;
        if (!objActiveHandle)
        {
            return {
                activePath:
                    arrPrograms.length === 0
                        ? 'No program is assigned to this account'
                        : arrPrograms.length === 1
                            ? `Choose a DPRMS root folder / ${arrPrograms[0]}`
                            : 'Choose a DPRMS root folder / {GIA, SETUP}',
                authorizedPrograms: arrPrograms,
                browserSupported: true,
                configured: false,
                mode: strMode,
                permission: 'unknown',
                customSubpath: objPreference?.customSubpath ?? '',
            };
        }

        let strPermission: PermissionStateValue = 'denied';
        try
        {
            strPermission = await _permissionFor(objActiveHandle, false);
        } catch (errCaught)
        {
            reportError(errCaught, 'download_manager: get download directory state failed.');
            /* A stale handle remains visible so it can be changed. */
        }
        return {
            activePath: _pathForDefault(
                [objActiveHandle.name, strMode === 'custom' ? objPreference?.customSubpath : '']
                    .filter(Boolean)
                    .join(' / '),
                arrPrograms,
            ),
            authorizedPrograms: arrPrograms,
            browserSupported: true,
            configured: true,
            mode: strMode,
            permission: strPermission,
            customSubpath: strMode === 'custom' ? (objPreference?.customSubpath ?? '') : '',
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'download_manager: get download directory state failed.');
        throw errOperation;
    }
} /* end getDownloadDirectoryState */

/** Recreates authorized folders on app cold start when permission is already granted. */
export async function initializeDownloadDirectories(objUser: MockUser): Promise<void>
{
    try
    {
        if (!_directoryPicker() || !window.indexedDB)
        {
            return;
        }
        const objPreference = await _readPreference(objUser);
        if (!objPreference)
        {
            return;
        }
        const objActiveRoot =
            objPreference.mode === 'custom'
                ? objPreference.customDirectory
                : objPreference.defaultRoot;
        try
        {
            if (objActiveRoot && (await _permissionFor(objActiveRoot, false)) === 'granted')
            {
                const objRoot =
                    objPreference.mode === 'custom'
                        ? await _subdirectory(objActiveRoot, objPreference.customSubpath)
                        : objActiveRoot;
                await _initializeProgramFolders(objRoot, objUser);
                return;
            }
        } catch (errCaught)
        {
            reportError(errCaught, 'download_manager: initialize download directories failed.');
            /* A removed custom folder must not prevent default initialization. */
        }
        try
        {
            if (
                objPreference.defaultRoot &&
                (await _permissionFor(objPreference.defaultRoot, false)) === 'granted'
            )
            {
                await _initializeProgramFolders(objPreference.defaultRoot, objUser);
            }
        } catch (errCaught)
        {
            reportError(errCaught, 'download_manager: initialize download directories failed.');
            /* Cold start stays silent; downloads report the fallback destination. */
        }
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'download_manager: initialize download directories failed.');
        throw errOperation;
    }
} /* end initializeDownloadDirectories */

/** Choose default download root. */
export async function chooseDefaultDownloadRoot(
    objUser: MockUser,
): Promise<DownloadDirectoryState>
{
    try
    {
        if (getAuthorizedDownloadPrograms(objUser).length === 0)
        {
            throw new Error('Your account does not have an assigned program.');
        }
        const objRoot = await _pickDirectory(_pickerId('dprms-default', objUser));
        await _initializeProgramFolders(objRoot, objUser);
        const objCurrent = await _readPreference(objUser);
        await _writePreference({
            ...objCurrent,
            customDirectory: objCurrent?.customDirectory,
            defaultRoot: objRoot,
            key: _userKey(objUser),
            mode: 'default',
            updatedAt: new Date().toISOString(),
        });
        return getDownloadDirectoryState(objUser);
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: choose default download root failed.');
        throw errOperation;
    }
} /* end chooseDefaultDownloadRoot */

/** Choose custom download directory. */
export async function chooseCustomDownloadDirectory(
    objUser: MockUser,
): Promise<DownloadDirectoryState>
{
    try
    {
        if (getAuthorizedDownloadPrograms(objUser).length === 0)
        {
            throw new Error('Your account does not have an assigned program.');
        }
        const objCustomDirectory = await _pickDirectory(_pickerId('dprms-custom', objUser));
        await _initializeProgramFolders(objCustomDirectory, objUser);
        const objCurrent = await _readPreference(objUser);
        await _writePreference({
            ...objCurrent,
            customDirectory: objCustomDirectory,
            customSubpath: '',
            defaultRoot: objCurrent?.defaultRoot ?? objCustomDirectory,
            key: _userKey(objUser),
            mode: 'custom',
            updatedAt: new Date().toISOString(),
        });
        return getDownloadDirectoryState(objUser);
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: choose custom download directory failed.');
        throw errOperation;
    }
} /* end chooseCustomDownloadDirectory */

/** Reset download directory. */
export async function resetDownloadDirectory(objUser: MockUser): Promise<DownloadDirectoryState>
{
    try
    {
        const objCurrent = await _readPreference(objUser);
        try
        {
            if (
                objCurrent?.defaultRoot &&
                (await _permissionFor(objCurrent.defaultRoot, false)) === 'granted'
            )
            {
                await _initializeProgramFolders(objCurrent.defaultRoot, objUser);
            }
        } catch (errCaught)
        {
            reportError(errCaught, 'download_manager: reset download directory failed.');
            /* Retain the saved default; downloads can fall back. */
        }
        await _writePreference({
            ...objCurrent,
            key: _userKey(objUser),
            mode: 'default',
            customSubpath: '',
            updatedAt: new Date().toISOString(),
        });
        return getDownloadDirectoryState(objUser);
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: reset download directory failed.');
        throw errOperation;
    }
} /* end resetDownloadDirectory */

/** Path segments. */
function _pathSegments(strPath = ''): string[]
{
    const strNormalized = strPath.trim().replace(/\\/g, '/');
    if (!strNormalized)
    {
        return [];
    }
    const arrSegments = strNormalized.split('/');
    if (
        arrSegments.some(
            (strPart) =>
                !strPart ||
                strPart === '.' ||
                strPart === '..' ||
                /[<>:"|?*]/.test(strPart) ||
                Array.from(strPart).some((strCharacter) => strCharacter.charCodeAt(0) < 32) ||
                /[. ]$/.test(strPart),
        )
    )
    {
        throw new Error(
            'Enter a relative subfolder such as Reports/2026. To use a different drive or absolute path, choose Browse / Change folder.',
        );
    }
    return arrSegments;
}

/** Subdirectory. */
async function _subdirectory(
    objRoot: FileSystemDirectoryHandle,
    strPath?: string,
): Promise<FileSystemDirectoryHandle>
{
    try
    {
        let objDirectory = objRoot;
        for (const strSegment of _pathSegments(strPath))
        {
            objDirectory = await objDirectory.getDirectoryHandle(strSegment, { create: true });
        }
        return objDirectory;
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: subdirectory failed.');
        throw errOperation;
    }
}

/** Save download subpath. */
export async function saveDownloadSubpath(
    objUser: MockUser,
    strPath: string,
): Promise<DownloadDirectoryState>
{
    try
    {
        const strCustomSubpath = _pathSegments(strPath).join('/');
        const objCurrent = await _readPreference(objUser);
        const objRoot =
            objCurrent?.mode === 'custom' ? objCurrent.customDirectory : objCurrent?.defaultRoot;
        if (!objRoot)
        {
            throw new Error('Choose a parent folder before saving a subfolder path.');
        }
        if ((await _permissionFor(objRoot, true)) !== 'granted')
        {
            throw new Error('Allow access to the parent folder before saving this path.');
        }
        await _initializeProgramFolders(await _subdirectory(objRoot, strCustomSubpath), objUser);
        await _writePreference({
            ...objCurrent,
            key: _userKey(objUser),
            mode: 'custom',
            customDirectory: objRoot,
            customSubpath: strCustomSubpath,
            updatedAt: new Date().toISOString(),
        });
        return getDownloadDirectoryState(objUser);
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: save download subpath failed.');
        throw errOperation;
    }
} /* end saveDownloadSubpath */

/**
 * Call at the beginning of a user click, before a network request, so a
 * first-time folder picker still has the browser's required user activation.
 */
export async function prepareDownloadDirectory(
    objUser: MockUser,
): Promise<PreparedDownloadDirectory>
{
    if (!_directoryPicker() || !window.indexedDB)
    {
        return {};
    }
    try
    {
        const objPreference = await _readPreference(objUser);
        if (!objPreference || (objPreference.mode === 'default' && !objPreference.defaultRoot))
        {
            await chooseDefaultDownloadRoot(objUser);
            return {};
        }
        const objHandle =
            objPreference.mode === 'custom'
                ? objPreference.customDirectory
                : objPreference.defaultRoot;
        // Ask while the click is active. downloadBlob handles recovery and reports
        // the actual destination only after the file has been written.
        if (objHandle)
        {
            try
            {
                if ((await _permissionFor(objHandle, true)) === 'granted')
                {
                    const objRoot =
                        objPreference.mode === 'custom'
                            ? await _subdirectory(objHandle, objPreference.customSubpath)
                            : objHandle;
                    await _initializeProgramFolders(objRoot, objUser);
                    return {};
                }
            } catch (errCaught)
            {
                reportError(errCaught, 'download_manager: prepare download directory failed.');
                /* Try the default root below. */
            }
        }
        if (objPreference.defaultRoot && objPreference.defaultRoot !== objHandle)
        {
            await _permissionFor(objPreference.defaultRoot, true);
        }
        return {};
    } /* end try */ catch (errError)
    {
        reportError(errError, 'download_manager: prepare download directory failed.');

        return {
            browserFallbackReason:
                errError instanceof DOMException && errError.name === 'AbortError'
                    ? 'Folder selection was canceled.'
                    : 'The download folder could not be prepared.',
        };
    }
} /* end prepareDownloadDirectory */

/** Clean file name. */
function _cleanFileName(strFileName: string): string
{
    const strPrintableName = Array.from(strFileName)
        .map((strCharacter) => (strCharacter.charCodeAt(0) < 32 ? '_' : strCharacter))
        .join('');
    return strPrintableName.replace(/[<>:"/\\|?*]/g, '_').trim() || 'download';
}

/** Create collision safe file. */
async function _createCollisionSafeFile(
    objDirectory: FileSystemDirectoryHandle,
    strRequestedName: string,
): Promise<FileSystemFileHandle>
{
    const strSafeName = _cleanFileName(strRequestedName);
    const intDotIndex = strSafeName.lastIndexOf('.');
    const strBaseName = intDotIndex > 0 ? strSafeName.slice(0, intDotIndex) : strSafeName;
    const strExtension = intDotIndex > 0 ? strSafeName.slice(intDotIndex) : '';

    let intIndex = 0;
    for (; intIndex < 1_000; intIndex += 1)
    {
        const strCandidate =
            intIndex === 0 ? strSafeName : `${strBaseName} (${intIndex})${strExtension}`;
        try
        {
            await objDirectory.getFileHandle(strCandidate);
        } catch (errError)
        {
            if (errError instanceof DOMException && errError.name === 'NotFoundError')
            {
                return objDirectory.getFileHandle(strCandidate, { create: true });
            }
            reportError(errError, 'Creating a download file failed.');
            throw errError;
        }
    }
    throw new Error('Unable to create a unique file name.');
} /* end _createCollisionSafeFile */

/** Write blob. */
async function _writeBlob(
    objDirectory: FileSystemDirectoryHandle,
    objBlob: Blob,
    strFileName: string,
): Promise<string>
{
    try
    {
        const objFileHandle = await _createCollisionSafeFile(objDirectory, strFileName);
        const objWritable = await objFileHandle.createWritable();
        await objWritable.write(objBlob);
        await objWritable.close();
        return objFileHandle.name;
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: write blob failed.');
        throw errOperation;
    }
}

/** Browser download. */
function _browserDownload(objBlob: Blob, strFileName: string): void
{
    const strObjectUrl = URL.createObjectURL(objBlob);
    const objLink = document.createElement('a');
    objLink.href = strObjectUrl;
    objLink.download = _cleanFileName(strFileName);
    document.body.appendChild(objLink);
    objLink.click();
    objLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(strObjectUrl), 1_000);
}

/** Resolve program. */
function _resolveProgram(
    objUser: MockUser,
    strRequested?: ApplicationProgram,
    strFileName = '',
): ApplicationProgram
{
    const arrPrograms = getAuthorizedDownloadPrograms(objUser);
    if (arrPrograms.length === 0)
    {
        throw new Error('Your account does not have an assigned program.');
    }
    if (strRequested)
    {
        if (!arrPrograms.includes(strRequested))
        {
            throw new Error(`Your account is not authorized for ${strRequested} downloads.`);
        }
        return strRequested;
    }
    if (arrPrograms.length === 1)
    {
        return arrPrograms[0];
    }
    const arrMatches = arrPrograms.filter((strCandidate) =>
        new RegExp(`(^|[^a-z])${strCandidate}([^a-z]|$)`, 'i').test(strFileName),
    );
    if (arrMatches.length === 1)
    {
        return arrMatches[0];
    }
    // Legacy callers may omit context. Prefer the account's program, then GIA.
    return objUser.program && arrPrograms.includes(objUser.program)
        ? objUser.program
        : arrPrograms[0];
} /* end _resolveProgram */

/** Default directory. */
async function _defaultDirectory(
    objPreference: StoredPreference,
    objUser: MockUser,
    strProgram: ApplicationProgram,
    blnRequestPermission: boolean,
): Promise<FileSystemDirectoryHandle | null>
{
    try
    {
        if (!objPreference.defaultRoot)
        {
            return null;
        }
        if ((await _permissionFor(objPreference.defaultRoot, blnRequestPermission)) !== 'granted')
        {
            return null;
        }
        await _initializeProgramFolders(objPreference.defaultRoot, objUser);
        return objPreference.defaultRoot.getDirectoryHandle(strProgram, { create: true });
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: default directory failed.');
        throw errOperation;
    }
}

/** Download blob. */
export async function downloadBlob({
    blob: objBlob,
    directory: objDirectory,
    fileName: strFileName,
    program: strProgram,
    user: objUser,
}: {
    blob: Blob;
    directory?: PreparedDownloadDirectory;
    fileName: string;
    program?: ApplicationProgram;
    user: MockUser;
}): Promise<DownloadResult>
{
    const strTargetProgram = _resolveProgram(objUser, strProgram, strFileName);
    /** Fallback. */
    const _fallback = (strReason: string, blnAlert = false): DownloadResult =>
    {
        const strTaggedName = new RegExp(`^${strTargetProgram}([_. -]|$)`, 'i').test(strFileName)
            ? strFileName
            : `${strTargetProgram}_${strFileName}`;
        _browserDownload(objBlob, strTaggedName);
        if (blnAlert)
        {
            window.alert(
                'The configured download folder is unavailable. DPRMS sent this file to your browser downloads instead.',
            );
        }
        return {
            destination: 'Browser Downloads',
            fallbackReason: strReason,
            usedBrowserFallback: true,
        };
    };
    const strPreparedFallback = objDirectory?.browserFallbackReason;
    if (strPreparedFallback)
    {
        return _fallback(
            strPreparedFallback,
            strPreparedFallback !== 'Folder selection was canceled.',
        );
    }
    if (!_directoryPicker() || !window.indexedDB)
    {
        return _fallback('This browser does not support direct folder access.');
    }

    let objPreference: StoredPreference | null;
    try
    {
        objPreference = await _readPreference(objUser);
        if (!objPreference || (objPreference.mode === 'default' && !objPreference.defaultRoot))
        {
            await chooseDefaultDownloadRoot(objUser);
            objPreference = await _readPreference(objUser);
        }
    } catch (errError)
    {
        reportError(errError, 'download_manager: download blob failed.');

        const blnCanceled = errError instanceof DOMException && errError.name === 'AbortError';
        return _fallback(
            blnCanceled
                ? 'Folder selection was canceled.'
                : 'The download directory could not be configured.',
            !blnCanceled,
        );
    }
    if (!objPreference)
    {
        return _fallback('The download directory could not be configured.', true);
    }

    let strCustomFailure: string | undefined;
    if (objPreference.mode === 'custom')
    {
        try
        {
            if (!objPreference.customDirectory)
            {
                throw new Error('The saved custom folder is missing.');
            }
            if ((await _permissionFor(objPreference.customDirectory, true)) !== 'granted')
            {
                throw new Error('The custom folder is no longer accessible.');
            }
            const objRoot = await _subdirectory(
                objPreference.customDirectory,
                objPreference.customSubpath,
            );
            await _initializeProgramFolders(objRoot, objUser);
            const objProgramDirectory = await objRoot.getDirectoryHandle(strTargetProgram, {
                create: true,
            });
            const strSavedName = await _writeBlob(objProgramDirectory, objBlob, strFileName);
            return {
                destination: `${[objPreference.customDirectory.name, objPreference.customSubpath, strTargetProgram, strSavedName].filter(Boolean).join(' / ')}`,
                usedBrowserFallback: false,
            };
        } catch (errError)
        {
            reportError(errError, 'download_manager: download blob failed.');

            strCustomFailure =
                errError instanceof Error ? errError.message : 'Custom folder unavailable.';
        }
    } /* end if */

    try
    {
        const objDestination = await _defaultDirectory(
            objPreference,
            objUser,
            strTargetProgram,
            true,
        );
        if (objDestination)
        {
            const strSavedName = await _writeBlob(objDestination, objBlob, strFileName);
            if (strCustomFailure)
            {
                // Failure to update preferences must never duplicate an already saved file.
                try
                {
                    await _writePreference({
                        ...objPreference,
                        mode: 'default',
                        updatedAt: new Date().toISOString(),
                    });
                } catch (errCaught)
                {
                    reportError(errCaught, 'download_manager: download blob failed.');
                    /* Retry persistence on the next settings change. */
                }
                window.alert(
                    `The custom download folder is unavailable. DPRMS saved this file to your default ${strTargetProgram} folder instead.`,
                );
            }
            return {
                destination: `${objPreference.defaultRoot?.name} / ${strTargetProgram} / ${strSavedName}`,
                fallbackReason: strCustomFailure,
                usedBrowserFallback: false,
            };
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'download_manager: download blob failed.');
        /* Revoked handles and write failures also need a browser fallback. */
    }
    return _fallback(strCustomFailure ?? 'The configured directory is unavailable.', true);
} /* end downloadBlob */

/** Download from url. */
export async function downloadFromUrl({
    fileName: strFileName,
    program: strProgram,
    url: strUrl,
    user: objUser,
}: {
    fileName: string;
    program?: ApplicationProgram;
    url: string;
    user: MockUser;
}): Promise<DownloadResult>
{
    try
    {
        const objDirectory = await prepareDownloadDirectory(objUser);
        const objResponse = await fetch(strUrl);
        if (!objResponse.ok)
        {
            throw new Error(`Download failed (${objResponse.status}).`);
        }
        return downloadBlob({
            blob: await objResponse.blob(),
            directory: objDirectory,
            fileName: strFileName,
            program: strProgram,
            user: objUser,
        });
    } catch (errOperation)
    {
        reportError(errOperation, 'download_manager: download from url failed.');
        throw errOperation;
    }
}
