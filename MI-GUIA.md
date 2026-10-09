# Mi guía de Quest HQ ✦

Guía personal de cómo está montada mi Quest HQ, cómo usarla y qué hacer si algo falla.
(Para la guía técnica general en inglés, ver [README.md](README.md).)

> Este repositorio es **público**: aquí no hay contraseñas ni claves secretas, y nunca deben ponerse.

---

## 📍 Dónde está todo

| Qué | Dónde |
|---|---|
| **La app** | https://nicolevrfdigital-source.github.io/Quest/ |
| **Código (GitHub)** | https://github.com/nicolevrfdigital-source/Quest |
| **Base de datos (Supabase)** | https://supabase.com/dashboard/project/ilaewswqoistlpytstlu |
| **Carpeta en mi Mac** | `Desktop/PERSONAL/Quest` |
| **Publicaciones** | https://github.com/nicolevrfdigital-source/Quest/actions |

---

## 📱 Uso diario

- **Hábitos**: toca Nourish, Move, Water o el **Daily challenge** para marcarlos. Con las flechas ‹ › cambias de día; tocando la fecha se abre el calendario.
- **Daily challenge**: un reto de movimiento pequeñito cada día (32 en total, en `src/lib/challenges.ts`). Sale “al azar” pero es el mismo en todos los dispositivos, y no se repite hasta que salieron todos.
- **Stickers** 🎀: si completo los **4** en un día, gano un sticker (sale un pop-up). El botón **Stickers** del header abre el sticker book. Hay 32 dibujos (`src/components/stickers.tsx`); al completarlos se repiten con un “×2”. No se guardan aparte: se calculan del historial de hábitos.
- **Little wins**: cuenta los días completados en el quest actual y en total. Nunca se reinicia.
- **Countdowns**: toca cualquier tarjeta para editarlos, añadir o quitar.
- **Nota**: toca el post-it y escribe. Se guarda sola.
- **Mensaje**: “Another one” muestra otro.
- **Timer**: elige minutos → Start. Avisa con un sonido suave (y notificación si la permití).
- **Foto**: toca para subir; los botones de la esquina la cambian o la quitan.
- **⚙️ Settings** (arriba a la izquierda): quests, countdowns, copia de seguridad y cerrar sesión.

### La etiqueta de guardado
- 🟢 **Saved / Synced**: todo guardado.
- 🟡 **Saving…**: guardando.
- 🟠 **unsaved · retrying**: no hay conexión. **No se pierde nada**: los cambios quedan en el dispositivo y se guardan solos al volver internet (o tocando la etiqueta).

---

## 🗺️ Quests

Todo se hace en **⚙️ Settings → Quests**:

- **Extender**: botones “+7 days” / “+14 days” o cambiar la fecha de fin → **Save changes**. El countdown del quest se actualiza solo.
- **Terminar**: **Finish quest**. Pasa a “Previous quests” con sus totales.
- **Empezar otro**: cuando no hay quest activo aparece el formulario “Start a new quest”.
- Los hábitos se guardan **aparte** de los quests: crear, extender, terminar o borrar un quest **nunca** borra hábitos.

**Primer quest**: Pre-Trip Quest, del 12 de octubre al 1 de noviembre de 2026.
**Countdowns iniciales**: Week 1 (18 oct), Pre-Trip Quest (sigue al quest activo), My Trip (12 dic).

---

## 💾 Copias de seguridad

**⚙️ Settings → Data & account**

- **Download backup**: descarga un archivo `.json` con hábitos, quests, countdowns y nota. Recomendado de vez en cuando.
- **Choose backup file**: restaura desde un archivo. Muestra un resumen y pide confirmación porque **reemplaza todo** (la foto no se toca).

---

## 🔐 Cuenta y acceso

- Entro con **email + contraseña**.
- **Olvidé la contraseña**: en la pantalla de entrada, “Forgot your password?” → llega un correo → el enlace abre la app para elegir una nueva.
- **Registro de cuentas nuevas desactivado** en Supabase (nadie más puede crear cuenta).
- Elegí contraseña en vez de código por correo porque Supabase no deja editar las plantillas de email sin configurar un servidor de correo propio (SMTP), y los enlaces mágicos abren Safari en vez de la app instalada.

