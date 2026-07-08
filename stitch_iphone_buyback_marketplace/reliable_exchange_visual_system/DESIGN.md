---
name: Reliable Exchange Visual System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#1d2123'
  on-tertiary: '#ffffff'
  tertiary-container: '#333638'
  on-tertiary-container: '#9c9fa1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  price-display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The design system is engineered for a high-trust reselling marketplace, balancing the precision of a technology platform with the approachability of a consumer service. The brand personality is **reliable, efficient, and transparent**, aimed at users who value a seamless, no-nonsense experience when converting hardware into liquid value.

The design style follows **Corporate Modernism** with subtle **Minimalist** influences. It prioritizes clarity and functional hierarchy to guide users through multi-step assessment flows. The aesthetic utilizes ample whitespace, structured grids, and a sophisticated use of elevation to differentiate between the diagnostic "work" areas and the celebratory "value" areas of the interface.

## Colors

This color palette is strategically split between "Trust" and "Action."

*   **Primary (Deep Blue):** Used for navigation, headers, and primary branding elements. It establishes a foundation of corporate stability and security.
*   **Secondary (Vibrant Green):** Representing cash value and successful progression. This color is reserved for success states, "Get Price" calls-to-action, and value highlights.
*   **Neutral (Slate):** A range of cool grays used for secondary text, borders, and icon paths to maintain a technical, clean look.
*   **Background (Soft White):** The interface uses a tiered white/light-gray system to separate page sections without heavy lines.

## Typography

The design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic feel. 

*   **Headlines:** High-weight and tight tracking create an authoritative presence. Large display sizes are reserved for value propositions and price quotes.
*   **Body:** Optimized for readability in technical specs and diagnostic questions.
*   **Labels:** Small, uppercase labels are used for category tags (e.g., "BRAND," "CONDITION") to provide metadata without cluttering the primary hierarchy.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

*   **Rhythm:** An 8px linear scale governs all padding and margin.
*   **Sections:** Distinct sections of the assessment flow are separated by 40px (xl) spacing to reduce cognitive load.
*   **Safe Areas:** Desktop layouts utilize a 1200px centered container to ensure content remains readable on ultra-wide displays. Mobile margins are fixed at 16px to maximize screen real estate for device selection grids.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**.

*   **Level 0 (Background):** Solid `#F8FAFC` for the main canvas.
*   **Level 1 (Cards):** White background with a subtle, low-opacity border (`#E2E8F0`) and no shadow. Used for secondary information.
*   **Level 2 (Interactive):** White background with a soft, diffused shadow (Y: 4, Blur: 12, Opacity: 0.05) to indicate tappable product cards.
*   **Level 3 (Modals/Overlays):** Stronger shadow (Y: 8, Blur: 24, Opacity: 0.1) to focus user attention on price confirmation or final steps.

## Shapes

The design system uses **Rounded (0.5rem)** geometry to strike a balance between professional precision and consumer friendliness.

*   **Standard Elements:** Buttons, input fields, and small cards use the base 8px (0.5rem) radius.
*   **Large Containers:** Main surface areas and featured product cards use 16px (1rem) for a softer, more modern tech appearance.
*   **Interactive Controls:** Selection circles and diagnostic icons use full circular "pill" rounding to distinguish them from structural layout elements.

## Components

### Buttons
*   **Primary:** Deep Blue background, white text. High-contrast for "Sell Now" or "Next" actions.
*   **Action (Green):** Reserved exclusively for "Get Exact Value" or "Accept Quote."
*   **Ghost:** Thin border with Deep Blue text for secondary actions like "View Specs."

### Product Cards
*   High-quality device image centered on a light gray background.
*   Bottom section contains the device name (Bold) and a "Up to [Price]" indicator in Secondary Green.
*   Interactive state: 1px border highlight in Primary Blue upon selection.

### Step-by-Step Indicators
*   A horizontal track with numbered nodes.
*   Completed steps: Green circle with a checkmark.
*   Active step: Deep Blue circle with a white pulse.
*   Future steps: Light gray border with gray text.

### Inputs & Selection
*   **Radio Selection:** Large tiles (80px height) rather than small radio dots for device conditions, making them easy to tap on mobile.
*   **Text Inputs:** Clean, outlined boxes that transition to a 2px Primary Blue border on focus.

### Value Chips
*   Small, semi-transparent green background (`#22C55E` at 10% opacity) with dark green text. Used to highlight "Instant Cash" or "Free Pickup" features.