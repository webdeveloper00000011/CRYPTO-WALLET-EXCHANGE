import React, { useMemo, useState } from 'react';
import { CurrencyCode } from '../types/wallet';
import { formatFiat } from '../utils/formatters';

type Timeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';

interface PortfolioChartProps {
  currentTotalUsd: number;
  currency: CurrencyCode;
  hideBalances: boolean;
}

const TIMEFRAME_DELTAS: Record<Timeframe, { pct: number; multipliers: number[]; labels: string[] }> = {
  '1D': {
    pct: 3.42,
    multipliers: [0.967, 0.971, 0.969, 0.974, 0.981, 0.978, 0.986, 0.991, 0.989, 0.996, 1.0],
    labels: ['00:00', '02:30', '05:00', '07:30', '10:00', '12:30', '15:00', '17:30', '19:30', '21:30', 'Now'],
  },
  '1W': {
    pct: 8.15,
    multipliers: [0.924, 0.935, 0.928, 0.946, 0.958, 0.951, 0.972, 0.983, 0.979, 0.994, 1.0],
    labels: ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', '18h ago', '12h ago', '6h ago', 'Now'],
  },
  '1M': {
    pct: 14.8,
    multipliers: [0.871, 0.885, 0.879, 0.904, 0.918, 0.912, 0.938, 0.952, 0.969, 0.988, 1.0],
    labels: ['30d', '27d', '24d', '21d', '18d', '15d', '12d', '9d', '6d', '3d', 'Today'],
  },
  '1Y': {
    pct: 64.2,
    multipliers: [0.609, 0.642, 0.678, 0.651, 0.714, 0.768, 0.742, 0.825, 0.884, 0.946, 1.0],
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Oct', 'Nov'],
  },
  ALL: {
    pct: 142.6,
    multipliers: [0.412, 0.455, 0.438, 0.521, 0.614, 0.589, 0.692, 0.774, 0.851, 0.928, 1.0],
    labels: ['2022', 'Q3 22', 'Q1 23', 'Q3 23', 'Q1 24', 'Q3 24', 'Q1 25', 'Q3 25', 'Q1 26', 'Q3 26', 'Now'],
  },
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  currentTotalUsd,
  currency,
  hideBalances,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1W');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => {
    const config = TIMEFRAME_DELTAS[timeframe];
    return config.multipliers.map((mult, idx) => ({
      value: currentTotalUsd * mult,
      label: config.labels[idx],
    }));
  }, [currentTotalUsd, timeframe]);

  const width = 640;
  const height = 164;
  const padX = 6;
  const padY = 14;

  const { linePath, areaPath, points } = useMemo(() => {
    const vals = series.map((s) => s.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;

    const pts = series.map((s, i) => {
      const x = padX + (i / (series.length - 1)) * (width - padX * 2);
      const y = height - padY - ((s.value - min) / range) * (height - padY * 2);
      return { x, y, ...s };
    });

    const dLine = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const dArea = `${dLine} L ${pts[pts.length - 1].x.toFixed(1)} ${height} L ${pts[0].x.toFixed(1)} ${height} Z`;

    return { linePath: dLine, areaPath: dArea, points: pts };
  }, [series]);

  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];
  const pctChange = TIMEFRAME_DELTAS[timeframe].pct;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {formatFiat(activePoint?.value ?? currentTotalUsd, currency, hideBalances)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{activePoint?.label}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
            +{pctChange.toFixed(2)}% ({timeframe})
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-lg">
          {(['1D', '1W', '1M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                timeframe === tf
                  ? 'bg-white dark:bg-[#0B0F17] text-[#0500FF] dark:text-[#7AA2FF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative w-full h-40 select-none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          aria-label="Portfolio value history chart"
        >
          <defs>
            <linearGradient id="portfolio-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0500FF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0500FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#portfolio-area-grad)" />
          <path
            d={linePath}
            fill="none"
            stroke="#0500FF"
            className="dark:stroke-[#5B8DEF]"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverIdx !== null && activePoint && (
            <g>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={height}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                className="fill-[#0500FF] dark:fill-[#5B8DEF] stroke-white dark:stroke-[#131924]"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        <div className="absolute inset-0 grid grid-cols-11">
          {points.map((pt, idx) => (
            <div
              key={pt.label}
              onMouseEnter={() => setHoverIdx(idx)}
              onFocus={() => setHoverIdx(idx)}
              className="h-full cursor-crosshair"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
