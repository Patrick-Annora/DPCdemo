export interface ShippingRecord {
  partNum: string;
  partDesc: string;
  releaseQty: number;
  shipDate: string;
  custId: number;
  customerName: string;
  custPart: string;
  carrier: string;
  shipFromBin: string;
}

export interface Customer {
  custId: number;
  name: string;
  shipments: number;
  units: number;
  uniqueParts: number;
  activeMonths: number;
  segment: 'automotive' | 'packaging' | 'medical' | 'icf' | 'other';
}

export interface MonthlyVolume {
  month: string;
  shipments: number;
  units: number;
  customers: number;
  parts: number;
  visibilityPct: number;
}

export interface PlatformMapping {
  code: string;
  vehicle: string;
  platform: string;
  customerPath: string;
  shipments: number;
  units: number;
  confidence: 'very-high' | 'high' | 'medium' | 'low';
  partCount: number;
}

export interface MaterialRequirement {
  materialPart: string;
  description: string;
  onHand: number;
  required: number;
  gap: number;
  uom: string;
  status: 'ok' | 'shortage';
  fromParts: number;
}

export interface InventoryItem {
  part: string;
  description: string;
  warehouse: string;
  onHand: number;
  uom: string;
  isNegative: boolean;
}

export interface MarketRisk {
  id: string;
  title: string;
  entity: string;
  riskLevel: 'critical' | 'elevated' | 'moderate' | 'low';
  impact: string;
  detail: string;
}

export interface DataRequest {
  id: string;
  title: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  unlocks: string;
  status: 'received' | 'partial' | 'not-received';
}

export interface KPI {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}
