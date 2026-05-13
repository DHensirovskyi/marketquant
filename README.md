# Trading Analytics — Next.js

Дашборд сесійної аналітики ринків. Next.js 14 (App Router) + Tailwind CSS + lucide-react.

## Запуск

```bash
npm install
npm run dev
```

Відкрити http://localhost:3000

## Стек

- **Next.js 14** — App Router, React Server / Client Components
- **Tailwind CSS** — `darkMode: 'class'`, перемикання через `localStorage`
- **lucide-react** — іконки
- **Inter / JetBrains Mono** — через Google Fonts (підключено в `app/layout.jsx`)

## Структура

```
app/
  layout.jsx        — кореневий layout, підвантажує тему до гідрації
  page.jsx          — головна сторінка з 7 картками + хедером
  globals.css       — Tailwind directives + кастомні стилі
components/
  Header.jsx        — хедер: лого, годинник, селектор пари, CSV, тема
  MarketClock.jsx   — UTC-годинник з активними сесіями
  PairStrip.jsx     — статистика по обраній парі
  ExportCsvModal.jsx — модал експорту бектесту з blur-фоном
  primitives.jsx    — Select, NumberInput, ProgressBar, Badge
  Card.jsx          — шкарлупа картки з drag handle
  cards/            — 7 окремих компонентів-метрик
```

## Що додати

- API-роут для реального бектесту замість синтетичного CSV
- WebSocket з реальною ціною замість статичних `PairStrip`-значень
- Збереження порядку карток у `localStorage`
