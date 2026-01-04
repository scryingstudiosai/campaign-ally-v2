import JSZip from 'jszip';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  status?: string;
  soul?: Record<string, unknown>;
  brain?: Record<string, unknown>;
  mechanics?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

interface Session {
  id: string;
  session_number: number;
  name?: string;
  status: string;
  scheduled_date?: string;
  prep_notes?: unknown;
  play_log?: unknown[];
  ai_summary?: string;
  created_at: string;
}

interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description?: string;
}

interface CampaignData {
  campaign: Record<string, unknown>;
  entities: Entity[];
  sessions: Session[];
  relationships: Relationship[];
  inventory: unknown[];
  codex: unknown[];
}

// Generate JSON export
export function generateJSONExport(data: CampaignData): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    format: 'campaign-ally-backup',
    ...data,
  };
  return JSON.stringify(exportData, null, 2);
}

// Generate Markdown ZIP export
export async function generateMarkdownZip(data: CampaignData): Promise<Blob> {
  const zip = new JSZip();
  const { campaign, entities, sessions, relationships } = data;

  // Create entity lookup for wiki links
  const entityLookup = new Map(entities.map(e => [e.id, e.name]));

  // Helper: Escape regex special chars
  const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Helper: Convert entity references to [[WikiLinks]]
  const wikifyText = (text: string): string => {
    if (!text) return '';
    let result = text;
    entities.forEach(entity => {
      // Match entity name (case insensitive, whole word)
      const regex = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
      result = result.replace(regex, `[[${entity.name}]]`);
    });
    return result;
  };

  // Helper: Generate YAML frontmatter
  const frontmatter = (obj: Record<string, unknown>): string => {
    const lines = ['---'];
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          lines.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    });
    lines.push('---', '');
    return lines.join('\n');
  };

  // Helper: Sanitize filename
  const sanitizeFilename = (name: string): string => {
    return name.replace(/[<>:"/\\|?*]/g, '-').trim();
  };

  // Helper: Extract text from Tiptap JSON
  const extractTiptapText = (doc: unknown): string => {
    if (typeof doc === 'string') return doc;
    if (!doc || typeof doc !== 'object') return '';
    const content = (doc as { content?: unknown[] }).content;
    if (!content) return '';

    return content.map((node: unknown) => {
      if (!node || typeof node !== 'object') return '';
      const n = node as { type?: string; text?: string; content?: unknown[] };
      if (n.type === 'text') return n.text || '';
      if (n.content) return extractTiptapText(node);
      return '';
    }).join('\n');
  };

  // =====================
  // CAMPAIGN README
  // =====================
  const campaignName = campaign.name as string || 'Untitled Campaign';
  const readme = `# ${campaignName}

${campaign.description || 'A Campaign Ally campaign.'}

## Campaign Stats
- **Entities:** ${entities.length}
- **Sessions:** ${sessions.length}
- **Exported:** ${new Date().toLocaleDateString()}

## Folder Structure
- \`/NPCs\` - Non-player characters
- \`/Locations\` - Places in your world
- \`/Items\` - Equipment, artifacts, and treasures
- \`/Quests\` - Missions and storylines
- \`/Factions\` - Organizations and groups
- \`/Creatures\` - Monsters and beasts
- \`/Sessions\` - Session logs and summaries

---
*Exported from [Campaign Ally](https://campaignally.com)*
`;
  zip.file('README.md', readme);

  // =====================
  // ENTITIES BY TYPE
  // =====================
  const entityFolders: Record<string, string> = {
    npc: 'NPCs',
    location: 'Locations',
    item: 'Items',
    quest: 'Quests',
    faction: 'Factions',
    creature: 'Creatures',
  };

  // Create folders
  Object.values(entityFolders).forEach(folder => {
    zip.folder(folder);
  });
  zip.folder('Other');

  // Process entities
  entities.forEach(entity => {
    const folder = entityFolders[entity.entity_type] || 'Other';
    const filename = `${sanitizeFilename(entity.name)}.md`;

    // Extract data
    const soul = (entity.soul || {}) as Record<string, unknown>;
    const brain = (entity.brain || {}) as Record<string, unknown>;
    const mechanics = (entity.mechanics || {}) as Record<string, unknown>;

    // Build frontmatter based on entity type
    const meta: Record<string, unknown> = {
      type: entity.entity_type,
      created: entity.created_at?.split('T')[0],
    };

    if (entity.sub_type) meta.sub_type = entity.sub_type;
    if (entity.status) meta.status = entity.status;

    // Type-specific frontmatter
    if (entity.entity_type === 'npc') {
      if (soul.race) meta.race = soul.race;
      if (soul.occupation) meta.occupation = soul.occupation;
      if (mechanics.level) meta.level = mechanics.level;
      if (mechanics.class) meta.class = mechanics.class;
    } else if (entity.entity_type === 'location') {
      if (soul.location_type) meta.location_type = soul.location_type;
      if (soul.region) meta.region = soul.region;
    } else if (entity.entity_type === 'item') {
      if (mechanics.rarity) meta.rarity = mechanics.rarity;
      if (mechanics.item_type) meta.item_type = mechanics.item_type;
      if (mechanics.attunement) meta.attunement = mechanics.attunement;
    }

    // Build content
    let content = frontmatter(meta);
    content += `# ${entity.name}\n\n`;

    // Summary
    if (entity.summary) {
      content += `> ${entity.summary}\n\n`;
    }

    // Description
    if (soul.description) {
      content += `${wikifyText(String(soul.description))}\n\n`;
    }

    // Soul details (appearance, personality, etc.)
    if (soul.appearance) {
      content += `## Appearance\n${wikifyText(String(soul.appearance))}\n\n`;
    }
    if (soul.personality) {
      content += `## Personality\n${wikifyText(String(soul.personality))}\n\n`;
    }
    if (soul.read_aloud) {
      content += `## Read Aloud\n*${wikifyText(String(soul.read_aloud))}*\n\n`;
    }
    if (soul.background || soul.history) {
      content += `## Background\n${wikifyText(String(soul.background || soul.history))}\n\n`;
    }

    // Brain (DM notes)
    const hasBrainContent = brain.dm_notes || brain.secrets || brain.desire || brain.fear || brain.motivations || brain.hooks;
    if (hasBrainContent) {
      content += `## DM Notes\n`;
      if (brain.desire) content += `**Desire:** ${wikifyText(String(brain.desire))}\n\n`;
      if (brain.fear) content += `**Fear:** ${wikifyText(String(brain.fear))}\n\n`;
      if (brain.motivations) content += `**Motivations:** ${wikifyText(String(brain.motivations))}\n\n`;
      if (brain.secrets || brain.dm_notes) {
        content += `${wikifyText(String(brain.secrets || brain.dm_notes))}\n\n`;
      }
      if (brain.hooks) content += `### Plot Hooks\n${wikifyText(String(brain.hooks))}\n\n`;
    }

    // Mechanics (stats)
    const hasMechanics = Object.keys(mechanics).length > 0;
    if (hasMechanics) {
      content += `## Mechanics\n`;
      if (mechanics.ac) content += `- **AC:** ${mechanics.ac}\n`;
      if (mechanics.hp) content += `- **HP:** ${mechanics.hp}\n`;
      if (mechanics.stats) content += `- **Stats:** ${JSON.stringify(mechanics.stats)}\n`;
      if (mechanics.abilities) content += `- **Abilities:** ${mechanics.abilities}\n`;
      if (mechanics.properties) content += `- **Properties:** ${mechanics.properties}\n`;
      content += '\n';
    }

    // Relationships
    const entityRelations = relationships.filter(
      r => r.source_entity_id === entity.id || r.target_entity_id === entity.id
    );
    if (entityRelations.length > 0) {
      content += `## Relationships\n`;
      entityRelations.forEach(rel => {
        const otherId = rel.source_entity_id === entity.id
          ? rel.target_entity_id
          : rel.source_entity_id;
        const otherName = entityLookup.get(otherId) || 'Unknown';
        content += `- [[${otherName}]] - ${rel.relationship_type}`;
        if (rel.description) content += `: ${rel.description}`;
        content += '\n';
      });
      content += '\n';
    }

    zip.file(`${folder}/${filename}`, content);
  });

  // =====================
  // SESSIONS
  // =====================
  const sessionsFolder = zip.folder('Sessions');

  [...sessions]
    .sort((a, b) => a.session_number - b.session_number)
    .forEach(session => {
      const sessionName = session.name || 'Untitled';
      const filename = `Session ${session.session_number} - ${sanitizeFilename(sessionName)}.md`;

      const meta: Record<string, unknown> = {
        session: session.session_number,
        status: session.status,
      };
      if (session.scheduled_date) {
        meta.date = session.scheduled_date.split('T')[0];
      }

      let content = frontmatter(meta);
      content += `# Session ${session.session_number}: ${sessionName}\n\n`;

      // AI Summary
      if (session.ai_summary) {
        content += `## Summary\n${wikifyText(session.ai_summary)}\n\n`;
      }

      // Prep Notes
      if (session.prep_notes) {
        content += `## Prep Notes\n`;
        if (typeof session.prep_notes === 'string') {
          content += `${wikifyText(session.prep_notes)}\n\n`;
        } else {
          // Handle Tiptap JSON - extract text
          content += `${extractTiptapText(session.prep_notes)}\n\n`;
        }
      }

      // Play Log
      if (session.play_log && Array.isArray(session.play_log)) {
        content += `## Session Log\n`;
        session.play_log.forEach((entry: unknown) => {
          if (!entry || typeof entry !== 'object') return;
          const e = entry as { timestamp?: string; content?: string; text?: string };
          const time = e.timestamp ? `[${e.timestamp}] ` : '';
          content += `- ${time}${e.content || e.text || JSON.stringify(entry)}\n`;
        });
        content += '\n';
      }

      sessionsFolder?.file(filename, content);
    });

  // =====================
  // CAMPAIGN INDEX
  // =====================
  let indexContent = `# ${campaignName} - Index\n\n`;

  // Group entities by type
  Object.entries(entityFolders).forEach(([type, folder]) => {
    const typeEntities = entities.filter(e => e.entity_type === type);
    if (typeEntities.length > 0) {
      indexContent += `## ${folder}\n`;
      [...typeEntities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(e => {
          indexContent += `- [[${e.name}]]\n`;
        });
      indexContent += '\n';
    }
  });

  // Sessions index
  if (sessions.length > 0) {
    indexContent += `## Sessions\n`;
    [...sessions]
      .sort((a, b) => a.session_number - b.session_number)
      .forEach(s => {
        const sessionName = s.name || 'Untitled';
        indexContent += `- [[Session ${s.session_number} - ${sessionName}]]\n`;
      });
  }

  zip.file('INDEX.md', indexContent);

  // Generate ZIP
  return await zip.generateAsync({ type: 'blob' });
}
