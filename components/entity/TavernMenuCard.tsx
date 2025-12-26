'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beer, Bed, UtensilsCrossed, Sparkles } from 'lucide-react';

interface RoomType {
  type: string;
  price_per_night: number;
  description: string;
}

interface MenuItem {
  name: string;
  price: number;
  description: string;
}

interface TavernMenuCardProps {
  mechanics: {
    establishment_quality?: string;
    lodging?: {
      available: boolean;
      rooms: RoomType[];
    };
    menu?: {
      drinks: MenuItem[];
      meals: MenuItem[];
      specialty?: MenuItem;
    };
  };
}

export function TavernMenuCard({ mechanics }: TavernMenuCardProps): JSX.Element | null {
  const { establishment_quality, lodging, menu } = mechanics;

  // Format price in gp/sp/cp
  const formatPrice = (gp: number): string => {
    if (gp >= 1) return `${gp} gp`;
    if (gp >= 0.1) return `${Math.round(gp * 10)} sp`;
    return `${Math.round(gp * 100)} cp`;
  };

  const qualityColors: Record<string, string> = {
    poor: 'border-red-700 text-red-400',
    modest: 'border-slate-600 text-slate-400',
    comfortable: 'border-green-700 text-green-400',
    wealthy: 'border-amber-600 text-amber-400',
    aristocratic: 'border-purple-600 text-purple-400',
  };

  // Don't render if no tavern data
  if (!establishment_quality && !lodging?.rooms?.length && !menu?.drinks?.length && !menu?.meals?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Quality Badge */}
      {establishment_quality && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Establishment Quality:</span>
          <Badge
            variant="outline"
            className={`capitalize ${qualityColors[establishment_quality] || ''}`}
          >
            {establishment_quality}
          </Badge>
        </div>
      )}

      {/* Lodging */}
      {lodging?.available && lodging.rooms?.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-400">
              <Bed className="w-4 h-4" />
              Lodging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lodging.rooms.map((room, i) => (
              <div key={i} className="flex justify-between items-start p-2 bg-slate-900/50 rounded">
                <div>
                  <span className="font-medium text-slate-200">{room.type}</span>
                  <p className="text-xs text-slate-500">{room.description}</p>
                </div>
                <Badge variant="outline" className="text-amber-400 border-amber-700 whitespace-nowrap">
                  {formatPrice(room.price_per_night)}/night
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Menu - Drinks */}
      {menu?.drinks && menu.drinks.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-400">
              <Beer className="w-4 h-4" />
              Drinks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {menu.drinks.map((drink, i) => (
              <div key={i} className="flex justify-between items-start p-2 bg-slate-900/50 rounded">
                <div>
                  <span className="font-medium text-slate-200">{drink.name}</span>
                  <p className="text-xs text-slate-500 italic">{drink.description}</p>
                </div>
                <span className="text-amber-400 text-sm whitespace-nowrap">
                  {formatPrice(drink.price)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Menu - Meals */}
      {menu?.meals && menu.meals.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-400">
              <UtensilsCrossed className="w-4 h-4" />
              Food
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {menu.meals.map((meal, i) => (
              <div key={i} className="flex justify-between items-start p-2 bg-slate-900/50 rounded">
                <div>
                  <span className="font-medium text-slate-200">{meal.name}</span>
                  <p className="text-xs text-slate-500 italic">{meal.description}</p>
                </div>
                <span className="text-amber-400 text-sm whitespace-nowrap">
                  {formatPrice(meal.price)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Specialty Item */}
      {menu?.specialty && (
        <Card className="bg-gradient-to-r from-purple-900/30 to-slate-800/50 border-purple-700/50">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-purple-300">House Specialty</span>
                </div>
                <span className="text-lg font-semibold text-slate-100">{menu.specialty.name}</span>
                <p className="text-sm text-slate-400 italic mt-1">{menu.specialty.description}</p>
              </div>
              <Badge className="bg-purple-600 text-white">
                {formatPrice(menu.specialty.price)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
