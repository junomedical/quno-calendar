export const DEMO_DATASET_SCALES = [100, 1_000, 5_000, 20_000] as const;

type DatasetControlProps = {
  scale: number;
  onChange: (scale: number) => void;
};

export function DatasetControl({ scale, onChange }: DatasetControlProps) {
  return (
    <label>
      Dataset
      <select value={scale} onChange={(event) => onChange(Number(event.target.value))} data-testid="scale-select">
        {DEMO_DATASET_SCALES.map((value) => (
          <option value={value} key={value}>
            {value.toLocaleString()} / year
          </option>
        ))}
      </select>
    </label>
  );
}
