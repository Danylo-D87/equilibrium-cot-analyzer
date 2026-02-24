/**
 * Range selector pills: Display Range + Rolling Lookback.
 * Reads/writes from useCotStore. Reusable across Dashboard, Report, etc.
 */

import { useCotStore } from '../../store/useCotStore';
import { DISPLAY_RANGES } from '../../types/dashboard';

export default function RangeSelector() {
    const { displayRange, setDisplayRange } = useCotStore();

    return (
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.08em]">
            <span className="text-white/30 mr-1">Range</span>
            <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.04] rounded-full p-0.5">
                {DISPLAY_RANGES.map((r) => (
                    <button
                        key={r.key}
                        onClick={() => setDisplayRange(r.key)}
                        className={`px-2 py-0.5 font-medium transition-all duration-200 rounded-full ${
                            displayRange === r.key
                                ? 'text-white/90 bg-white/[0.08]'
                                : 'text-white/30 hover:text-white/50'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
