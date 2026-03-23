# Video / slike – samo Cloudflare R2 (bez Supabase Storage)

Videi i try-on slike čuvaju se **isključivo na Cloudflare R2**. Aplikacija više ne koristi Supabase Storage za njih (nema fallback-a).

Ako R2 nije podešen ili je preopterećen, korisnik vidi jasnu grešku (npr. *"Cloudflare R2 je trenutno preopterećen. Pokušajte ponovo za nekoliko minuta."*).

---

## Šta proveriti ako ne radi

- **R2 u Supabase:** Edge Function `upload-to-r2` deploy-ovana, u **Secrets** postavljene vrednosti za R2 (npr. `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`). Vidi **docs/R2-SETUP.md**.
- **Preopterećenost:** Ako R2 vrati „preopterećen”, korisnik vidi poruku da pokuša ponovo za nekoliko minuta; nema više čuvanja u Supabase.
