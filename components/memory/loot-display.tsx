'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Backpack, Sparkles, ExternalLink } from 'lucide-react'
import { renderWithBold } from '@/lib/text-utils'

interface LootDisplayProps {
  loot: string | string[]
  entityId: string
  entityName: string
  entityType: string
  campaignId: string
}

interface OwnedItem {
  id: string
  name: string
}

export function LootDisplay({
  loot,
  entityId,
  entityName,
  entityType,
  campaignId,
}: LootDisplayProps): JSX.Element {
  const router = useRouter()
  const supabase = createClient()
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch items owned by this entity
  useEffect(() => {
    async function fetchOwnedItems(): Promise<void> {
      try {
        // Query for items that have an "owned_by" relationship to this entity
        const { data } = await supabase
          .from('relationships')
          .select(`
            source_id,
            source_entity:source_id(id, name, entity_type)
          `)
          .eq('target_id', entityId)
          .eq('relationship_type', 'owned_by')

        if (data) {
          const items = data
            .filter((r) => {
              const entity = r.source_entity as { entity_type?: string } | null
              return entity?.entity_type === 'item'
            })
            .map((r) => {
              const entity = r.source_entity as { id: string; name: string }
              return {
                id: entity.id,
                name: entity.name,
              }
            })
          setOwnedItems(items)
        }
      } catch (error) {
        console.error('Failed to fetch owned items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOwnedItems()
  }, [entityId, supabase])

  // Helper to check if a loot item has been forged
  const getForgedItem = (lootName: string): OwnedItem | undefined => {
    const lootLower = lootName.toLowerCase()
    return ownedItems.find((item) => {
      const itemLower = item.name.toLowerCase()
      // Check if loot name is contained in item name or vice versa
      return itemLower.includes(lootLower) || lootLower.includes(itemLower)
    })
  }

  // Handler to navigate to Item Forge with loot context
  const handleForgeLoot = (lootName: string): void => {
    const context = {
      fromLoot: true,
      sourceEntityId: entityId,
      sourceEntityName: entityName,
      sourceEntityType: entityType,
      originalLootText: lootName,
      snippet: `Carried by ${entityName}`,
    }

    const params = new URLSearchParams({
      lootName: lootName,
      ownerId: entityId,
      context: JSON.stringify(context),
    })

    router.push(`/dashboard/campaigns/${campaignId}/forge/item?${params}`)
  }

  const lootItems = Array.isArray(loot) ? loot : [loot]

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <Backpack className="w-4 h-4" />
          Loot & Pockets
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ul className="text-sm text-muted-foreground space-y-1">
          {lootItems.map((item: string, idx: number) => {
            // Check if this item has "[Forged]" marker
            const isMarkedForged = item.includes('[Forged]')
            const cleanItemName = item.replace(' [Forged]', '').replace('[Forged]', '')

            // Look for an existing forged item
            const forgedItem = getForgedItem(cleanItemName)

            return (
              <li
                key={idx}
                className="flex items-center justify-between group py-0.5"
              >
                {forgedItem || isMarkedForged ? (
                  // Already forged - show as link
                  forgedItem ? (
                    <Link
                      href={`/dashboard/campaigns/${campaignId}/memory/${forgedItem.id}`}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="text-primary">•</span>
                      <span>{renderWithBold(cleanItemName)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-primary">•</span>
                      <span>{renderWithBold(cleanItemName)}</span>
                      <span className="text-xs text-slate-500">(forged)</span>
                    </div>
                  )
                ) : (
                  // Not forged - show text with forge button
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">•</span>
                      <span>{renderWithBold(item)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                      onClick={() => handleForgeLoot(item)}
                      disabled={loading}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Forge
                    </Button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
