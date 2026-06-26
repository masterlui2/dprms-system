type SectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  theme?: 'light' | 'dark'
}

export function SectionHeader({ description, eyebrow, theme = 'light', title }: SectionHeaderProps) {
  const isDark = theme === 'dark'

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={`text-sm font-bold uppercase ${isDark ? 'text-blue-100' : 'text-[#0f53b7]'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black md:text-4xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-base leading-7 md:text-lg ${isDark ? 'text-blue-100' : 'text-slate-600'}`}>
          {description}
        </p>
      ) : null}
    </div>
  )
}
