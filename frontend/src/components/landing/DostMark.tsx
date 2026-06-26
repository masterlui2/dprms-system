type DostMarkProps = {
  className?: string
}

export function DostMark({ className }: DostMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M32 4h1.8C48.27 4 60 15.73 60 30.2V60H30.2C15.73 60 4 48.27 4 33.8V32C4 16.54 16.54 4 32 4Z" fill="#F4C542" />
      <path d="M32 4h1.8C48.27 4 60 15.73 60 30.2V60H30.2C15.73 60 4 48.27 4 33.8V32h28V4Z" fill="#0F53B7" />
      <path d="M32 4h1.8C48.27 4 60 15.73 60 30.2V32H32V4Z" fill="#0B3F8B" />
      <path d="M4 32h28v28h-1.8C15.73 60 4 48.27 4 33.8V32Z" fill="#F4C542" />
      <circle cx="32" cy="32" fill="white" r="9" />
    </svg>
  )
}
