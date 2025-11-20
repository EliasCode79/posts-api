// posts-api/src/routes/post.routes.ts
import { Router } from "express";
import { PostController } from "../controllers/post.controller";
import { extractUserFromJWT, optionalAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

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
router.post("/", extractUserFromJWT, upload.single('media_file'), controller.create);

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

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like a post
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
 *         description: Like queued for processing
 *       401:
 *         description: No autenticado
 */
/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like a post
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
 *         description: Like queued for processing
 *       401:
 *         description: No autenticado
 */
router.post("/:id/like", extractUserFromJWT, controller.likePost);

/**
 * @swagger
 * /api/posts/{id}/unlike:
 *   delete:
 *     summary: Unlike a post
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
 *         description: Unlike queued for processing
 *       401:
 *         description: No autenticado
 */
router.delete("/:id/unlike", extractUserFromJWT, controller.unlikePost);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   get:
 *     summary: Check if current user liked a post
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
 *         description: Returns whether user liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *       401:
 *         description: No autenticado
 */
router.get("/:id/like", extractUserFromJWT, controller.checkLikeStatus);

// Comments route
router.post("/:id/comments", extractUserFromJWT, controller.createComment);

export default router;