# Wedding Template Customization Rules

Whenever modifying the guest invitation page (`src/pages/WeddingPage.tsx` or related components) to change text, assets, toggles, or structural styles:

1. **Expose Settings Dynamically**: Never hardcode new text strings, background image URLs, video sources, sound clips, or theme variables directly. Instead, read them from the `settings` state database.
2. **Update Settings Schema**: Add corresponding properties to the `WeddingSettings` TypeScript interface inside [database.ts](file:///e:/My%20Project/Mukul%20Sharma/Wedding%20Website/src/services/database.ts).
3. **Add Database Defaults & Migrations**: Add the default fallback values to `DEFAULT_SETTINGS` and include migration checks inside `initLocalStorage` in [database.ts](file:///e:/My%20Project/Mukul%20Sharma/Wedding%20Website/src/services/database.ts) to populate these fields for existing users.
4. **Admin UI Input Fields**: Add matching form fields (inputs, select dropdowns, textareas, or checkboxes) in [AdminPanel.tsx](file:///e:/My%20Project/Mukul%20Sharma/Wedding%20Website/src/pages/AdminPanel.tsx) under the appropriate tabs (e.g., content, theme, or SEO) to ensure the admin can configure them from the browser.
5. **Canvas Card PDF Sync**: Make sure any modified texts/details are also updated in the downloaded invitation drawing logic in [SaveTheDateCard.tsx](file:///e:/My%20Project/Mukul%20Sharma/Wedding%20Website/src/components/SaveTheDateCard.tsx).
