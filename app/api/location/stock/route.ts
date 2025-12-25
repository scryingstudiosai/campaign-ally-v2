import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stockShopInventory, markLocationAsShop, type ShopInventoryData } from '@/lib/forge/shop-stocker';
import { getSrdItemsForShopType, inferShopType } from '@/lib/srd/item-lookup';

interface StockRequestBody {
  locationId: string;
  campaignId: string;
  inventoryData?: ShopInventoryData;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId, campaignId, inventoryData }: StockRequestBody = await request.json();

    if (!locationId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing locationId or campaignId' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get the location entity
    const { data: location, error: locError } = await supabase
      .from('entities')
      .select('id, name, sub_type, mechanics')
      .eq('id', locationId)
      .eq('campaign_id', campaignId)
      .single();

    if (locError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const mechanics = (location.mechanics as Record<string, unknown>) || {};

    // Use provided inventory data or infer from location
    let shopType: string;
    let priceModifier: number;
    let specialty: string | undefined;
    let srdItems: string[];

    if (inventoryData) {
      // Use provided data (from auto-stock during forge commit)
      shopType = inventoryData.shop_type;
      priceModifier = inventoryData.price_modifier;
      specialty = inventoryData.specialty;
      srdItems = inventoryData.suggested_srd_stock;
    } else {
      // Infer from location (for manual "Stock Shelves" button)
      shopType = (mechanics.shop_type as string) || inferShopType(location);
      priceModifier = (mechanics.price_modifier as number) || 1.0;
      specialty = mechanics.specialty as string | undefined;
      srdItems = getSrdItemsForShopType(shopType);
    }

    // Stock the shop using our helper
    const result = await stockShopInventory(campaignId, locationId, {
      shop_type: shopType,
      price_modifier: priceModifier,
      specialty,
      suggested_srd_stock: srdItems,
      special_items: inventoryData?.special_items || [],
    });

    // Update location mechanics to mark as shop if not already
    if (!mechanics.is_shop) {
      await markLocationAsShop(locationId, shopType, priceModifier, specialty);
    }

    const itemsAdded = result.srdItems + result.specialItems;

    return NextResponse.json({
      success: true,
      shopType,
      itemsAdded,
      stocked: {
        srdItems: result.srdItems,
        specialItems: result.specialItems,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Stock shop error:', error);
    return NextResponse.json(
      { error: 'Failed to stock shop' },
      { status: 500 }
    );
  }
}
