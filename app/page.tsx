import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/images/logo-stacked.svg"
          alt="Campaign Ally"
          width={200}
          height={250}
          priority
        />
        <p className="text-muted-foreground text-center max-w-md">
          Your AI co-pilot for managing D&amp;D campaigns. Coming soon.
        </p>
      </div>
    </main>
  )
}
