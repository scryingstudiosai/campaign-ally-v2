import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateJSONExport, generateMarkdownZip } from '@/lib/services/export-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const format = req.nextUrl.searchParams.get('format') || 'json';

  // Verify ownership
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Fetch all campaign data in parallel
  const [
    { data: entities },
    { data: relationships },
    { data: sessions },
    { data: inventory },
    { data: codex },
  ] = await Promise.all([
    supabase.from('entities').select('*').eq('campaign_id', campaignId).is('deleted_at', null),
    supabase.from('relationships').select('*').eq('campaign_id', campaignId),
    supabase.from('sessions').select('*').eq('campaign_id', campaignId).is('deleted_at', null),
    supabase.from('inventory_instances').select('*').eq('campaign_id', campaignId),
    supabase.from('campaign_codex').select('*').eq('campaign_id', campaignId),
  ]);

  const campaignData = {
    campaign,
    entities: entities || [],
    sessions: sessions || [],
    relationships: relationships || [],
    inventory: inventory || [],
    codex: codex || [],
  };

  // Sanitize filename
  const safeName = (campaign.name as string).replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    if (format === 'markdown') {
      // Generate Markdown ZIP
      const zipBlob = await generateMarkdownZip(campaignData);
      const buffer = await zipBlob.arrayBuffer();

      // Log export (ignore errors if table doesn't exist)
      try {
        await supabase.from('export_logs').insert({
          campaign_id: campaignId,
          user_id: user.id,
          export_type: 'markdown_zip',
          file_size: buffer.byteLength,
        });
      } catch {
        // Table may not exist yet
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${safeName}_${dateStr}.zip"`,
        },
      });
    } else {
      // Generate JSON
      const jsonContent = generateJSONExport(campaignData);

      // Log export (ignore errors if table doesn't exist)
      try {
        await supabase.from('export_logs').insert({
          campaign_id: campaignId,
          user_id: user.id,
          export_type: 'json_backup',
          file_size: jsonContent.length,
        });
      } catch {
        // Table may not exist yet
      }

      return new NextResponse(jsonContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${safeName}_backup_${dateStr}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
