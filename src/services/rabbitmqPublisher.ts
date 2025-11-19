const amqp = require('amqplib');

export interface CommentData {
  postId: string;
  authorId: string;
  text: string;
  parentCommentId?: string | null;
}

export interface LikeData {
  targetType: 'post' | 'comment';
  targetId: string;
  userId: string;
}

export class RabbitMQPublisher {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private rabbitmqUrl: string = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      if (this.isConnected) return;

      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare queues
      await this.channel.assertQueue('comments.create', { durable: true });
      await this.channel.assertQueue('likes.create', { durable: true });
      await this.channel.assertQueue('likes.delete', { durable: true });
      
      this.isConnected = true;
      console.log('[RabbitMQ] Publisher connected successfully');
    } catch (error) {
      console.error('[RabbitMQ] Publisher connection failed:', error);
      this.isConnected = false;
      // Don't throw - allow graceful degradation
    }
  }

  async publishCommentCreation(commentData: CommentData): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.warn('[RabbitMQ] Not connected, skipping comment creation');
      return;
    }

    try {
      const message = Buffer.from(JSON.stringify(commentData));
      const sent = this.channel.sendToQueue('comments.create', message, { persistent: true });
      
      if (sent) {
        console.log(`[RabbitMQ] Published comment creation for post ${commentData.postId}`);
      } else {
        console.warn(`[RabbitMQ] Failed to publish comment creation for post ${commentData.postId}`);
      }
    } catch (error) {
      console.error('[RabbitMQ] Error publishing comment creation:', error);
    }
  }

  async publishLikeCreation(likeData: LikeData): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.warn('[RabbitMQ] Not connected, skipping like creation');
      return;
    }

    try {
      const message = Buffer.from(JSON.stringify(likeData));
      const sent = this.channel.sendToQueue('likes.create', message, { persistent: true });
      
      if (sent) {
        console.log(`[RabbitMQ] Published like creation for ${likeData.targetType} ${likeData.targetId}`);
      } else {
        console.warn(`[RabbitMQ] Failed to publish like creation for ${likeData.targetType} ${likeData.targetId}`);
      }
    } catch (error) {
      console.error('[RabbitMQ] Error publishing like creation:', error);
    }
  }

  async publishLikeDeletion(likeData: LikeData): Promise<void> {
    if (!this.isConnected || !this.channel) {
      console.warn('[RabbitMQ] Not connected, skipping like deletion');
      return;
    }

    try {
      const message = Buffer.from(JSON.stringify(likeData));
      const sent = this.channel.sendToQueue('likes.delete', message, { persistent: true });
      
      if (sent) {
        console.log(`[RabbitMQ] Published like deletion for ${likeData.targetType} ${likeData.targetId}`);
      } else {
        console.warn(`[RabbitMQ] Failed to publish like deletion for ${likeData.targetType} ${likeData.targetId}`);
      }
    } catch (error) {
      console.error('[RabbitMQ] Error publishing like deletion:', error);
    }
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.isConnected = false;
  }
}