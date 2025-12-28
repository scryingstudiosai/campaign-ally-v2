import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface WorldUpdate {
  id: string;
  type: 'status' | 'location' | 'relationship' | 'fact' | 'item' | 'quest';
  entityId?: string;
  entityName: string;
  targetName?: string;
  oldValue?: string;
  newValue?: string;
  value?: string;
  itemName?: string;
  questName?: string;
  action?: string;
  reason: string;
  resolved: boolean;
  isPartyUpdate?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    const { updates, xpAwarded } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Get session to find campaign
    const { data: session } = await supabase
      .from('sessions')
      .select('campaign_id')
      .eq('id', sessionId)
      .single();

    const campaignId = session?.campaign_id;

    const results: any[] = [];
    const errors: any[] = [];

    for (const update of updates as WorldUpdate[]) {
      try {
        switch (update.type) {
          case 'status':
            if (update.entityId) {
              const { error } = await supabase
                .from('entities')
                .update({
                  status: update.newValue,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', update.entityId);

              if (error) throw error;
              results.push({
                id: update.id,
                success: true,
                type: 'status',
                message: `Marked ${update.entityName} as ${update.newValue}`
              });
            }
            break;

          case 'fact':
            if (update.entityId) {
              // Get current entity brain data
              const { data: entity } = await supabase
                .from('entities')
                .select('brain')
                .eq('id', update.entityId)
                .single();

              // Append fact to brain.secrets
              const brain = entity?.brain || {};
              const existingSecrets = brain.secrets || '';
              const timestamp = new Date().toLocaleDateString();
              const newFact = existingSecrets
                ? `${existingSecrets}\n\n[${timestamp}] ${update.value}`
                : `[${timestamp}] ${update.value}`;

              const { error } = await supabase
                .from('entities')
                .update({
                  brain: {
                    ...brain,
                    secrets: newFact,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', update.entityId);

              if (error) throw error;
              results.push({
                id: update.id,
                success: true,
                type: 'fact',
                message: `Added fact to ${update.entityName}`
              });
            }
            break;

          case 'relationship':
            if (update.entityId) {
              // Get current entity brain data
              const { data: entity } = await supabase
                .from('entities')
                .select('brain')
                .eq('id', update.entityId)
                .single();

              const brain = entity?.brain || {};
              const existingNotes = brain.dm_notes || '';
              const timestamp = new Date().toLocaleDateString();
              const relationshipNote = existingNotes
                ? `${existingNotes}\n\n[${timestamp}] Relationship with ${update.targetName || 'Party'}: ${update.oldValue} → ${update.newValue}. ${update.reason}`
                : `[${timestamp}] Relationship with ${update.targetName || 'Party'}: ${update.oldValue} → ${update.newValue}. ${update.reason}`;

              const { error } = await supabase
                .from('entities')
                .update({
                  brain: {
                    ...brain,
                    dm_notes: relationshipNote,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', update.entityId);

              if (error) throw error;
              results.push({
                id: update.id,
                success: true,
                type: 'relationship',
                message: `Updated ${update.entityName}'s relationship to ${update.newValue}`
              });
            }
            break;

          case 'quest':
            // Search for quest by name
            if (update.questName && campaignId) {
              const { data: quests } = await supabase
                .from('entities')
                .select('id, name')
                .eq('campaign_id', campaignId)
                .eq('entity_type', 'quest')
                .ilike('name', `%${update.questName}%`);

              if (quests && quests.length > 0) {
                const quest = quests[0];
                const { error } = await supabase
                  .from('entities')
                  .update({
                    status: update.newValue,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', quest.id);

                if (error) throw error;
                results.push({
                  id: update.id,
                  success: true,
                  type: 'quest',
                  message: `Marked quest "${quest.name}" as ${update.newValue}`
                });
              } else {
                results.push({
                  id: update.id,
                  success: false,
                  type: 'quest',
                  message: `Quest "${update.questName}" not found`
                });
              }
            }
            break;

          case 'item':
            // Log item - would integrate with full inventory system
            results.push({
              id: update.id,
              success: true,
              type: 'item',
              message: `Logged: ${update.entityName} ${update.action} ${update.itemName}`,
              note: 'Add to inventory manually if needed'
            });
            break;

          case 'location':
            // Log location change
            results.push({
              id: update.id,
              success: true,
              type: 'location',
              message: `Logged: ${update.entityName} moved to ${update.newValue}`,
              note: 'Location tracking logged'
            });
            break;

          default:
            results.push({
              id: update.id,
              success: false,
              message: `Unknown update type: ${update.type}`
            });
        }
      } catch (err: any) {
        console.error(`Failed to apply update ${update.id}:`, err);
        errors.push({
          id: update.id,
          error: err.message,
          type: update.type
        });
      }
    }

    // Update session with applied updates and XP
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        applied_updates: results,
        xp_awarded: xpAwarded || 0,
        status: 'completed',
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Failed to update session:', sessionError);
    }

    return NextResponse.json({
      success: true,
      applied: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length + errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Apply updates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
