interface ProposalSectionHeadingProps {
  description: string
  divided?: boolean
  title: string
}

export function ProposalSectionHeading({
  description,
  divided = true,
  title,
}: ProposalSectionHeadingProps) {
  return (
    <div className={divided ? 'border-b border-slate-200 pb-5' : ''}>
      <h2 className="text-xl font-black text-[#073b82] sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}
