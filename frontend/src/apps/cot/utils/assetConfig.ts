/**
 * Asset configuration: maps CFTC market codes → sector, primary report, and group assignments.
 *
 * For each market the analytics (screener + dashboard) pull data from the **primaryReport**
 * using specGroup (smart‑money speculators) and commGroup (commercial hedgers).
 * The user may still switch to other report types in the Report Table page.
 */

import type { ReportType } from '../types/signals';

// ─── Types ───────────────────────────────────────────────────

export type Sector =
    | 'FX'
    | 'Metals'
    | 'Energy'
    | 'Indices'
    | 'Bonds'
    | 'Grains'
    | 'Softs'
    | 'Livestock'
    | 'Crypto'
    | 'Other';

export interface AssetConfig {
    name: string;
    sector: Sector;
    /** Which COT report is "primary" for analytics. */
    primaryReport: ReportType;
    /** Group key used as the speculative / smart‑money lens. */
    specGroup: string;
    /** Group key used as the commercial / hedger lens. null = absent (e.g. Nano perps). */
    commGroup: string | null;
    /** Yahoo Finance ticker symbol, or null when no price chart available. */
    yahoo: string | null;
}

// ─── Sector metadata ─────────────────────────────────────────

export interface SectorMeta {
    key: Sector;
    label: string;
    /** Backend category key used in screener filtering. */
    backendKey: string;
}

export const SECTORS: readonly SectorMeta[] = [
    { key: 'FX', label: 'FX', backendKey: 'currencies' },
    { key: 'Metals', label: 'Metals', backendKey: 'metals' },
    { key: 'Energy', label: 'Energy', backendKey: 'energy' },
    { key: 'Indices', label: 'Indices', backendKey: 'indices' },
    { key: 'Bonds', label: 'Rates', backendKey: 'rates' },
    { key: 'Grains', label: 'Grains', backendKey: 'grains' },
    { key: 'Softs', label: 'Softs', backendKey: 'softs' },
    { key: 'Livestock', label: 'Livestock', backendKey: 'livestock' },
    { key: 'Crypto', label: 'Crypto', backendKey: 'crypto' },
    { key: 'Other', label: 'Other', backendKey: 'other' },
] as const;

// ─── Full asset registry ─────────────────────────────────────

