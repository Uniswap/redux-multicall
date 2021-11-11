import type { MulticallActions } from './slice'

// The shared settings and dynamically created utilities
// required for the hooks and components
export interface MulticallContext {
  reducerPath: string
  actions: MulticallActions
}