### Instalar en un dispositivo nuevo
1. Abrir la app en **Safari**.
2. **Compartir** ⬆️ → **Añadir a pantalla de inicio**.
3. Dejar activado **“Abrir como app web”** → **Añadir**.
4. Abrir desde el ícono e **iniciar sesión dentro de la app** (tiene su propia sesión, separada de Safari).

---

## ⚙️ Cómo está configurado

### Supabase
- Tablas: `habit_logs` (incluye la columna `challenge`), `quests`, `countdowns`, `user_settings`, todas protegidas con **RLS** (solo mi usuario ve mis datos).
- Bucket **`photos`** privado. La foto se muestra con enlaces temporales de 1 hora.
- **Authentication → URL Configuration**
  - Site URL: `https://nicolevrfdigital-source.github.io/Quest/`
  - Redirect URLs: esa misma y `http://localhost:5173/`
- La estructura de la base de datos está en `supabase/migrations/` — `20261009000000_init.sql` (ya ejecutado) y `20261010000000_daily_challenge.sql` (añade el reto diario; hay que ejecutarlo una vez en el **SQL Editor** de Supabase **antes** de publicar esa versión).

### GitHub
- Repositorio **público** (GitHub Pages gratis solo funciona en públicos). Mis datos no están en el código, están en Supabase.
- **Settings → Pages → Source**: GitHub Actions.
- **Settings → Secrets and variables → Actions → Variables**:
  - `VITE_SUPABASE_URL` = `https://ilaewswqoistlpytstlu.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` = mi publishable key (`sb_publishable_…`)
  - ⚠️ En el campo *Value* va **solo el valor**, sin el nombre ni el `=`.
- La **secret / service_role key** de Supabase **nunca** se pone en ningún lado del proyecto.

---

## 🔄 Cómo hacer cambios

1. Le pido a Claude el cambio (en la carpeta `Desktop/PERSONAL/Quest`). Claude lo prepara, prueba y hace el commit.
2. En **GitHub Desktop** pulso **Push origin**.
3. GitHub publica solo en 1–2 minutos (se ve en la pestaña **Actions**: ✓ verde = listo).
4. El iPad y el teléfono se actualizan solos al abrir la app con internet.

### Probar en la Mac antes de publicar
En la carpeta del proyecto, en Terminal:
```bash
npm run dev
```
y abrir http://localhost:5173/. El archivo `.env.local` (con la URL y la key) está solo en mi Mac y no se sube a GitHub.

---

## 🩹 Si algo falla

| Problema | Qué hacer |
|---|---|
| **Página en blanco** | Probablemente caché vieja: recargar con **Cmd + Shift + R**, o abrir el enlace con `?v=2` al final. Esperar 10 min también funciona. |
| **Mensaje “Almost there” / “can’t find valid Supabase settings”** | Revisar las variables en GitHub (solo el valor, sin el nombre) y volver a publicar desde **Actions → Re-run all jobs**. |
| **La publicación falla (❌ roja en Actions)** | Abrir el run y ver qué paso falló. Si dice algo de “Pages”, revisar que **Settings → Pages → Source** sea **GitHub Actions**. Luego **Re-run all jobs**. |
| **Etiqueta “unsaved · retrying”** | Es falta de conexión; esperar o tocar la etiqueta. No se pierde nada. |
| **No llegan correos de Supabase** | El correo gratuito de Supabase tiene límite de pocos correos por hora. Esperar un rato y revisar spam. |
| **No suenan/llegan avisos del timer** | Solo funcionan en la app instalada (no en Safari) y con permiso de notificaciones. Si la app estaba en segundo plano, se ve terminado al volver. |
| **El iPad sigue mostrando una versión vieja** | Cerrar la app por completo (deslizar hacia arriba en el selector de apps) y abrirla de nuevo con internet. |

---

## 🗓️ Historial

- **9 oct 2026**: proyecto creado, base de datos configurada, cuenta creada, publicado en GitHub Pages e instalado en el iPad.
  - Se cambió el inicio de sesión de código por correo a email + contraseña (sin SMTP).
  - Arreglado: página en blanco por variables de GitHub con el nombre incluido en el valor. Ahora la app muestra un mensaje en vez de quedar en blanco.
- **10 oct 2026**: Daily challenges (32 retos de movimiento como 4.º hábito) + sticker book con 32 stickers que se ganan al completar los 4 hábitos de un día.
