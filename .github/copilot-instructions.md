# Workspace instructions

- This is a React 19 + Vite 6 + Tailwind v4 storefront, deployed as a fully
  static site to GitHub Pages. There is no backend, no database and no
  authentication — do not add one without being asked.
- The catalogue is source code in `src/data/`. It is compiled into
  `public/store-data.json` by `npm run publish:data`. After changing anything
  under `src/data/`, regenerate that file and commit it, or the live site will
  keep serving the previous catalogue.
- Run locally with `npm run dev`. Build with `npm run build`.
- Checkout composes a WhatsApp message that the customer sends themselves. No
  payment is collected anywhere. Never add copy implying an order was placed,
  a payment was taken or a message was delivered.
- Keep the experience responsive and accessible: keyboard-operable dialogs,
  focus traps on modals, visible focus states.
- Prices are Indian rupees and are formatted through `formatPrice`.