export const ASSET_CONFIG: Record<string, AssetConfig> = {

    // ═══════════════ FX ═══════════════
    '099741': { name: 'Euro FX', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6E=F' },
    '096742': { name: 'British Pound', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6B=F' },
    '097741': { name: 'Japanese Yen', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6J=F' },
    '090741': { name: 'Canadian Dollar', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6C=F' },
    '092741': { name: 'Swiss Franc', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6S=F' },
    '232741': { name: 'Australian Dollar', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6A=F' },
    '095741': { name: 'Mexican Peso', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6M=F' },
    '102741': { name: 'Brazilian Real', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6L=F' },
    '112741': { name: 'New Zealand Dollar', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: '6N=F' },
    '089741': { name: 'Russian Ruble', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
    '082744': { name: 'Chinese Yuan (CNH)', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
    '098662': { name: 'USD Index', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'DX=F' },
    '299741': { name: 'Euro/British Pound', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },
    '399741': { name: 'Euro/Japanese Yen', sector: 'FX', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: null },

    // ═══════════════ Metals ═══════════════
    '088691': { name: 'Gold', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'GC=F' },
    '084691': { name: 'Silver', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SI=F' },
    '085692': { name: 'Copper', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HG=F' },
    '076651': { name: 'Platinum', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'PL=F' },
    '075651': { name: 'Palladium', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'PA=F' },
    '191691': { name: 'Aluminum', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ALI=F' },
    '088695': { name: 'Micro Gold', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'MGC=F' },
    '084695': { name: 'Micro Silver', sector: 'Metals', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SIL=F' },

    // ═══════════════ Energy ═══════════════
    '067651': { name: 'Crude Oil WTI', sector: 'Energy', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CL=F' },
    '023655': { name: 'Natural Gas', sector: 'Energy', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'NG=F' },
    '022651': { name: 'Heating Oil', sector: 'Energy', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HO=F' },
    '111416': { name: 'RBOB Gasoline', sector: 'Energy', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'RB=F' },
    '025651': { name: 'Ethanol', sector: 'Energy', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },

    // ═══════════════ Equity Indices ═══════════════
    '13874A': { name: 'E-Mini S&P 500', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'ES=F' },
    '13874+': { name: 'S&P 500 Consolidated', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'ES=F' },
    '13874U': { name: 'Micro E-Mini S&P', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MES=F' },
    '209742': { name: 'E-Mini Nasdaq 100', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NQ=F' },
    '20974+': { name: 'Nasdaq 100 Consol.', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NQ=F' },
    '209747': { name: 'Micro Nasdaq 100', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MNQ=F' },
    '124603': { name: 'DJIA x $5', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'YM=F' },
    '12460+': { name: 'DJIA Consolidated', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'YM=F' },
    '124608': { name: 'Micro DJIA', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'MYM=F' },
    '239742': { name: 'E-Mini Russell 2000', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'RTY=F' },
    '1170E1': { name: 'VIX Futures', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'VX=F' },
    '240741': { name: 'Nikkei Stock Avg', sector: 'Indices', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g2', yahoo: 'NIY=F' },

    // ═══════════════ Bonds / Rates ═══════════════
    '042601': { name: '2-Year Treasury', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZT=F' },
    '044601': { name: '5-Year Treasury', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZF=F' },
    '043602': { name: '10-Year Treasury', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZN=F' },
    '020601': { name: '30-Year Treasury', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZB=F' },
    '043607': { name: 'Ultra 10-Year', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'TN=F' },
    '020604': { name: 'Ultra T-Bond', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'UB=F' },
    '134741': { name: 'SOFR 3-Month', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'SR3=F' },
    '045601': { name: 'Fed Funds 30-Day', sector: 'Bonds', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZQ=F' },

    // ═══════════════ Grains ═══════════════
    '002602': { name: 'Corn', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZC=F' },
    '005602': { name: 'Soybeans', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZS=F' },
    '001602': { name: 'Wheat SRW', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZW=F' },
    '001612': { name: 'Wheat HRW (KC)', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'KE=F' },
    '001626': { name: 'Wheat HRSpring', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'MWE=F' },
    '026603': { name: 'Soybean Meal', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZM=F' },
    '007601': { name: 'Soybean Oil', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZL=F' },
    '004603': { name: 'Oats', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZO=F' },
    '039601': { name: 'Rough Rice', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'ZR=F' },
    '135731': { name: 'Canola', sector: 'Grains', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: null },

    // ═══════════════ Softs ═══════════════
    '080732': { name: 'Sugar #11', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'SB=F' },
    '083731': { name: 'Coffee C', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'KC=F' },
    '073732': { name: 'Cocoa', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CC=F' },
    '033661': { name: 'Cotton No. 2', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'CT=F' },
    '040701': { name: 'Frozen OJ', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'OJ=F' },
    '058644': { name: 'Lumber', sector: 'Softs', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'LBS=F' },

    // ═══════════════ Livestock ═══════════════
    '057642': { name: 'Live Cattle', sector: 'Livestock', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'LE=F' },
    '054642': { name: 'Lean Hogs', sector: 'Livestock', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'HE=F' },
    '061641': { name: 'Feeder Cattle', sector: 'Livestock', primaryReport: 'disagg', specGroup: 'g3', commGroup: 'g1', yahoo: 'GF=F' },

    // ═══════════════ Crypto — CME (TFF) ═══════════════
    '133741': { name: 'Bitcoin (CME)', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: 'BTC=F' },
    '133742': { name: 'Micro Bitcoin', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: 'MBT=F' },
    '146021': { name: 'Ether', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: 'ETH=F' },
    '146022': { name: 'Micro Ether', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: null },
    '176740': { name: 'XRP', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: null },
    '177741': { name: 'SOL', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: null },

    // ═══════════════ Crypto — FREX Nano Perps (Coinbase, TFF) ═══════════════
    '133LM4': { name: 'Nano BTC Perp Style', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: null },
    '146LM3': { name: 'Nano Ether Perp Style', sector: 'Crypto', primaryReport: 'tff', specGroup: 'g3', commGroup: 'g4', yahoo: null },

    // ═══════════════ Crypto — FREX Nano Perps (LMX, Legacy) ═══════════════
    '133LM1': { name: 'Nano BTC Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '146LM1': { name: 'Nano Ether Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '177LM1': { name: 'Nano SOL Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '176LM1': { name: 'Nano XRP Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '174LM1': { name: 'Dogecoin Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '178LM1': { name: 'Litecoin Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '179LM1': { name: 'Chainlink Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '181LM1': { name: 'Avalanche Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
    '182LM1': { name: 'Cardano Perp', sector: 'Crypto', primaryReport: 'legacy', specGroup: 'g1', commGroup: null, yahoo: null },
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Look up config for a given CFTC market code.
 * Falls back to a generic "Other" config when the code is not in the registry.
 */
export function getAssetConfig(code: string): AssetConfig {
    return (
        ASSET_CONFIG[code] ?? {
            name: code,
            sector: 'Other' as Sector,
            primaryReport: 'legacy' as ReportType,
            specGroup: 'g1',
            commGroup: 'g2',
            yahoo: null,
        }
    );
}

/** Map backend category string → Sector key. */
const _backendToSector: Record<string, Sector> = Object.fromEntries(
    SECTORS.map((s) => [s.backendKey, s.key]),
) as Record<string, Sector>;

export function backendCategoryToSector(backendCategory: string): Sector {
    return _backendToSector[backendCategory] ?? 'Other';
}

/** Get the human-readable group name for a spec/comm group in a given report type. */
export function getGroupLabel(reportType: ReportType, groupKey: string): string {
    const labels: Record<string, Record<string, string>> = {
        tff: {
            g1: 'Dealer/Intermediary',
            g2: 'Asset Manager',
            g3: 'Leveraged Funds',
            g4: 'Other Reportables',
            g5: 'Non-Reportable',
        },
        disagg: {
            g1: 'Producer/Merchant',
            g2: 'Swap Dealers',
            g3: 'Managed Money',
            g4: 'Other Reportables',
            g5: 'Non-Reportable',
        },
        legacy: {
            g1: 'Non-Commercial',
            g2: 'Commercials',
            g3: 'Small Traders',
        },
    };
    return labels[reportType]?.[groupKey] ?? groupKey;
}
