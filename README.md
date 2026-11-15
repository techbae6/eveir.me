# eveir.me

Portfolio site for Eve Irem: creative technology, technical art and art direction.

Plain HTML, CSS and JavaScript. No build step: open `index.html`, or serve the folder with any static server
(for example `python3 -m http.server`).

## Pages
- `index.html`: home. A ring of LED screens you can drag to spin; click a screen to open that project.
- `work.html`: all projects, with filters, roles and playable videos.
- `graphics.html`: branding, flyers and other graphic work.

## Editing content
- Projects (titles, venues, roles, videos): `projects.js`
- Graphic work (images, captions): `graphics.js`, images in `assets/graphics/`
- Styles: `style.css` · motion and interactions: `fx.js`, `landing.js`

After changing CSS or JS, bump the `?v=` number in the HTML files so browsers load the new version.
