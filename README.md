# LP Honorarios — Generador de propuestas de honorarios

Aplicación web para generar propuestas de honorarios arquitectónicos con IA (Claude).  
Desarrollada para uso de **Liam Arquitectura**, Málaga.

---

## Estructura del proyecto

```
LP_honorarios/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx
```

---

## Despliegue en Vercel (paso a paso)

### 1. Subir todos los archivos a GitHub

En tu repositorio `LP_honorarios`, asegúrate de que están todos estos archivos:

- `index.html`
- `package.json`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`

Puedes subirlos uno a uno con **Add file → Upload files** desde la interfaz de GitHub,  
o usar Git en tu terminal:

```bash
git add .
git commit -m "Proyecto completo listo para Vercel"
git push origin main
```

---

### 2. Obtener tu API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Inicia sesión (o crea una cuenta si no tienes)
3. Ve a **API Keys** en el menú lateral
4. Pulsa **Create Key** y copia la clave (empieza por `sk-ant-...`)
5. Guárdala en un lugar seguro — solo se muestra una vez

> ⚠️ **Nunca pongas la API key directamente en el código ni la subas a GitHub.**  
> Se configura como variable de entorno en Vercel (paso 4).

---

### 3. Conectar el repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Pulsa **Add New → Project**
3. Selecciona el repositorio `LP_honorarios`
4. Vercel detectará automáticamente que es un proyecto Vite. Deja los ajustes por defecto:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`

---

### 4. Añadir la variable de entorno

Antes de pulsar **Deploy**, en la sección **Environment Variables** añade:

| Nombre | Valor |
|--------|-------|
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxxxxxxx` (tu clave) |

---

### 5. Desplegar

Pulsa **Deploy**. En 1-2 minutos tendrás la app en una URL del tipo:

```
https://lp-honorarios-xxxx.vercel.app
```

Puedes asignarle un dominio propio desde el panel de Vercel (Settings → Domains).

---

## Actualizar la app en el futuro

Cada vez que subas cambios a GitHub (rama `main`), Vercel redesplegará automáticamente.

---

## Uso local (desarrollo)

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno local
echo "VITE_ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui" > .env.local

# Arrancar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## Notas de seguridad

- La API key se expone en el bundle de JavaScript del navegador (es una limitación de las llamadas directas desde el cliente).  
- Para un uso estrictamente privado (solo tú), esto es aceptable.  
- Si en el futuro quieres compartir la app con otros usuarios sin exponer tu clave, el siguiente paso sería añadir un backend serverless (función de Vercel) que actúe de proxy.

---

*Liam Arquitectura · Málaga · COAMÁLAGA nº 1620*
