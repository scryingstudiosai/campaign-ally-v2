import { Package, Coins, Sword, Scroll } from 'lucide-react';

interface InventoryPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  // We'll fetch inventory data in Sprint 2

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-white">Inventory</h2>
        <div className="flex items-center gap-2 text-amber-400">
          <Coins className="w-4 h-4" />
          <span className="font-display">0 GP</span>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="space-y-4">
        {/* Weapons Section */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Sword className="w-4 h-4 text-red-400" />
            <h3 className="text-sm text-slate-400 uppercase tracking-wider">Weapons</h3>
          </div>
          <p className="text-slate-500 text-sm italic">No weapons equipped</p>
        </div>

        {/* Items Section */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm text-slate-400 uppercase tracking-wider">Items</h3>
          </div>
          <p className="text-slate-500 text-sm italic">Your bag is empty</p>
        </div>

        {/* Scrolls & Spells Section */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Scroll className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm text-slate-400 uppercase tracking-wider">Scrolls & Spells</h3>
          </div>
          <p className="text-slate-500 text-sm italic">No scrolls or spell components</p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-slate-900/50 px-4 py-2 rounded-full">
          <Package className="w-4 h-4" />
          Inventory management coming in Sprint 2
        </div>
      </div>
    </div>
  );
}
