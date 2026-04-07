export interface CompanyInfo {
  name: string;
  period: string;
  currency: string;
  reportType: string;
}

export interface AuditOpinion {
  type: '無保留意見' | '保留意見' | '否定意見' | '無法表示意見' | '不確定';
  keyAuditMatters: string[];
  goingConcern: boolean;
  goingConcernDetails: string;
}

export interface ProfitabilityRatios {
  grossMargin: number | null;
  ebitMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  roa: number | null;
  roe: number | null;
  roic: number | null;
}

export interface GrowthRatios {
  revenueGrowth: number | null;
}

export interface LiquidityRatios {
  current: number | null;
  quick: number | null;
}

export interface LeverageRatios {
  debtRatio: number | null;
  netDebtEbitda: number | null;
  interestCoverage: number | null;
}

export interface EfficiencyRatios {
  dso: number | null;
  dio: number | null;
  dpo: number | null;
  ccc: number | null;
}

export interface CashFlowRatios {
  cfoToNetIncome: number | null;
  fcff: number | null;
}

export interface FinancialRatios {
  profitability: ProfitabilityRatios;
  growth: GrowthRatios;
  liquidity: LiquidityRatios;
  leverage: LeverageRatios;
  efficiency: EfficiencyRatios;
  cashFlow: CashFlowRatios;
}

export interface DuPontAnalysis {
  netMargin: number | null;
  assetTurnover: number | null;
  equityMultiplier: number | null;
  roe: number | null;
}

export type RedFlagSeverity = 'high' | 'medium' | 'low';

export interface RedFlag {
  severity: RedFlagSeverity;
  category: string;
  description: string;
  evidence: string;
}

export interface RiskScores {
  beneishMScore: number | null;
  beneishInterpretation: string;
  altmanZScore: number | null;
  altmanInterpretation: string;
  piotroskiFScore: number | null;
  piotroskiInterpretation: string;
}

export interface InvestmentScenario {
  normalizedEbit: number | null;
  normalizedEbitda: number | null;
  netDebt: number | null;
  cfoQuality: string;
  valuationRange: string;
  signals: string[];
  recommendation: string;
}

export interface CreditScenario {
  interestCoverageNormalized: number | null;
  netDebtEbitda: number | null;
  cashFlowCoverage: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  recommendation: string;
}

export interface FinancialAnalysis {
  companyInfo: CompanyInfo;
  auditOpinion: AuditOpinion;
  keyFinancials: {
    revenue: number | null;
    revenuePrior: number | null;
    grossProfit: number | null;
    ebit: number | null;
    ebitda: number | null;
    netIncome: number | null;
    cfo: number | null;
    capex: number | null;
    totalAssets: number | null;
    totalEquity: number | null;
    interestBearingDebt: number | null;
    cash: number | null;
    interestExpense: number | null;
  };
  ratios: FinancialRatios;
  dupontAnalysis: DuPontAnalysis;
  redFlags: RedFlag[];
  riskScores: RiskScores;
  scenarios: {
    investment: InvestmentScenario;
    credit: CreditScenario;
  };
  executiveSummary: string;
  detailedAnalysis: string;
}

export interface AnalyzeRequest {
  file: File;
  apiKey: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: FinancialAnalysis;
  error?: string;
}
