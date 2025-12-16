export type Conversion = {
  key: string;
  name: string;
  value: number;
  unit: string;

  size?: number;        // share 0..1
  share?: number;       // share 0..1
  displayValue?: number;
  displayUnit?: string;
};