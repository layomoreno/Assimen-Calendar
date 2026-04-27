# Assisten Calendar 📅✨

Assisten Calendar es una plataforma premium y moderna de gestión de tiempo personal y académico potenciada por Inteligencia Artificial. Combina una interfaz gráfica de altísima fidelidad (Glassmorphism + Framer Motion) con automatización de agendas a través de modelos de IA estructurados (Google Gemini) y la suite empresarial de Google Cloud Voice.

---

## 🚀 Características Principales

*   **Extracción de IA Perfecta (100% JSON):** El motor lee texto, PDFs, imágenes o voz, procesa los datos con Google Gemini (usando el esquema estricto `application/json`) y extrae tareas y eventos con cero margen de error en el formato.
*   **Voz Hiperrealista (Google Cloud):** 
    *   **STT (Speech-to-Text):** Permite dictar órdenes habladas que son transcritas con alta precisión.
    *   **TTS (Text-to-Speech):** La IA responde usando redes neuronales de Google Cloud (`es-ES-Neural2-F`) para obtener una entonación completamente conversacional.
*   **Sistema de Sincronización Universal:** 
    *   Integración Bidireccional con **Google Calendar**.
    *   Integración con **Microsoft Outlook**.
    *   Soporte nativo para eventos `.ics` de **Apple Calendar**.
*   **Dashboard Interactivo Premium:** 
    *   Animaciones continuas creadas con `framer-motion`.
    *   Métricas interactivas de rendimiento con `react-chartjs-2`.
    *   Alertas dinámicas: Las tareas urgentes (<48 horas) muestran un halo rojo animado y constante.
*   **Gestor de Conflictos:** Analiza tu horario real para asignar nuevos bloques de estudio o tareas sin chocar con tus clases o reuniones previas.

---

## 💻 Arquitectura y Tecnologías

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion.
*   **Base de Datos & Auth:** Supabase (PostgreSQL) con políticas de seguridad a nivel de fila (RLS).
*   **Motor Inteligente:** Google Gemini Pro/Flash SDK.
*   **Sistemas de Voz:** `@google-cloud/speech` y `@google-cloud/text-to-speech`.

---

## ⚙️ Requisitos Previos

Antes de levantar el entorno, asegúrate de tener:
1. Node.js (v18+)
2. Un proyecto en [Supabase](https://supabase.com/).
3. Un proyecto en [Google Cloud Console](https://console.cloud.google.com/) con acceso a:
   * Google Calendar API
   * Cloud Speech-to-Text API
   * Cloud Text-to-Speech API
4. Llave API de Google AI Studio (Gemini).

---

## 🛠️ Instalación y Configuración Local

1. **Clonar el repositorio y entrar a la carpeta:**
   ```bash
   git clone <TU_REPOSITORIO_GITHUB>
   cd assisten-calendar
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Renombra el archivo `.env.example` a `.env.local` y llena las siguientes variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

   # Gemini (AI)
   GEMINI_API_KEY=tu_gemini_api_key

   # Google Cloud Voice (Archivo de credenciales)
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/absoluta/a/tu/cuenta-de-servicio.json
   ```
   *(Importante: Para usar la Voz de Google, debes generar una cuenta de servicio en GCP, descargar el `.json` y apuntar la variable `GOOGLE_APPLICATION_CREDENTIALS` hacia la ruta de ese archivo en tu servidor o máquina local).*

4. **Correr el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---

## 🚢 Despliegue (Production)

El proyecto incluye un `Dockerfile` y `docker-compose.yml` pre-configurados para facilitar el despliegue en un VPS usando herramientas como **Dokploy**, Coolify, o Portainer.

1. Al configurar en tu VPS, asegúrate de crear el archivo de variables de entorno dentro del contenedor.
2. Inyecta el contenido del JSON de Google Cloud directamente como un secreto, o monta el archivo como volumen en el contenedor de Docker para el correcto funcionamiento de las funciones de voz.

---

## 📞 Soporte
Diseñado con precisión milimétrica para ofrecer la mejor experiencia de usuario en Productividad AI.
