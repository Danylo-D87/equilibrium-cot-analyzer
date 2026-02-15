// =====================================================
// Signal detection & shared enum types
// =====================================================

export type SignalType = 'BUY' | 'SELL' | null;

export interface Signal {
    name: string;
    type: SignalType;
    description?: string;
}

export type ReportType = 'legacy' | 'disagg' | 'tff';
export type Subtype = 'fo' | 'co';
