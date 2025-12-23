# PWA Configuration Documentation

## Overview

This document describes the Progressive Web App (PWA) configuration for the StarTide Design platform (星潮设计).

## Configuration Summary

### Plugin: vite-plugin-pwa

The PWA functionality is implemented using `vite-plugin-pwa` version 0.17.5 with Workbox 7.0.0.

### Key Features

1. **Service Worker Registration**: Automatic service worker registration with prompt-based updates
2. **Offline Support**: Comprehensive caching strategies for different resource types
3. **Update Notifications**: User-friendly update prompts when new versions are available
4. **App Installation**: Support for installing the web app on mobile and desktop devices

## Caching Strategies

### 1. API Requests - NetworkFirst

**Pattern**: `/^https:\/\/.*\/api\/.*/i`

**Strategy**: NetworkFirst (优先网络，失败时使用缓存)

**Configuration**:
- Cache Name: `api-cache`
- Max Entries: 100
- Max Age: 24 hours
- Network Timeout: 10 seconds
- Cacheable Responses: Status 0, 200

**Behavior**:
1. Try to fetch from network first
2. If network fails or times out after 10 seconds, serve from cache
3. Update cache with successful network responses
4. Ideal for API calls where fresh data is preferred but offline access is needed

### 2. Images - CacheFirst

**Pattern**: `/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i`

**Strategy**: CacheFirst (优先缓存，缓存未命中时请求网络)

**Configuration**:
- Cache Name: `image-cache`
- Max Entries: 200
- Max Age: 30 days
- Cacheable Responses: Status 0, 200

**Behavior**:
1. Check cache first
2. If found in cache, serve immediately
3. If not in cache, fetch from network and cache
4. Ideal for images that don't change frequently

### 3. Fonts - CacheFirst

**Pattern**: `/\.(?:woff|woff2|ttf|otf|eot)$/i`

**Strategy**: CacheFirst

**Configuration**:
- Cache Name: `font-cache`
- Max Entries: 30
- Max Age: 1 year
- Cacheable Responses: Status 0, 200

**Behavior**:
1. Fonts are cached aggressively
2. Once cached, served instantly
3. Very long cache duration (1 year)
4. Ideal for fonts that rarely change

### 4. Static Resources (CSS/JS) - StaleWhileRevalidate

**Pattern**: `/\.(?:js|css)$/i`

**Strategy**: StaleWhileRevalidate (返回缓存同时后台更新)

**Configuration**:
- Cache Name: `static-resources`
- Max Entries: 60
- Max Age: 7 days
- Cacheable Responses: Status 0, 200

**Behavior**:
1. Serve from cache immediately if available
2. Fetch from network in background
3. Update cache with new version for next request
4. Ideal for static assets that may update occasionally

## Manifest Configuration

### App Information

```json
{
  "name": "星潮设计 - 设计资源下载平台",
  "short_name": "星潮设计",
  "description": "专业的设计资源分享平台，提供PSD、AI、CDR等设计文件下载",
  "theme_color": "#165DFF",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/"
}
```

### Icons

Required icon files in `public/` directory:

1. **pwa-192x192.png** - 192x192px (Standard PWA icon)
2. **pwa-512x512.png** - 512x512px (High-res icon and splash screen)
3. **apple-touch-icon.png** - 180x180px (iOS home screen icon)
4. **favicon.ico** - 32x32px (Browser tab icon)

See `public/PWA_ICONS_README.md` for detailed icon requirements.

## Update Strategy

### registerType: 'prompt'

The app uses the `prompt` registration type, which means:

1. When a new version is detected, the app does NOT automatically update
2. Instead, a dialog prompts the user to update
3. User can choose to:
   - **Update Now**: Immediately activate new version and reload
   - **Update Later**: Continue using current version

### Update Flow

```
1. New version deployed
   ↓
2. Service Worker detects update
   ↓
3. PWAUpdatePrompt component shows dialog
   ↓
4. User clicks "立即更新"
   ↓
5. updateServiceWorker() called
   ↓
6. Page reloads with new version
```

### Automatic Update Checks

- Initial check on page load
- Periodic checks every 1 hour
- Manual check when user returns to app

## Offline Support

### Offline Page

When the user is offline and tries to access an uncached page, they see:

**File**: `public/offline.html`

**Features**:
- Friendly offline message
- Retry button
- Automatic reload when connection restored
- Troubleshooting tips

### Offline Behavior

