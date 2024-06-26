import React from 'react';
import { useFormatDateInterval } from '@/hooks/useFormatDateInterval';
import { useNumber } from '@/hooks/useNumerFormatter';
import { useRechartDataModel } from '@/hooks/useRechartDataModel';
import { useVisibleSeries } from '@/hooks/useVisibleSeries';
import type { IChartData } from '@/trpc/client';
import { cn } from '@/utils/cn';
import { getChartColor, theme } from '@/utils/theme';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import type { IInterval } from '@openpanel/validation';

import { getYAxisWidth } from './chart-utils';
import { useChartContext } from './ChartProvider';
import { ReportChartTooltip } from './ReportChartTooltip';
import { ReportTable } from './ReportTable';
import { ResponsiveContainer } from './ResponsiveContainer';

interface ReportHistogramChartProps {
  data: IChartData;
}

function BarHover({ x, y, width, height, top, left, right, bottom }: any) {
  const bg = theme?.colors?.slate?.['200'] as string;
  return (
    <rect
      {...{ x, y, width, height, top, left, right, bottom }}
      rx="3"
      fill={bg}
      fillOpacity={0.5}
    />
  );
}

export function ReportHistogramChart({ data }: ReportHistogramChartProps) {
  const { editMode, previous, interval } = useChartContext();
  const formatDate = useFormatDateInterval(interval);
  const { series, setVisibleSeries } = useVisibleSeries(data);
  const rechartData = useRechartDataModel(series);
  const number = useNumber();

  return (
    <>
      <div className={cn(editMode && 'card p-4')}>
        <ResponsiveContainer>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={rechartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-def-200"
              />
              <Tooltip content={<ReportChartTooltip />} cursor={<BarHover />} />
              <XAxis
                fontSize={12}
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                axisLine={false}
                tickLine={false}
                width={getYAxisWidth(data.metrics.max)}
                allowDecimals={false}
                domain={[0, data.metrics.max]}
                tickFormatter={number.short}
              />
              {series.map((serie) => {
                return (
                  <React.Fragment key={serie.id}>
                    {previous && (
                      <Bar
                        key={`${serie.id}:prev`}
                        name={`${serie.id}:prev`}
                        dataKey={`${serie.id}:prev:count`}
                        fill={getChartColor(serie.index)}
                        fillOpacity={0.2}
                        radius={3}
                      />
                    )}
                    <Bar
                      key={serie.id}
                      name={serie.id}
                      dataKey={`${serie.id}:count`}
                      fill={getChartColor(serie.index)}
                      radius={3}
                    />
                  </React.Fragment>
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {editMode && (
        <ReportTable
          data={data}
          visibleSeries={series}
          setVisibleSeries={setVisibleSeries}
        />
      )}
    </>
  );
}
