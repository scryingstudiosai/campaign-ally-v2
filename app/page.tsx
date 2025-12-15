import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/images/logo-stacked.png"
          alt="Campaign Ally"
          width={200}
          height={200}
          priority
        />
        <p className="text-muted-foreground text-center max-w-md">
          Your AI co-pilot for managing D&amp;D campaigns.
        </p>

        <div className="flex gap-4 mt-4">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
