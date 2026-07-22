import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Building2,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { getMockUser, setMockUser } from '../../lib/mockAuth'
import {
  getProponentProfile,
  saveProponentProfile,
  type ProponentProfile,
} from '../../services/profileStore'

const inputClassName = 'mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? 'P'}${parts[1]?.[0] ?? parts[0]?.[1] ?? 'R'}`.toUpperCase()
}

export function ProfilePage() {
  const user = getMockUser()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<ProponentProfile>(() => user
    ? getProponentProfile(user)
    : {
      businessAddress: '',
      contactNumber: '',
      email: '',
      fullName: '',
      organizationName: '',
      organizationType: '',
      photoDataUrl: '',
      position: '',
      program: '',
    })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null
  const activeUser = user

  function updateField(field: keyof ProponentProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setMessage(null)
    setError(null)
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 1024 * 1024) {
      setError('Please choose an image smaller than 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setError('The image could not be loaded. Please try another file.')
    reader.onload = () => {
      const nextProfile = { ...profile, photoDataUrl: String(reader.result) }
      setProfile(nextProfile)
      saveProponentProfile(activeUser, nextProfile)
      setError(null)
      setMessage('Profile picture updated.')
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    const nextProfile = { ...profile, photoDataUrl: '' }
    setProfile(nextProfile)
    saveProponentProfile(activeUser, nextProfile)
    setError(null)
    setMessage('Profile picture removed.')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile.fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    const cleanProfile = {
      ...profile,
      businessAddress: profile.businessAddress.trim(),
      contactNumber: profile.contactNumber.trim(),
      fullName: profile.fullName.trim(),
      organizationName: profile.organizationName.trim(),
      position: profile.position.trim(),
    }
    setProfile(cleanProfile)
    saveProponentProfile(activeUser, cleanProfile)
    setMockUser({
      ...activeUser,
      initials: getInitials(cleanProfile.fullName),
      name: cleanProfile.fullName,
    })
    window.dispatchEvent(new CustomEvent('dprms:profile-updated'))
    setError(null)
    setMessage('Profile information saved successfully.')
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Keep your account and contact details up to date."
        eyebrow="My Account"
        title="Profile"
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="h-24 bg-gradient-to-r from-[#073b82] via-[#0f53b7] to-[#2c83d5] sm:h-28" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="-mt-12 grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#eaf4ff] text-2xl font-black text-[#073b82] shadow-md">
                  {profile.photoDataUrl ? <img alt="Profile" className="h-full w-full object-cover" src={profile.photoDataUrl} /> : getInitials(profile.fullName)}
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-black text-slate-900">{profile.fullName || 'Project Proponent'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{profile.organizationName || 'Organization not yet added'}</p>
                  {profile.program ? <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0f53b7]">{profile.program} Proponent</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]" onClick={() => photoInputRef.current?.click()} type="button"><Camera className="size-4" />{profile.photoDataUrl ? 'Change Photo' : 'Add Photo'}</button>
                {profile.photoDataUrl ? <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-50" onClick={removePhoto} type="button"><Trash2 className="size-4" />Remove</button> : null}
                <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhoto} ref={photoInputRef} type="file" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 sm:ml-32">JPG, PNG, or WebP · Maximum 1 MB</p>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div> : null}
        {message ? <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status"><CheckCircle2 className="size-4" />{message}</div> : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><UserRound className="size-5" /></span>
              <div><h2 className="font-black text-slate-900">Personal Information</h2><p className="mt-0.5 text-xs text-slate-500">Your primary contact details</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Full Name <span className="text-red-600">*</span><input className={inputClassName} onChange={(event) => updateField('fullName', event.target.value)} value={profile.fullName} /></label>
              <label className="text-sm font-bold text-slate-700"><span className="flex items-center gap-1.5"><Phone className="size-4 text-slate-400" />Contact Number</span><input className={inputClassName} onChange={(event) => updateField('contactNumber', event.target.value)} placeholder="09XX XXX XXXX" type="tel" value={profile.contactNumber} /></label>
              <label className="text-sm font-bold text-slate-700">Position / Role<input className={inputClassName} onChange={(event) => updateField('position', event.target.value)} placeholder="e.g. Owner or Chairperson" value={profile.position} /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2"><span className="flex items-center gap-1.5"><Mail className="size-4 text-slate-400" />Email Address</span><input className={`${inputClassName} cursor-not-allowed bg-slate-50 text-slate-500`} readOnly value={profile.email} /></label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><Building2 className="size-5" /></span>
              <div><h2 className="font-black text-slate-900">Organization Information</h2><p className="mt-0.5 text-xs text-slate-500">Enterprise represented by this account</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Organization Name<input className={inputClassName} onChange={(event) => updateField('organizationName', event.target.value)} value={profile.organizationName} /></label>
              <label className="text-sm font-bold text-slate-700"><span className="flex items-center gap-1.5"><Building2 className="size-4 text-slate-400" />Organization Type</span><input className={`${inputClassName} cursor-not-allowed bg-slate-50 text-slate-500`} readOnly value={profile.organizationType || 'Not specified'} /></label>
              <label className="text-sm font-bold text-slate-700">Program<input className={`${inputClassName} cursor-not-allowed bg-slate-50 text-slate-500`} readOnly value={profile.program || 'Not assigned'} /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2"><span className="flex items-center gap-1.5"><MapPin className="size-4 text-slate-400" />Business Address</span><textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100" onChange={(event) => updateField('businessAddress', event.target.value)} value={profile.businessAddress} /></label>
            </div>
          </section>
        </div>

        <div className="flex justify-end rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white transition hover:bg-[#0b3f8b]" type="submit"><Save className="size-4" />Save Profile</button>
        </div>
      </form>
    </div>
  )
}
