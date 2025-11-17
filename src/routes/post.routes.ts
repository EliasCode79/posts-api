import { Router } from "express";
import { PostController } from "../controllers/post.controller";
import { extractUserFromJWT, optionalAuth } from "../middleware/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API para gestionar publicaciones
 */
const router = Router();
const controller = new PostController();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Obtiene todos los posts (público)
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Lista de posts con información de usuarios
 */
router.get("/", controller.findAll);

/**
 * @swagger
 * /api/posts/my-posts:
 *   get:
 *     summary: Obtiene los posts del usuario autenticado
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de posts del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/my-posts", extractUserFromJWT, controller.getMyPosts);

/**
 * @swagger
 * /api/posts/author/{authorId}:
 *   get:
 *     summary: Obtiene posts de un autor específico
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de posts del autor
 */
router.get("/author/:authorId", controller.findByAuthor);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Obtiene un post por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post encontrado
 *       404:
 *         description: Post no encontrado
 */
router.get("/:id", controller.findById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Crea un nuevo post (usuario autenticado es el autor)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               media_url:
 *                 type: string
 *               media_type:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post creado correctamente
 *       401:
 *         description: No autenticado
 */
router.post("/", extractUserFromJWT, controller.create);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Actualiza un post (solo el autor)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post actualizado
 *       403:
 *         description: No autorizado (no eres el autor)
 */
router.put("/:id", extractUserFromJWT, controller.update);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Elimina un post (solo el autor)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post eliminado
 *       403:
 *         description: No autorizado (no eres el autor)
 */
router.delete("/:id", extractUserFromJWT, controller.delete);

export default router;