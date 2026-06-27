import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <main className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-2">
      <LoginBrandPanel />
      <LoginForm />
    </main>
  )
}
