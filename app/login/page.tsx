import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <Image
          src="/images/logo-stacked.png"
          alt="Campaign Ally"
          width={200}
          height={200}
          priority
        />
        <LoginForm />
      </div>
    </main>
  )
}
