# Design System Rules for Figma Integration

This document defines the design system structure and patterns for integrating Figma designs into this Vue 3 + TypeScript codebase.

## Project Overview

- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Language**: TypeScript
- **UI Library**: Element Plus
- **Styling**: Tailwind CSS + Scoped CSS
- **Build Tool**: Vite
- **State Management**: Pinia

## Design Tokens

### Colors (Tailwind Config)

Primary and secondary colors are defined in `tailwind.config.js`:

```javascript
colors: {
  primary: '#165DFF',        // Main brand color
  secondary: '#FF7D00',      // Accent color
  'primary-light': '#4080FF',
  'primary-dark': '#0E42D2',
  'secondary-light': '#FFA940',
  'secondary-dark': '#D66A00'
}
```

### Typography

- **Font Family**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'...`)
- **Base Font Size**: 16px
- **Line Height**: 1.5

### Spacing

Use Tailwind's default spacing scale (4px base unit):
- `p-2` = 8px, `p-4` = 16px, `m-3` = 12px, etc.

## Component Architecture

### Directory Structure

```
src/components/
├── business/     # Domain-specific components (ResourceCard, SearchBar, etc.)
├── common/       # Reusable UI components (Loading, Empty, etc.)
└── layout/       # Layout components (MobileLayout, DesktopLayout)
```

### Component Patterns

1. **Use `<script setup>` syntax** with TypeScript
2. **Define Props interfaces** with `withDefaults(defineProps<Props>(), {...})`
3. **Define Emits** with `defineEmits<{...}>()`
4. **Use scoped styles** with `<style scoped>`
5. **Include component documentation** in comments at the top

Example structure:
```vue
<script setup lang="ts">
interface Props {
  /** Prop description */
  propName: string;
}

const props = withDefaults(defineProps<Props>(), {
  propName: 'default'
});

const emit = defineEmits<{
  eventName: [payload: string];
}>();
</script>

<template>
  <!-- Template content -->
</template>

<style scoped>
/* Scoped styles */
</style>
```

## Styling Approach

### Hybrid Tailwind + Scoped CSS

- Use **Tailwind utilities** for layout, spacing, and simple styling
- Use **scoped CSS** for complex component-specific styles
- Use **CSS custom properties** for dynamic values

### Responsive Design

Breakpoints:
- Mobile: `max-width: 768px`
- Tablet: `769px - 1200px`
- Desktop: `> 1200px`

```css
@media (max-width: 768px) { /* Mobile styles */ }
@media (min-width: 769px) and (max-width: 1200px) { /* Tablet styles */ }
```

### Dark Mode Support

Use `prefers-color-scheme` media query:
```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles */
}
```

## Element Plus Components

Common components used:
- `el-button`, `el-tag`, `el-icon`
- `el-image` (with lazy loading)
- `el-skeleton` (for loading states)
- `el-input`, `el-select`, `el-form`

Icons from `@element-plus/icons-vue`:
```typescript
import { Download, Star, Loading, Picture } from '@element-plus/icons-vue';
```

## Asset Management

- **Images**: Use `el-image` with lazy loading and placeholder/error slots
- **Icons**: Element Plus icons or custom SVG components
- **Static Assets**: Place in `public/` or `src/assets/`

## Figma Integration Guidelines

When converting Figma designs to code:

1. **Replace Tailwind utilities** with project's design tokens when applicable
2. **Reuse existing components** from `src/components/` instead of creating duplicates
3. **Use the project's color system** (`primary`, `secondary`, etc.)
4. **Follow existing responsive patterns** with the defined breakpoints
5. **Maintain 1:1 visual parity** with Figma designs
6. **Use Element Plus components** for form elements, buttons, and common UI patterns

### Code Style

- Use Chinese comments for component documentation (matching existing codebase)
- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Include accessibility attributes where appropriate
