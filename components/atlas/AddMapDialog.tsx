'use client'

import { useState, useEffect } from 'react'
import { Loader2, Upload, Link as LinkIcon, Globe } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { AtlasMap } from '@/app/api/campaigns/[id]/atlas/route'

interface AddMapDialogProps {
  open: boolean
  onClose: () => void
  campaignId: string
  mode: 'upload' | 'url'
  onMapAdded: (map: AtlasMap) => void
}

type MapType = 'world' | 'region' | 'city' | 'dungeon' | 'building' | 'encounter' | 'other'

const mapTypeLabels: Record<MapType, string> = {
  world: 'World Map',
  region: 'Region Map',
  city: 'City Map',
  dungeon: 'Dungeon Map',
  building: 'Building Map',
  encounter: 'Encounter Map',
  other: 'Other',
}

export function AddMapDialog({ open, onClose, campaignId, mode, onMapAdded }: AddMapDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mapType, setMapType] = useState<MapType>('region')
  const [style, setStyle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [linkedEntityId, setLinkedEntityId] = useState('')
  const [entities, setEntities] = useState<Array<{ id: string; name: string; entity_type: string }>>([])

  useEffect(() => {
    if (open) {
      // Fetch entities for linking
      fetchEntities()
    }
  }, [open, campaignId])

  async function fetchEntities() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities?type=location`)
      if (res.ok) {
        const data = await res.json()
        setEntities(data)
      }
    } catch (error) {
      console.error('Failed to fetch entities:', error)
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a map name')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maps')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('maps')
        .getPublicUrl(fileName)

      // Create map record
      await createMapRecord(publicUrl, 'uploaded')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload map')
    } finally {
      setUploading(false)
    }
  }

  async function handleLinkUrl() {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a map name')
      return
    }

    setUploading(true)

    try {
      await createMapRecord(imageUrl, 'external_url')
    } catch (error) {
      console.error('Error creating map:', error)
      toast.error('Failed to add map')
    } finally {
      setUploading(false)
    }
  }

  async function createMapRecord(imageUrl: string, sourceType: 'uploaded' | 'external_url') {
    const res = await fetch(`/api/campaigns/${campaignId}/atlas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        imageUrl,
        sourceType,
        mapType,
        style: style.trim() || null,
        linkedEntityId: linkedEntityId || null,
        isPublic: false,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to create map')
    }

    const newMap = await res.json()
    toast.success('Map added successfully!')
    onMapAdded(newMap)
    resetForm()
  }

  function resetForm() {
    setName('')
    setDescription('')
    setMapType('region')
    setStyle('')
    setImageUrl('')
    setSelectedFile(null)
    setLinkedEntityId('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'upload' ? (
              <>
                <Upload className="w-5 h-5 text-teal-400" />
                Upload Map
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5 text-teal-400" />
                Link External Map
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'upload'
              ? 'Upload an image file to add to your campaign atlas.'
              : 'Add a map from an external URL to your campaign atlas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Map Name *</Label>
            <Input
              id="name"
              placeholder="e.g., The Sword Coast"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Map Type */}
          <div className="space-y-2">
            <Label>Map Type</Label>
            <Select value={mapType} onValueChange={(v) => setMapType(v as MapType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(mapTypeLabels) as MapType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {mapTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload or URL */}
          {mode === 'upload' ? (
            <div className="space-y-2">
              <Label htmlFor="file">Image File *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-teal-500/20 file:text-teal-400 hover:file:bg-teal-500/30"
              />
              {selectedFile && (
                <p className="text-xs text-slate-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url">Image URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com/map.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Style (optional)</Label>
            <Input
              id="style"
              placeholder="e.g., parchment, satellite, artistic"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A brief description of this map..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Link to Entity */}
          <div className="space-y-2">
            <Label>Link to Location (optional)</Label>
            <Select value={linkedEntityId} onValueChange={setLinkedEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={mode === 'upload' ? handleUpload : handleLinkUrl}
            disabled={uploading || !name.trim() || (mode === 'upload' ? !selectedFile : !imageUrl.trim())}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'upload' ? 'Uploading...' : 'Adding...'}
              </>
            ) : (
              <>
                {mode === 'upload' ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Map
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add Map
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
