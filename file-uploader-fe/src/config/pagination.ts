// Pagination configuration
export const PAGINATION_CONFIG = {
  PAGE_SIZE: 20,
  SCROLL_THRESHOLD: 0.8, // 80% of page height
  MAX_PHOTOS_IN_MEMORY: 1000,
  DEBOUNCE_DELAY: 300, // ms for scroll events
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
} as const

// Get configuration values with potential overrides
export function getPageSize(): number {
  try {
    const override = localStorage.getItem('pagination_page_size')
    return override ? Math.max(1, Math.min(100, parseInt(override, 10))) : PAGINATION_CONFIG.PAGE_SIZE
  } catch {
    return PAGINATION_CONFIG.PAGE_SIZE
  }
}

export function getScrollThreshold(): number {
  try {
    const override = localStorage.getItem('pagination_scroll_threshold')
    return override ? Math.max(0.1, Math.min(1.0, parseFloat(override))) : PAGINATION_CONFIG.SCROLL_THRESHOLD
  } catch {
    return PAGINATION_CONFIG.SCROLL_THRESHOLD
  }
}

export function getMaxPhotosInMemory(): number {
  try {
    const override = localStorage.getItem('pagination_max_photos')
    return override ? Math.max(100, parseInt(override, 10)) : PAGINATION_CONFIG.MAX_PHOTOS_IN_MEMORY
  } catch {
    return PAGINATION_CONFIG.MAX_PHOTOS_IN_MEMORY
  }
}

// Set configuration values
export function setPageSize(size: number): void {
  try {
    localStorage.setItem('pagination_page_size', String(Math.max(1, Math.min(100, size))))
  } catch {
    // Ignore localStorage errors
  }
}

export function setScrollThreshold(threshold: number): void {
  try {
    localStorage.setItem('pagination_scroll_threshold', String(Math.max(0.1, Math.min(1.0, threshold))))
  } catch {
    // Ignore localStorage errors
  }
}

export function setMaxPhotosInMemory(max: number): void {
  try {
    localStorage.setItem('pagination_max_photos', String(Math.max(100, max)))
  } catch {
    // Ignore localStorage errors
  }
}

// Reset all pagination configuration to defaults
export function resetPaginationConfig(): void {
  try {
    localStorage.removeItem('pagination_page_size')
    localStorage.removeItem('pagination_scroll_threshold')
    localStorage.removeItem('pagination_max_photos')
  } catch {
    // Ignore localStorage errors
  }
}
