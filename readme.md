# Benefactory — geefdashboard

Astro 5 + React + Tailwind (shadcn/ui geïnspireerd) applicatie waarmee gebruikers hun jaarinkomen en giften registreren. De app zet bedragen om naar jaarwaarden, toont het donatiepercentage en vergelijkt dat met wat miljardairs (zoals Elon Musk en Jeff Bezos) zouden geven bij hetzelfde percentage. Alles draait 100% client-side en wordt opgeslagen in `localStorage`, dus je hebt geen backend nodig.

## Benodigdheden

- Node.js 18+ en npm

## Installatie

```sh
npm install
```

Start vervolgens de ontwikkelserver:

```sh
npm run dev
```

Maak voor het eerst een `.env` aan op basis van `.env.example` en vul je Supabase `PUBLIC_SUPABASE_URL` en `PUBLIC_SUPABASE_ANON_KEY` in. Zonder deze waarden kan de dataset niet opgeslagen worden.

Bezoek [http://localhost:4321](http://localhost:4321) en je dashboard staat klaar.

## Data-opslag & delen

Gegevens worden tijdelijk en anoniem bewaard in Supabase. We gebruiken:

- een willekeurige household-ID (cookie) om je sessie later op dezelfde browser te hervatten;
- Supabase tabellen `households` en `donations` voor inkomen en giften;
- een deelbare link (`?d=<id>`) die verwijst naar je Supabase record. Wie de link opent, krijgt dezelfde gegevens en kan ze aanpassen.

Na verloop van tijd worden de records automatisch opgeschoond; er worden geen IP-adressen of andere persoonsgegevens opgeslagen.

## Belangrijkste bestanden

- `src/components/DonationApp.tsx` — React eiland (client:load) met formulieren, charts, deelbare link en lokale opslag.
- `src/pages/index.astro` — Eén-pagina dashboard dat de tool inlaadt en de header/theme toggle toont.
- `src/components/mode-toggle.tsx` — Donker/licht modus schakelaar (client component).
- `src/components/theme-provider.tsx` — Wrapt de app zodat donker/licht modus werkt.
- `src/components/ui/*` — Shadcn ui-primitive componenten (button, kaart, select, tabel, ...).
- `src/styles/global.css` — Tailwind entrypoint + kleur/typografie tokens (Geist fonts).

## User flow & functionaliteiten

1. **Jaarinkomen invullen** — input formateert automatisch naar `1.000` stijl en bewaart het bedrag lokaal.
2. **Donaties toevoegen** — via een modal/sheet met automatische omzetting naar jaarbedrag.
3. **Overzicht** — tabel toont bedragen en procentuele aandelen; progress-bar visualiseert het totale geefpercentage.
4. **Charts** — tabs voor “inkomen vs donaties” (pie chart) en “verdeling per goed doel”, plus een full-width miljardairsvergelijking inclusief je eigen inleg.
5. **Deelbare link** — genereert een URL met jouw data zodat je later verder kunt werken of het dashboard kunt delen.

## Scripts

| Command           | Beschrijving                                 |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start de Astro dev server                     |
| `npm run build`   | Maakt een productiebuild (statisch)           |
| `npm run preview` | Previewt de productiebuild                    |

## Styling & UI

- Tailwind CSS 4 via `@tailwindcss/vite`.
- Shadcn/ui componenten (`dashboard-01` block) zijn toegevoegd; je vind de configuratie in `components.json` en de componenten onder `src/components/ui`.
- Donkere modus wordt aangestuurd via `next-themes`. De toggle vind je rechtsboven in de header (`ModeToggle`).
- Het kleurenpalet volgt het oklch-thema uit de vraag; alle tokens staan in `src/styles/global.css`.
- Billionaire-vergelijking gebruikt `recharts` voor een compacte bar chart. Extra grafieken toevoegen is simpel: importeer `ResponsiveContainer` en render vanuit `DonationApp.tsx`.

## Handige componenten

| Locatie | Beschrijving |
| ------- | ------------ |
| `src/components/DonationApp.tsx` | Hoofdfunctionaliteit met formulieren, tabel en vergelijkingsgrafiek. |
| `src/pages/index.astro` | Eén-pagina dashboard dat de Benefactory tool en hero laadt. |
| `src/components/mode-toggle.tsx` | Donker/licht modus schakelaar (client component). |
| `src/components/theme-provider.tsx` | Wrapt de app zodat donker/licht modus werkt. |
| `src/components/ui/*` | Shadcn ui-primitive componenten (button, kaart, select, tabel, ...). |

Wil je extra ui-blokken uitproberen? Gebruik `npx shadcn@latest add <component>` (de `components.json` is al aanwezig).

## Verder uitbreiden

- Hernoem of breid `BILLIONAIRES` in `DonationApp.tsx` uit met actuele data.
- Splits bedragen per categorie (bv. gezondheidszorg, educatie) met extra cards of charts.
- Voeg export/opslag toe via Supabase, Airtable of een ander backend-platform.
