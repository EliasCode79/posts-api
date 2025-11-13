# 🧩 Posts Service — Microservicio para Red Social de Desarrolladores

Este proyecto es un **microservicio de publicaciones (posts)** que forma parte de una **red social para desarrolladores**.
Su función principal es **gestionar el CRUD de publicaciones**, permitiendo crear, leer, actualizar y eliminar posts.

Está desarrollado con **Node.js (Express)** y **TypeScript**, utilizando **MongoDB** como base de datos y completamente **contenedorizado con Docker**.

---

## 🚀 Características principales

* CRUD completo de posts (`/api/posts`)
* Documentación automática con **Swagger UI**
* Persistencia de datos en MongoDB mediante **volúmenes de Docker**
* Tipado fuerte con **TypeScript**
* Arquitectura modular y escalable
* Configurable mediante variables de entorno (`.env`)
* Preparado para integrarse con otros microservicios (likes, comentarios, vistas)

---

## 🏗️ Estructura del proyecto

```bash
posts-service/
├── src/
│   ├── app.ts               # Archivo principal de la aplicación
│   ├── routes/
│   │   └── post.routes.ts   # Rutas del CRUD de posts
│   ├── controllers/
│   │   └── post.controller.ts
│   ├── models/
│   │   └── post.model.ts    # Esquema de Mongoose
│   ├── services/
│   │   └── post.service.ts  # Lógica de negocio
│   ├── config/
│   │   └── database.ts      # Conexión a MongoDB
│   └── swagger.yaml         # Definición de la documentación Swagger
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🧠 Descripción del microservicio

Este microservicio gestiona las publicaciones creadas por los usuarios.
Cada post contiene información estructurada en el siguiente formato:

```json
{
  "_id": "ObjectId",
  "author_id": "uuid-usuario",
  "description": "Publicación de ejemplo",
  "media_url": "https://minio/meme.jpg",
  "media_type": "image/jpeg",
  "tags": ["javascript", "backend", "nodejs"],
  "engagement_score": 0.85,
  "created_at": "2025-11-13T12:00:00Z",
  "updated_at": "2025-11-13T12:30:00Z"
}
```

> Las métricas como **likes**, **comentarios** y **vistas** serán gestionadas por otros microservicios.

---

## 🧩 Endpoints principales

| Método   | Endpoint         | Descripción                  |
| :------- | :--------------- | :--------------------------- |
| `POST`   | `/api/posts`     | Crear un nuevo post          |
| `GET`    | `/api/posts`     | Obtener todos los posts      |
| `GET`    | `/api/posts/:id` | Obtener un post por ID       |
| `PUT`    | `/api/posts/:id` | Actualizar un post existente |
| `DELETE` | `/api/posts/:id` | Eliminar un post             |

📘 Documentación Swagger disponible en:
[`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

---

## 🛠️ Tecnologías y versiones utilizadas

| Herramienta | Versión recomendada |
| ----------- | ------------------- |
| Node.js     | 20.x                |
| npm         | 10.x                |
| TypeScript  | 5.x                 |
| Express     | 4.x                 |
| MongoDB     | 7.x                 |
| Docker      | 24.x o superior     |

---

## ⚙️ Configuración del entorno

Antes de ejecutar el proyecto, crea un archivo `.env` basado en el ejemplo proporcionado:

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/posts_db
```

---

## 🐳 Ejecución con Docker

1. **Construir y levantar los contenedores:**

   ```bash
   docker-compose up --build
   ```

2. **Verificar los servicios:**

   * API: [http://localhost:3000/api/posts](http://localhost:3000/api/posts)
   * Swagger Docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   * MongoDB (contenedor): `mongo:27017`

3. **Detener los contenedores:**

   ```bash
   docker-compose down
   ```

4. **Eliminar volúmenes y datos persistentes (opcional):**

   ```bash
   docker-compose down -v
   ```

---

## 💻 Ejecución local (sin Docker)

Si prefieres ejecutar el servicio directamente en tu entorno local:

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Compilar y ejecutar en producción
npm run build
npm start
```

> Asegúrate de tener una instancia de MongoDB activa o modificar la variable `MONGO_URI` en tu archivo `.env`.

---

## 📁 Persistencia de datos en Docker

El contenedor de MongoDB utiliza un volumen para mantener los datos almacenados incluso si el contenedor se reinicia:

```yaml
volumes:
  mongo-data:
    driver: local
```

Esto asegura que los datos **no se pierdan** entre ejecuciones.

---

## 🧪 Pruebas rápidas (desde terminal)

### Crear un nuevo post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"author_id":"user-123","description":"Hola mundo","tags":["node","api"]}'
```

### Obtener todos los posts

```bash
curl http://localhost:3000/api/posts
```

### Obtener un post por ID

```bash
curl http://localhost:3000/api/posts/<id>
```

### Documentacion de los endpoints

```bash
http://localhost:3000/api/docs/
```

## 🐋 Comandos útiles de Docker

| Acción                                          | Comando                                |
| ----------------------------------------------- | -------------------------------------- |
| Ver logs del servicio                           | `docker-compose logs -f posts-service` |
| Reconstruir imágenes                            | `docker-compose up --build`            |
| Ver contenedores activos                        | `docker ps`                            |
| Entrar al contenedor del servicio               | `docker exec -it posts-service sh`     |
| Borrar todo (contenedores, imágenes, volúmenes) | `docker system prune -a --volumes`     |

---

## 🧾 Licencia y propósito académico

Este proyecto fue desarrollado con fines **académicos**, como parte de la materia **Microservicios**,
en la carrera de **Ingeniería en Tecnologías de la Información y Sistemas**.

---

## 👨‍💻 Autor

**Elias Franco**
Desarrollador Backend — Proyecto académico de microservicios
📚 Universidad San Francisco Xavier
-----------------------------------
