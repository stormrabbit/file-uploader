## Why

The PC homepage currently loads all photos at once, causing slow initial load times and poor performance with large photo collections. Implementing pagination will improve user experience by providing faster initial page loads and smoother scrolling performance.

## What Changes

- Implement paginated photo loading on the PC homepage
- Load 20 photos initially, then load additional 20-photo pages when user scrolls to bottom
- Add loading states and scroll detection functionality
- Maintain existing photo display layout and functionality
- Add smooth loading transitions and user feedback

## Capabilities

### New Capabilities
- `homepage-pagination`: Pagination system for photo loading on the PC homepage with infinite scroll functionality

### Modified Capabilities
- None (this is a new feature without existing spec modifications)

## Impact

- Frontend components: Homepage photo grid component
- State management: Photo loading state and pagination logic
- API integration: Modified photo fetching to support paginated requests
- User experience: Improved loading performance and infinite scroll behavior
