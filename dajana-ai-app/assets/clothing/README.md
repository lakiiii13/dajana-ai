# KAPSULA – Clothing assets

Place your **processed** clothing PNGs here (354×797px, transparent, aligned to silhouette).

## Folder structure

- `jakne/` – jackets, coats, blazers  
- `gornji/` – tops, blouses, tees  
- `donji/` – pants, skirts, shorts  
- `obuca/` – shoes, boots, sneakers  
- `nakit/` – jewelry, watches  
- `aksesoari/` – bags, scarves, hats  

## Adding items

1. Put your PNG in the right folder.
2. In `catalog.ts`, add an entry, e.g.:

```ts
jakne: [
  { id: '1', label: 'Beige Trench', image: require('./jakne/beige-trench.png') },
],
```

Use the same canvas size (354×797) and alignment as your silhouette so layers stack correctly.