1. **Cached Pages**: Served from cache, fully functional
2. **Uncached Pages**: Show offline.html fallback
3. **API Requests**: Return cached data if available (NetworkFirst strategy)
4. **Images**: Served from cache if previously loaded

## Service Worker Lifecycle

### Installation

```
1. User visits site
   ↓
2. Service Worker downloads
   ↓
3. Service Worker installs
   ↓
4. Precache critical assets
   ↓
5. Service Worker activates
   ↓
6. App is now PWA-enabled
```

### Update

```
1. New version deployed
   ↓
2. Service Worker detects change
   ↓
3. New Service Worker downloads
   ↓
4. New Service Worker installs
   ↓
5. Waits for user confirmation (prompt)
   ↓
6. User confirms update
   ↓
7. skipWaiting() called
   ↓
8. New Service Worker activates
   ↓
9. Page reloads
```

## Development vs Production

### Development Mode

```typescript
devOptions: {
  enabled: false, // PWA disabled in dev
  type: 'module'
}
```

**Reason**: Service Workers can interfere with hot module replacement (HMR) during development.

### Production Mode

- PWA fully enabled
- Service Worker registered automatically
- All caching strategies active
- Update prompts functional

## Testing PWA

### Local Testing

1. Build the production version:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Open in browser and check:
   - Service Worker registered (DevTools > Application > Service Workers)
   - Manifest loaded (DevTools > Application > Manifest)
   - Caches populated (DevTools > Application > Cache Storage)

### Testing Offline

1. Open DevTools > Network
2. Check "Offline" checkbox
3. Reload page
4. Verify offline functionality

### Testing Updates

1. Make a change to the code
2. Build again: `npm run build`
3. Reload the app
4. Verify update prompt appears

## Browser Support

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 13+
- ✅ Chrome Android 90+

### Feature Detection

The app gracefully degrades if Service Workers are not supported:

```typescript
if (!('serviceWorker' in navigator)) {
  console.log('Service Worker not supported');
  // App continues to work without PWA features
}
```

## Performance Impact

### Benefits

- **Faster Load Times**: Cached resources load instantly
- **Offline Access**: App works without internet
- **Reduced Bandwidth**: Less data transferred after initial load
- **Better UX**: Instant navigation, no loading spinners

### Considerations

- **Initial Load**: Slightly slower (downloading Service Worker)
- **Storage**: Uses browser cache storage (typically 50MB+ available)
- **Update Delay**: Users may not get updates immediately (prompt-based)

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS (required for Service Workers)
2. Check browser console for errors
3. Verify `vite-plugin-pwa` is installed
4. Check DevTools > Application > Service Workers

### Updates Not Showing

1. Clear Service Worker cache
2. Unregister Service Worker
3. Hard reload (Ctrl+Shift+R)
4. Check update interval (default: 1 hour)

### Offline Page Not Showing

1. Verify `offline.html` exists in `public/`
2. Check Service Worker cache
3. Test with DevTools offline mode

## Security Considerations

### HTTPS Required

Service Workers only work over HTTPS (or localhost for development).

### Scope

Service Worker scope is limited to `/` (root), preventing access to parent directories.

### Cache Poisoning

- Only cache responses with status 0 or 200
- Validate response before caching
- Set reasonable cache expiration times

## Future Enhancements

### Planned Features

1. **Background Sync**: Queue failed requests and retry when online
2. **Push Notifications**: Notify users of new resources
3. **Periodic Background Sync**: Auto-update content in background
4. **Advanced Caching**: Smarter cache invalidation strategies

### Considerations

- User permissions required for notifications
- Battery impact of background sync
- Storage quota management

## References

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

## Requirements Mapping

This PWA configuration fulfills the following requirements:

- **需求13.1**: PWA支持 - Service Worker注册和manifest配置
- **需求13.2**: 离线缓存 - 多种缓存策略和离线页面
- **需求13.3**: 更新提示 - 用户友好的更新对话框

## Maintenance

### Regular Tasks

1. **Monitor Cache Size**: Check browser storage usage
2. **Update Icons**: Keep icons current with brand guidelines
3. **Test Updates**: Verify update flow works correctly
4. **Review Strategies**: Adjust caching strategies based on usage patterns

### Version Updates

When updating `vite-plugin-pwa`:

1. Check changelog for breaking changes
2. Update TypeScript types if needed
3. Test thoroughly in production-like environment
4. Monitor for Service Worker errors after deployment
