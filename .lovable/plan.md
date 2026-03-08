

## Plan: Thumbnail UX improvements

### Changes to `src/pages/ConfiguratorPage.tsx`

**1. Remove auto-scroll to size section on style click**
- Remove the `setTimeout` + `scrollIntoView` call inside `handleSelectStyle` (lines 109-111). Users can scroll manually.

**2. Move "View More" button onto the selected thumbnail**
- Remove the "View More" button from the big preview image (lines 238-245).
- Add a small "View More" overlay on the currently selected thumbnail in both:
  - **Desktop vertical thumbnails** (line 282-297): Show a small overlay button on the active thumbnail.
  - **Mobile horizontal thumbnails** (line 263-278): Same overlay on the active thumbnail.
- The button navigates to `/style-gallery/${styleId}` as before.

