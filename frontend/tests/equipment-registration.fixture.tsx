import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EquipmentRegistrationModal } from '../src/components/admin/equipment/EquipmentRegistrationModal'
import '../src/index.css'

export function Fixture() {
  const [saved, setSaved] = useState('')
  return <><EquipmentRegistrationModal
    onClose={() => {}}
    onSaved={(equipment) => setSaved(equipment.name)}
    options={{
      categories: [{ category_code: 'LAB', category_name: 'Laboratory Equipment', id: 9 }],
      programs: ['GIA'],
      projects: [{ cooperator: 'Davao State University', id: 88, location: 'Mati City', program_type: 'GIA', reference_number: 'GIA-2026-0088', title: 'Cacao Research Center' }],
    }}
    program="GIA"
  /><output data-testid="saved-equipment">{saved}</output></>
}

createRoot(document.getElementById('root')!).render(<Fixture />)
