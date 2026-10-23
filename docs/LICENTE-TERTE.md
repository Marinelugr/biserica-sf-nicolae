# Licențe terțe care cer o mențiune

Doar dependențele cu licență care nu e permisivă (MIT/ISC/BSD/Apache) sau care cer o notă explicită.
Restul se găsesc în `package-lock.json` / `node_modules/*/LICENSE`.

| Pachet | Versiune | Licență | Unde se folosește | Note |
| --- | --- | --- | --- | --- |
| [`heic-to`](https://github.com/hoppergee/heic-to) | 1.6.6 | LGPL-3.0 (include libheif, LGPL-3.0, și libde265, LGPL-3.0) | `src/lib/heic.ts`, doar în admin, în browser | Încărcat dinamic (`import('heic-to')`), într-un fișier JS separat, nemodificat. Sursa e publică la adresa de mai sus; LGPL permite folosirea dintr-un program cu altă licență cât timp biblioteca rămâne înlocuibilă (aici: un modul separat, versiune fixată în `package.json`). |
