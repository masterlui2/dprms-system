import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'

export function ModuleWorkspace({ description, title }: { description: string, title: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader description={description} eyebrow="DPRMS Module" title={title} />
      <AdminPanel title={title}>
        <div className="px-5 py-8 text-sm leading-6 text-slate-600">
          This workspace is available to your role. Its management tools can be added here without changing the shared DPRMS navigation or permission model.
        </div>
      </AdminPanel>
    </div>
  )
}
