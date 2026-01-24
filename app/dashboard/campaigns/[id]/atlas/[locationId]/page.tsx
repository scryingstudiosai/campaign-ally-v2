'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtlasView } from '@/components/atlas'
import { Loader2 } from 'lucide-react'
import type { LivingEntity } from '@/types/living-entity'

export default function AtlasLocationPage() {
  const params = useParams()
  const campaignId = params.id as string
  const locationId = params.locationId as string
  const supabase = createClient()

  const [location, setLocation] = useState<LivingEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('entities')
          .select('*')
          .eq('id', locationId)
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'location')
          .is('deleted_at', null)
          .single()

        if (fetchError || !data) {
          setError('Location not found')
          return
        }

        setLocation(data as unknown as LivingEntity)
      } catch (err) {
        console.error('Failed to fetch location:', err)
        setError('Failed to load location')
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [locationId, campaignId, supabase])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <p className="text-slate-400">Loading Atlas...</p>
        </div>
      </div>
    )
  }

  if (error || !location) {
    return notFound()
  }

  return (
    <div className="h-screen">
      <AtlasView campaignId={campaignId} location={location} />
    </div>
  )
}
