# PWA — íconos pendientes

Para que el celular muestre el ícono correcto al instalar FocusQuest en la pantalla de inicio, hay que dejar dos imágenes cuadradas en este directorio (`public/`):

| Archivo              | Tamaño    | Uso                                           |
| -------------------- | --------- | --------------------------------------------- |
| `icon-192x192.png`   | 192 × 192 | Ícono Android, fallback Apple Touch Icon      |
| `icon-512x512.png`   | 512 × 512 | Ícono Android grande + splash screen + maskable |

Recomendaciones:

- PNG cuadrado, fondo opaco (`#0f172a` queda alineado con el `background_color` del manifest).
- Para que el ícono "maskable" se vea bien recortado en Android, dejá ~10% de padding alrededor del símbolo central — los launchers le aplican máscara circular o squircle.
- El manifest (`app/manifest.ts`) ya apunta a estos archivos en la raíz de `/public`. No hace falta tocar el código una vez subidos.

El manifest declara `icon-512x512.png` dos veces: una como `purpose: 'any'` (uso normal) y otra como `purpose: 'maskable'` (recortable). Si después querés un asset distinto para cada uno, separalos en dos archivos y actualizá el manifest.

Este README es temporal — borralo cuando los íconos estén en su lugar.
