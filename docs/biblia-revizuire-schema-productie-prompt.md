# Prompt Claude Code — parintelemarin.com: schema cozii de revizuire + importul auditului în PRODUCȚIE

Folderul: `~/dev/biserica-sf-nicolae-site`, pe `main` actualizat, după merge. Citești `docs/BIBLIA-REVIZUIRE.md`. Nu afișezi `.env*`, URL-uri de bază, parole sau text din versete; doar nume de gazdă și cifre. La fiecare pas de scriere te oprești și ceri confirmarea mea tastată, exact ca mai jos.

1. **Verificare înainte.** Deschizi `backups/biblie-revizuire-schema-2026-11-01.sql` și confirmi că are doar `CREATE TABLE`/`CREATE INDEX` pentru `BibleReviewItem` și `BibleReportThrottle` și cheia străină spre `BibleVerse`. Orice altceva: oprește-te. Afișezi gazda din `DIRECT_URL` și numărul de versete (citire).
2. **Schema.** Aștepți să scriu exact `APLICA SCHEMA <gazda>`. Aplici SQL-ul într-o tranzacție. Verifici că există cele două tabele și indexul `BibleReviewItem_audit_unique`, și că numărul de versete e același.
3. **Dry-run.** `npm run bible:review-import -- --file backups/biblia-erori/de-verificat.csv --allow-remote --yes-host=<gazda>`. Afișezi planul.
4. **Import.** Aștepți să scriu exact `IMPORTA AUDIT <gazda>`. Aceeași comandă cu `--apply`. Afișezi numărul de elemente pe stări. Rulezi din nou dry-run: „de creat” trebuie să fie 0.
5. **Oprire.** Îmi spui să rulez `scripts/deploy-tophost.sh`. Nu faci deploy.
6. **După deploy.** Trimit o raportare de probă de pe telefon și una de pe calculator, de la adrese diferite, și verificăm în bază că `BibleReportThrottle.keyHash` diferă. Dacă e același, adresa clientului nu ajunge la aplicație: raportezi, iar eu decid. Le marchez apoi „Ignoră” în coadă.

Anulare: `backups/biblie-revizuire-schema-ROLLBACK-2026-11-01.sql`, doar cu confirmarea tastată `ANULEAZA SCHEMA <gazda>`.
