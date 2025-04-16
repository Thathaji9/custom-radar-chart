import React, { useMemo } from "react";
import RadarGrid from "./RadarGrid";

interface RadarProps {
  data: any;
  height: number;
  width: number;
}

export const Radar = ({ data, width, height }: RadarProps) => {
  const axisConfig = useMemo(() => {
    const allKeys = new Set<string>();
    data?.forEach((item: any) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });
    return Array.from(allKeys).map((key) => ({ name: key }));
  }, [data]);

  return (
    <div
      style={{
        marginTop: '10rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <RadarGrid
        radius={Math.min(width, height) / 2}
        steps={5}
        data={data}
        axisConfig={axisConfig}
        sweepSpeed={0.0009}
        />
    </div>
  );
};
