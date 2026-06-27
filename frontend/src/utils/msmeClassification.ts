export type MsmeClassification =
  | 'Micro Enterprise'
  | 'Small Enterprise'
  | 'Medium Enterprise'
  | 'Outside MSME Range'

export function classifyMsme(totalBusinessAssets: string): MsmeClassification | null {
  if (!totalBusinessAssets.trim()) return null

  const assets = Number(totalBusinessAssets)

  if (!Number.isFinite(assets) || assets <= 0) return null
  if (assets <= 3_000_000) return 'Micro Enterprise'
  if (assets <= 15_000_000) return 'Small Enterprise'
  if (assets <= 100_000_000) return 'Medium Enterprise'

  return 'Outside MSME Range'
}

export function formatPhilippinePeso(value: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return 'PHP 0'

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}
