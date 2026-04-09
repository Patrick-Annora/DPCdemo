import type { MarketRisk } from '../lib/types';

export const marketRisks: MarketRisk[] = [
  {
    id: 'yfai',
    title: 'YFAI US Footprint Shrinking',
    entity: 'YFAI Frenchtown (11% of shipments)',
    riskLevel: 'elevated',
    impact: '192 layoffs Romulus MI, 444 jobs lost Riverside KS. Chinese-owned — geopolitical risk.',
    detail: 'Programs flowing through consolidating YFAI plants may need contingency plans.',
  },
  {
    id: 'hanwha-tariff',
    title: 'EPP Resin Tariff (15%)',
    entity: 'Hanwha Advanced Materials (Korea)',
    riskLevel: 'critical',
    impact: 'Direct raw material cost increase on highest-value input. EPP resin was duty-free under KORUS FTA.',
    detail: 'Check contractual raw material cost adjustment clauses. Explore domestic EPP alternatives (JSP, BASF).',
  },
  {
    id: 'gm-ev',
    title: 'GM EV Program Pullback',
    entity: 'GM/NAO (33% of shipments)',
    riskLevel: 'moderate',
    impact: '$4.2M program already lost. GM took $6-7.1B in EV writedowns. Factory Zero idled Mar-Apr 2026.',
    detail: 'Already realized. GM ICE programs remain strong. Reshoring crossover production = new opportunity.',
  },
  {
    id: 'slate',
    title: 'Slate Automotive (New Prospect)',
    entity: 'Slate Auto (Bezos-backed EV startup)',
    riskLevel: 'low',
    impact: '$600M+ raised, 150K+ reservations, targeting late 2026 production in Warsaw, IN (~600mi from Nixa).',
    detail: 'High reward if realized. Do not invest capacity ahead of confirmed orders. No EV startup has hit initial timeline.',
  },
  {
    id: 'na-production',
    title: 'NA Production Decline',
    entity: 'Industry-wide',
    riskLevel: 'moderate',
    impact: 'S&P Global forecasts 4.5-7% decline in 2026 NA production due to tariffs.',
    detail: 'On DPC revenue base (~$16M), represents $720K-$1.1M potential volume erosion.',
  },
  {
    id: 'magna-credit',
    title: 'Magna Credit Outlook Negative',
    entity: 'Magna International (11% via Magna Seating)',
    riskLevel: 'low',
    impact: 'S&P revised credit outlook to NEGATIVE. Not in distress but under margin pressure.',
    detail: 'Watch for cost-cutting that could pressure tier 2 pricing.',
  },
];

export interface DataCenterProject {
  name: string;
  location: string;
  investment: string;
  size: string;
  distance: string;
}

export const dataCenterProjects: DataCenterProject[] = [
  { name: 'Google "Project Mica"', location: 'KC Northland', investment: 'Part of $100B commitment', size: '1.56M sq ft, 700MW', distance: '~180 mi from Nixa' },
  { name: 'Nebius AI Campus', location: 'Independence, MO', investment: 'Undisclosed (massive)', size: '2.5M sq ft, 800MW-1.1GW', distance: '~185 mi from Nixa' },
  { name: 'Metrobloks', location: 'Liberty, MO', investment: '$1.4 billion', size: '568K sq ft', distance: '~180 mi from Nixa' },
  { name: 'Meta', location: 'Kansas City', investment: 'Undisclosed', size: 'AI-optimized facility', distance: '~180 mi from Nixa' },
  { name: 'Cloverleaf Infrastructure', location: 'Troy, MO', investment: 'Undisclosed', size: '1M+ sq ft, 500MW', distance: '~220 mi from Nixa' },
];

export interface TariffData {
  section232Auto: number;
  koreaReciprocal: number;
  steelTariff: number;
  aluminumTariff: number;
  naProductionDecline: string;
  dpcRevenueAtRisk: string;
}

export const tariffData: TariffData = {
  section232Auto: 25,
  koreaReciprocal: 15,
  steelTariff: 25,
  aluminumTariff: 10,
  naProductionDecline: '4.5-7%',
  dpcRevenueAtRisk: '$720K-$1.1M',
};
