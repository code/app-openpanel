import { createContext, memo, useContext, useMemo } from 'react';
import type { IChartInput } from '@/types';

export interface ChartContextType extends IChartInput {
  editMode?: boolean;
  hideID?: boolean;
  onClick?: (item: any) => void;
}

type ChartProviderProps = {
  children: React.ReactNode;
} & ChartContextType;

const ChartContext = createContext<ChartContextType | null>({
  events: [],
  breakdowns: [],
  chartType: 'linear',
  lineType: 'monotone',
  interval: 'day',
  name: '',
  range: '7d',
  metric: 'sum',
  previous: false,
  projectId: '',
});

export function ChartProvider({
  children,
  editMode,
  previous,
  hideID,
  ...props
}: ChartProviderProps) {
  return (
    <ChartContext.Provider
      value={useMemo(
        () => ({
          editMode: editMode ?? false,
          previous: previous ?? false,
          hideID: hideID ?? false,
          ...props,
        }),
        [editMode, previous, hideID, props]
      )}
    >
      {children}
    </ChartContext.Provider>
  );
}

export function withChartProivder<ComponentProps>(
  WrappedComponent: React.FC<ComponentProps>
) {
  const WithChartProvider = (props: ComponentProps & ChartContextType) => {
    return (
      <ChartProvider {...props}>
        <WrappedComponent {...props} />
      </ChartProvider>
    );
  };

  WithChartProvider.displayName = `WithChartProvider(${
    WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'
  })`;

  return memo(WithChartProvider);
}

export function useChartContext() {
  return useContext(ChartContext)!;
}
