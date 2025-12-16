'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function LogoutButton({ variant = 'outline' }: LogoutButtonProps) {
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Signed out successfully')
    window.location.href = '/'
  }

  return (
    <Button variant={variant} onClick={handleLogout}>
      Sign Out
    </Button>
  )
}
