'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, Skull, Sword, Sparkles, X, Brain, Package } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSrdSearch, SrdSearchType } from '@/hooks/useSrdSearch'
import { SrdCreatureCard } from './SrdCreatureCard'
import { SrdItemDisplay } from './SrdItemDisplay'
import { toast } from 'sonner'
import type { GameSystem, SrdCreature, SrdItem, SrdSpell } from '@/types/srd'

interface SrdLookupPopoverProps {
  gameSystem?: GameSystem
  types?: SrdSearchType[]
  campaignId?: string  // Required for "Add to Memory" and "Add to Inventory" features
  onSelectCreature?: (creature: SrdCreature) => void
  onSelectItem?: (item: SrdItem) => void
  onSelectSpell?: (spell: SrdSpell) => void
  onAddedToMemory?: (entityId: string, entityName: string) => void
  onAddedToInventory?: (itemName: string, ownerName: string) => void
  triggerLabel?: string
  placeholder?: string
}

export function SrdLookupPopover({
  gameSystem = '5e_2014',
  types = ['creatures', 'items', 'spells'],
  campaignId,
  onSelectCreature,
  onSelectItem,
  onSelectSpell,
  onAddedToMemory,
  onAddedToInventory,
  triggerLabel = 'Search SRD',
  placeholder = 'Search creatures, items, spells...',
}: SrdLookupPopoverProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [selectedCreature, setSelectedCreature] = useState<SrdCreature | null>(null)
  const [selectedItem, setSelectedItem] = useState<SrdItem | null>(null)
  const [isSavingToMemory, setIsSavingToMemory] = useState(false)

  // Inventory dialog state
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [inventoryItem, setInventoryItem] = useState<SrdItem | null>(null) // Separate state to preserve item when popover closes
  const [selectedOwnerType, setSelectedOwnerType] = useState<string>('')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [addingToInventory, setAddingToInventory] = useState(false)

  const {
    query,
    setQuery,
    results,
    isLoading,
    clear,
  } = useSrdSearch({ gameSystem, types, limit: 10 })

  // Fetch owners when owner type changes
  const fetchOwners = useCallback(async (ownerType: string) => {
    if (!ownerType || !campaignId || ownerType === 'party') return

    setLoadingOwners(true)
    try {
      const res = await fetch(`/api/entities?campaignId=${campaignId}&entityType=${ownerType}`)
      if (res.ok) {
        const data = await res.json()
        setOwners(data.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })))
      }
    } catch (err) {
      console.error('Failed to fetch owners:', err)
      setOwners([])
    } finally {
      setLoadingOwners(false)
    }
  }, [campaignId])

  // Handle owner type change
  const handleOwnerTypeChange = useCallback((value: string) => {
    setSelectedOwnerType(value)
    setSelectedOwnerId('')
    setOwners([])
    if (value === 'party' && campaignId) {
      setSelectedOwnerId(campaignId) // Use campaign ID as owner for party
    } else {
      fetchOwners(value)
    }
  }, [fetchOwners, campaignId])

  // Open inventory dialog
  const handleOpenInventoryDialog = useCallback(() => {
    // Copy selectedItem to inventoryItem so it persists when popover closes
    setInventoryItem(selectedItem)
    setShowInventoryDialog(true)
    setSelectedOwnerType('')
    setSelectedOwnerId('')
    setQuantity(1)
    setOwners([])
  }, [selectedItem])

  // Add to inventory
  const handleAddToInventory = useCallback(async () => {
    if (!selectedOwnerType || !selectedOwnerId || !inventoryItem || !campaignId) return

    setAddingToInventory(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          srd_item_id: inventoryItem.id,
          owner_type: selectedOwnerType,
          owner_id: selectedOwnerId,
          quantity: quantity,
          acquired_from: 'Added from SRD',
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add to inventory')
      }

      const ownerName = selectedOwnerType === 'party'
        ? 'Party Inventory'
        : owners.find(o => o.id === selectedOwnerId)?.name || 'inventory'

      toast.success(`Added ${quantity}x ${inventoryItem.name} to ${ownerName}`)

      if (onAddedToInventory) {
        onAddedToInventory(inventoryItem.name, ownerName)
      }

      setShowInventoryDialog(false)
      setInventoryItem(null)
      setQuantity(1)
    } catch (err) {
      console.error('Failed to add to inventory:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add item to inventory')
    } finally {
      setAddingToInventory(false)
    }
  }, [selectedOwnerType, selectedOwnerId, inventoryItem, campaignId, quantity, owners, onAddedToInventory])

  // Add to Memory handlers
  const handleAddCreatureToMemory = useCallback(async () => {
    if (!selectedCreature || !campaignId) return

    setIsSavingToMemory(true)
    try {
      const response = await fetch('/api/srd/add-to-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srdEntity: selectedCreature,
          campaignId,
          srdType: 'creature',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to Memory')
      }

      const result = await response.json()
      toast.success(`${selectedCreature.name} added to Memory!`)

      if (onAddedToMemory) {
        onAddedToMemory(result.id, selectedCreature.name)
      }

      setOpen(false)
      clear()
      setSelectedCreature(null)
    } catch (error) {
      console.error('Failed to add creature to memory:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to Memory')
    } finally {
      setIsSavingToMemory(false)
    }
  }, [selectedCreature, campaignId, onAddedToMemory, clear])

  const handleAddItemToMemory = useCallback(async () => {
    if (!selectedItem || !campaignId) return

    setIsSavingToMemory(true)
    try {
      const response = await fetch('/api/srd/add-to-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srdEntity: selectedItem,
          campaignId,
          srdType: 'item',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to Memory')
      }

      const result = await response.json()
      toast.success(`${selectedItem.name} added to Memory!`)

      if (onAddedToMemory) {
        onAddedToMemory(result.id, selectedItem.name)
      }

      setOpen(false)
      clear()
      setSelectedItem(null)
    } catch (error) {
      console.error('Failed to add item to memory:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to Memory')
    } finally {
      setIsSavingToMemory(false)
    }
  }, [selectedItem, campaignId, onAddedToMemory, clear])

  const handleSelectCreature = useCallback((creature: SrdCreature) => {
    setSelectedCreature(creature)
    setSelectedItem(null)
  }, [])

  const handleSelectItem = useCallback((item: SrdItem) => {
    setSelectedItem(item)
    setSelectedCreature(null)
  }, [])

  const handleConfirmCreature = useCallback(() => {
    if (selectedCreature && onSelectCreature) {
      onSelectCreature(selectedCreature)
      setOpen(false)
      clear()
      setSelectedCreature(null)
    }
  }, [selectedCreature, onSelectCreature, clear])

  const handleConfirmItem = useCallback(() => {
    if (selectedItem && onSelectItem) {
      onSelectItem(selectedItem)
      setOpen(false)
      clear()
      setSelectedItem(null)
    }
  }, [selectedItem, onSelectItem, clear])

  const handleBack = useCallback(() => {
    setSelectedCreature(null)
    setSelectedItem(null)
  }, [])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      clear()
      setSelectedCreature(null)
      setSelectedItem(null)
    }
  }, [clear])

  const hasResults = results.creatures.length > 0 || results.items.length > 0 || results.spells.length > 0

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="w-4 h-4" />
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] max-h-[500px] overflow-hidden p-0" align="start">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9 bg-slate-800 border-slate-700"
                autoFocus
              />
              {query && (
                <button
                  onClick={clear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[400px]">
            {/* Loading State */}
            {isLoading && (
              <div className="p-8 flex items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {/* Creature Detail View */}
            {selectedCreature && (
              <div className="p-3 space-y-3">
                <button
                  onClick={handleBack}
                  className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  disabled={isSavingToMemory}
                >
                  ← Back to results
                </button>
                <SrdCreatureCard creature={selectedCreature} />
                <div className="flex gap-2">
                  {onSelectCreature && (
                    <Button onClick={handleConfirmCreature} className="flex-1" disabled={isSavingToMemory}>
                      Use in Forge
                    </Button>
                  )}
                  {campaignId && (
                    <Button
                      onClick={handleAddCreatureToMemory}
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={isSavingToMemory}
                    >
                      {isSavingToMemory ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      Add to Memory
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Item Detail View */}
            {selectedItem && (
              <div className="p-3 space-y-3">
                <button
                  onClick={handleBack}
                  className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  disabled={isSavingToMemory || addingToInventory}
                >
                  ← Back to results
                </button>
                <SrdItemDisplay item={selectedItem} />
                <div className="flex gap-2 flex-wrap">
                  {onSelectItem && (
                    <Button onClick={handleConfirmItem} className="flex-1" disabled={isSavingToMemory || addingToInventory}>
                      Use in Forge
                    </Button>
                  )}
                  {campaignId && (
                    <>
                      <Button
                        onClick={handleOpenInventoryDialog}
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={isSavingToMemory || addingToInventory}
                      >
                        <Package className="w-4 h-4" />
                        Add to Inventory
                      </Button>
                      <Button
                        onClick={handleAddItemToMemory}
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={isSavingToMemory || addingToInventory}
                      >
                        {isSavingToMemory ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        Add to Memory
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Search Results List */}
            {!selectedCreature && !selectedItem && !isLoading && (
              <div className="p-3 space-y-4">
                {/* Empty State */}
                {!hasResults && query.length >= 2 && (
                  <div className="text-center py-8 text-slate-400">
                    No results found for &quot;{query}&quot;
                  </div>
                )}

                {/* Prompt to Search */}
                {!hasResults && query.length < 2 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Type at least 2 characters to search
                  </div>
                )}

                {/* Creatures Section */}
                {results.creatures.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 text-sm font-medium mb-2">
                      <Skull className="w-4 h-4" />
                      Creatures ({results.creatures.length})
                    </div>
                    <div className="space-y-2">
                      {results.creatures.map((creature) => (
                        <SrdCreatureCard
                          key={creature.id}
                          creature={creature}
                          compact
                          onSelect={handleSelectCreature}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Section */}
                {results.items.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                      <Sword className="w-4 h-4" />
                      Items ({results.items.length})
                    </div>
                    <div className="space-y-2">
                      {results.items.map((item) => (
                        <SrdItemDisplay
                          key={item.id}
                          item={item}
                          compact
                          onSelect={handleSelectItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Spells Section - Compact list for now */}
                {results.spells.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                      <Sparkles className="w-4 h-4" />
                      Spells ({results.spells.length})
                    </div>
                    <div className="space-y-2">
                      {results.spells.map((spell) => (
                        <div
                          key={spell.id}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/50 hover:border-purple-500/30 transition-colors"
                          onClick={() => {
                            if (onSelectSpell) {
                              onSelectSpell(spell)
                              setOpen(false)
                              clear()
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span className="font-medium text-slate-200">{spell.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</span>
                              {spell.school && <span className="capitalize">{spell.school}</span>}
                            </div>
                          </div>
                          {spell.concentration && (
                            <span className="text-xs text-yellow-400 mt-1 inline-block">Concentration</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Add to Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={(open) => { setShowInventoryDialog(open); if (!open) setInventoryItem(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Add to Inventory</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Item being added */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <p className="font-medium text-slate-200">{inventoryItem?.name}</p>
              <p className="text-sm text-slate-400">{inventoryItem?.item_type}</p>
            </div>

            {/* Owner Type */}
            <div className="space-y-2">
              <Label className="text-slate-300">Give to</Label>
              <Select value={selectedOwnerType} onValueChange={handleOwnerTypeChange}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Select owner type..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="npc">NPC</SelectItem>
                  <SelectItem value="player">Player Character</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="party">Party Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner Selection */}
            {selectedOwnerType && selectedOwnerType !== 'party' && (
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Select {selectedOwnerType === 'npc' ? 'NPC' : selectedOwnerType === 'player' ? 'Character' : 'Location'}
                </Label>
                <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId} disabled={loadingOwners}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue placeholder={loadingOwners ? 'Loading...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {owners.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        {loadingOwners ? 'Loading...' : `No ${selectedOwnerType}s found`}
                      </SelectItem>
                    ) : (
                      owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-slate-300">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-slate-800 border-slate-700 text-slate-200 w-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowInventoryDialog(false); setInventoryItem(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToInventory}
              disabled={!inventoryItem || !selectedOwnerType || !selectedOwnerId || addingToInventory}
              className="bg-teal-600 hover:bg-teal-500"
            >
              {addingToInventory ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add to Inventory'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
