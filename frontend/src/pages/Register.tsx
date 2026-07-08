import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { RegisterForm } from '../components/auth/RegisterForm'

export function Register() {
  return (
    <main className="grid min-h-screen bg-white text-slate-950 lg:grid-cols-2">
      <LoginBrandPanel />
      <RegisterForm />
    </main>
  )
}
