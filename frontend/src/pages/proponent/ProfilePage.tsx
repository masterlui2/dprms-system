/**
 * System: DPRMS
 * Purpose: Render profile page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Building2,
    Camera,
    CheckCircle2,
    Mail,
    MapPin,
    Phone,
    Save,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { getMockUser, setMockUser } from '../../lib/mock_auth';
import
{
    getProponentProfile,
    saveProponentProfile,
    type ProponentProfile,
} from '../../services/profile_store';

const INPUT_CLASS_NAME =
    'mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';

const EMPTY_PROFILE: ProponentProfile = {
    businessAddress: '',
    contactNumber: '',
    email: '',
    fullName: '',
    organizationName: '',
    organizationType: '',
    photoDataUrl: '',
    position: '',
    program: '',
};

/** Get initials. */
function _getInitials(strName: string)
{
    const arrParts = strName.trim().split(/\s+/).filter(Boolean);
    return `${arrParts[0]?.[0] ?? 'P'}${arrParts[1]?.[0] ?? arrParts[0]?.[1] ?? 'R'}`.toUpperCase();
}

/** Render profile page and its available actions. */
export function ProfilePage()
{
    const objUser = getMockUser();
    const objPhotoInputRef = useRef<HTMLInputElement>(null);
    const [objProfile, setObjProfile] = useState<ProponentProfile>(EMPTY_PROFILE);
    const [blnLoadingProfile, setBlnLoadingProfile] = useState(true);
    const [txtMessage, setTxtMessage] = useState<string | null>(null);
    const [strError, setStrError] = useState<string | null>(null);

    useEffect(
        () =>
        {
            let blnCancelled = false;
            if (!objUser)
            {
                setBlnLoadingProfile(false);
                return;
            }
            setBlnLoadingProfile(true);
            getProponentProfile(objUser)
                .then((objResult) =>
                {
                    if (!blnCancelled)
                    {
                        setObjProfile(objResult);
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnLoadingProfile(false);
                    }
                });
            return () =>
            {
                blnCancelled = true;
            };
        } /* end ProfilePage */,
        [objUser],
    );

    if (!objUser)
    {
        return null;
    }
    const objActiveUser = objUser;

    if (blnLoadingProfile)
    {
        return (
            <div className="space-y-7">
                <AdminPageHeader
                    txtDescription="Keep your account and contact details up to date."
                    strEyebrow="My Account"
                    title="Profile"
                />
                <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                    Loading profile…
                </div>
            </div>
        );
    }

    /** Update field. */
    function _updateField(strField: keyof ProponentProfile, strValue: string)
    {
        setObjProfile((objCurrent) => ({ ...objCurrent, [strField]: strValue }));
        setTxtMessage(null);
        setStrError(null);
    }

    /** Handle photo. */
    function _handlePhoto(objEvent: ChangeEvent<HTMLInputElement>)
    {
        const objFile = objEvent.target.files?.[0];
        objEvent.target.value = '';
        if (!objFile)
        {
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(objFile.type))
        {
            setStrError('Please choose a JPG, PNG, or WebP image.');
            return;
        }
        if (objFile.size > 1024 * 1024)
        {
            setStrError('Please choose an image smaller than 1 MB.');
            return;
        }

        const objReader = new FileReader();
        objReader.onerror = () =>
            setStrError('The image could not be loaded. Please try another file.');
        objReader.onload = () =>
        {
            const objNextProfile = { ...objProfile, photoDataUrl: String(objReader.result) };
            setObjProfile(objNextProfile);
            saveProponentProfile(objActiveUser, objNextProfile);
            setStrError(null);
            setTxtMessage('Profile picture updated.');
        };
        objReader.readAsDataURL(objFile);
    } /* end _handlePhoto */

    /** Remove photo. */
    function _removePhoto()
    {
        const objNextProfile = { ...objProfile, photoDataUrl: '' };
        setObjProfile(objNextProfile);
        saveProponentProfile(objActiveUser, objNextProfile);
        setStrError(null);
        setTxtMessage('Profile picture removed.');
    }

    /** Handle submit. */
    function _handleSubmit(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();
        if (!objProfile.fullName.trim())
        {
            setStrError('Please enter your full name.');
            return;
        }

        const objCleanProfile = {
            ...objProfile,
            businessAddress: objProfile.businessAddress.trim(),
            contactNumber: objProfile.contactNumber.trim(),
            fullName: objProfile.fullName.trim(),
            organizationName: objProfile.organizationName.trim(),
            position: objProfile.position.trim(),
        };
        setObjProfile(objCleanProfile);
        saveProponentProfile(objActiveUser, objCleanProfile);
        setMockUser({
            ...objActiveUser,
            initials: _getInitials(objCleanProfile.fullName),
            name: objCleanProfile.fullName,
        });
        window.dispatchEvent(new CustomEvent('dprms:profile-updated'));
        setStrError(null);
        setTxtMessage('Profile information saved successfully.');
    } /* end _handleSubmit */

    return (
        <div className="space-y-7">
            <AdminPageHeader
                txtDescription="Keep your account and contact details up to date."
                strEyebrow="My Account"
                title="Profile"
            />

            <form className="space-y-5" onSubmit={_handleSubmit}>
                <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
                    <div className="h-24 bg-gradient-to-r from-[#073b82] via-[#0f53b7] to-[#2c83d5] sm:h-28" />
                    <div className="px-5 pb-6 sm:px-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="-mt-12 grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#eaf4ff] text-2xl font-black text-[#073b82] shadow-md">
                                    {objProfile.photoDataUrl ? (
                                        <img
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                            src={objProfile.photoDataUrl}
                                        />
                                    ) : (
                                        _getInitials(objProfile.fullName)
                                    )}
                                </div>
                                <div className="pb-1">
                                    <h2 className="text-xl font-black text-slate-900">
                                        {objProfile.fullName || 'Project Proponent'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {objProfile.organizationName ||
                                            'Organization not yet added'}
                                    </p>
                                    {objProfile.program ? (
                                        <span className="mt-2 block text-xs font-bold text-[#0f53b7]">
                                            {objProfile.program} Proponent
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                                    onClick={() => objPhotoInputRef.current?.click()}
                                    type="button"
                                >
                                    <Camera className="size-4" />
                                    {objProfile.photoDataUrl ? 'Change Photo' : 'Add Photo'}
                                </button>
                                {objProfile.photoDataUrl ? (
                                    <button
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                        onClick={_removePhoto}
                                        type="button"
                                    >
                                        <Trash2 className="size-4" />
                                        Remove
                                    </button>
                                ) : null}
                                <input
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={_handlePhoto}
                                    ref={objPhotoInputRef}
                                    type="file"
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 sm:ml-32">
                            JPG, PNG, or WebP · Maximum 1 MB
                        </p>
                    </div>
                </section>

                {strError ? (
                    <div
                        className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                        role="alert"
                    >
                        {strError}
                    </div>
                ) : null}
                {txtMessage ? (
                    <div
                        className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                        role="status"
                    >
                        <CheckCircle2 className="size-4" />
                        {txtMessage}
                    </div>
                ) : null}

                <div className="grid gap-5 xl:grid-cols-2">
                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                                <UserRound className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-black text-slate-900">Personal Information</h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Your primary contact details
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                                Full Name <span className="text-red-600">*</span>
                                <input
                                    className={INPUT_CLASS_NAME}
                                    onChange={(objEvent) =>
                                        _updateField('fullName', objEvent.target.value)
                                    }
                                    value={objProfile.fullName}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <Phone className="size-4 text-slate-400" />
                                    Contact Number
                                </span>
                                <input
                                    className={INPUT_CLASS_NAME}
                                    onChange={(objEvent) =>
                                        _updateField('contactNumber', objEvent.target.value)
                                    }
                                    placeholder="09XX XXX XXXX"
                                    type="tel"
                                    value={objProfile.contactNumber}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Position / Role
                                <input
                                    className={INPUT_CLASS_NAME}
                                    onChange={(objEvent) =>
                                        _updateField('position', objEvent.target.value)
                                    }
                                    placeholder="e.g. Owner or Chairperson"
                                    value={objProfile.position}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="size-4 text-slate-400" />
                                    Email Address
                                </span>
                                <input
                                    className={`${INPUT_CLASS_NAME} cursor-not-allowed bg-slate-50 text-slate-500`}
                                    readOnly
                                    value={objProfile.email}
                                />
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                                <Building2 className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-black text-slate-900">
                                    Organization Information
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Enterprise represented by this account
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                                Organization Name
                                <input
                                    className={INPUT_CLASS_NAME}
                                    onChange={(objEvent) =>
                                        _updateField('organizationName', objEvent.target.value)
                                    }
                                    value={objProfile.organizationName}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="size-4 text-slate-400" />
                                    Organization Type
                                </span>
                                <input
                                    className={`${INPUT_CLASS_NAME} cursor-not-allowed bg-slate-50 text-slate-500`}
                                    readOnly
                                    value={objProfile.organizationType || 'Not specified'}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700">
                                Program
                                <input
                                    className={`${INPUT_CLASS_NAME} cursor-not-allowed bg-slate-50 text-slate-500`}
                                    readOnly
                                    value={objProfile.program || 'Not assigned'}
                                />
                            </label>
                            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-4 text-slate-400" />
                                    Business Address
                                </span>
                                <textarea
                                    className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                                    onChange={(objEvent) =>
                                        _updateField('businessAddress', objEvent.target.value)
                                    }
                                    value={objProfile.businessAddress}
                                />
                            </label>
                        </div>
                    </section>
                </div>

                <div className="flex justify-end rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                    <button
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white transition hover:bg-[#0b3f8b]"
                        type="submit"
                    >
                        <Save className="size-4" />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    ); // end return
} /* end ProfilePage */
