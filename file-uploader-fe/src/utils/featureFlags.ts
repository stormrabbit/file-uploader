// Feature flags for controlling functionality
export const FEATURE_FLAGS = {
  PAGINATION_ENABLED: 'pagination_enabled',
  INFINITE_SCROLL_ENABLED: 'infinite_scroll_enabled'
}

// Default feature flag values
const DEFAULT_FLAGS = {
  [FEATURE_FLAGS.PAGINATION_ENABLED]: true,
  [FEATURE_FLAGS.INFINITE_SCROLL_ENABLED]: true
}

// Get feature flag value from localStorage or default
export function getFeatureFlag(flag: keyof typeof DEFAULT_FLAGS): boolean {
  try {
    const stored = localStorage.getItem(`feature_flag_${flag}`)
    if (stored !== null) {
      return stored === 'true'
    }
    return DEFAULT_FLAGS[flag]
  } catch {
    return DEFAULT_FLAGS[flag]
  }
}

// Set feature flag value
export function setFeatureFlag(flag: keyof typeof DEFAULT_FLAGS, value: boolean): void {
  try {
    localStorage.setItem(`feature_flag_${flag}`, String(value))
  } catch {
    // Ignore localStorage errors
  }
}

// Check if pagination is enabled
export function isPaginationEnabled(): boolean {
  return getFeatureFlag(FEATURE_FLAGS.PAGINATION_ENABLED)
}

// Check if infinite scroll is enabled
export function isInfiniteScrollEnabled(): boolean {
  return getFeatureFlag(FEATURE_FLAGS.INFINITE_SCROLL_ENABLED)
}

// Enable/disable pagination
export function setPaginationEnabled(enabled: boolean): void {
  setFeatureFlag(FEATURE_FLAGS.PAGINATION_ENABLED, enabled)
}

// Enable/disable infinite scroll
export function setInfiniteScrollEnabled(enabled: boolean): void {
  setFeatureFlag(FEATURE_FLAGS.INFINITE_SCROLL_ENABLED, enabled)
}

// Reset all feature flags to defaults
export function resetFeatureFlags(): void {
  try {
    Object.keys(DEFAULT_FLAGS).forEach(flag => {
      localStorage.removeItem(`feature_flag_${flag}`)
    })
  } catch {
    // Ignore localStorage errors
  }
}
