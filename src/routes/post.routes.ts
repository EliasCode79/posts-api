import { Router } from "express";
import { PostController } from "../controllers/post.controller";

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
 *     summary: Obtiene todos los posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Lista de posts
 */
router.get("/", controller.findAll);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Obtiene un post por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del post
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
 *     summary: Crea un nuevo post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author_id:
 *                 type: string
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
 */
router.post("/", controller.create);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Actualiza un post existente
 *     tags: [Posts]
 */
router.put("/:id", controller.update);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Elimina un post
 *     tags: [Posts]
 */
router.delete("/:id", controller.delete);

export default router;
