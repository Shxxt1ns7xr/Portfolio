# Dimple Pawa - Pixel Portfolio

Open `index.html` in a browser (double-click works, or use VS Code "Live Server").

Flow: Loading (spinning sand-clock) -> Start page -> Home. Nav bar jumps between Home / About / Projects / Skills / Contact.

## Files
- `index.html` - all pages (sections)
- `css/style.css` - styling + animations (design is drawn on a 1366x768 stage and scales to any screen; stacked layout under 860px)
- `js/main.js` - loader, start button, nav, typing effect, resume viewer
- `assets/img` - your design assets (backgrounds removed)
- `assets/icons` - skill logos
- `assets/docs/Resume_Dimple_Pawa.pdf` - the resume that opens/downloads
- `assets/docs/resume-preview.png` - image shown in the resume viewer

## Updating the resume
Replace `assets/docs/Resume_Dimple_Pawa.pdf`, then regenerate the preview image:
`pdftoppm -png -r 170 -singlefile Resume_Dimple_Pawa.pdf resume-preview` (inside `assets/docs`).

## Credits
Font: Press Start 2P (SIL OFL). Logos: devicon (MIT), Simple Icons (CC0), LobeHub icons (MIT), Font Awesome Free (CC BY 4.0).
