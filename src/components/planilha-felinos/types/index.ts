export interface CalcInfo {
  type: 'mg_per_kg' | 'fixed' | 'per_m2' | 'topical' | 'reference_only' | 'pending';
  unit?: 'mg' | 'mcg';
  minCoef?: number;
  maxCoef?: number;
  displayText?: string;
}

export interface Drug {
  id: string;
  name: string;
  pharmClass: string;
  indication: string;
  doseRef: string;
  interval: string;
  route: string;
  maxDose: string;
  maxDuration: string;
  contraindications: string;
  observations: string;
  pendingValidation: boolean;
  subcategory: string | null;
  calc: CalcInfo;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  drugs: Drug[];
}

export interface AppData {
  generatedAt: string;
  source: string;
  stats: { categories: number; drugs: number; pendingValidation: number };
  categories: Category[];
}
