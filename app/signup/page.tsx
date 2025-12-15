import Image from 'next/image'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
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
        <SignupForm />
      </div>
    </main>
  )
}
