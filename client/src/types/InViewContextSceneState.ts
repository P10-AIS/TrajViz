import type { InViewContextType } from "../contexts/InViewContext";
type StorageKey =
  | 'modelPredictionsInView'

export type InViewSnapshot = Pick<InViewContextType, StorageKey>;
