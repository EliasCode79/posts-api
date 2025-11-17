import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '../../proto/users.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const usersProto: any = grpc.loadPackageDefinition(packageDefinition).users;

// gRPC client connection
const USERS_SERVICE_URL = process.env.USERS_GRPC_URL || 'users-service:50051';

const client = new usersProto.UsersService(
  USERS_SERVICE_URL,
  grpc.credentials.createInsecure()
);

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Get single user by ID
export const getUser = (userId: number): Promise<User> => {
  return new Promise((resolve, reject) => {
    client.GetUser({ user_id: userId }, (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

// Get multiple users by IDs (batch)
export const getUsers = (userIds: number[]): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    client.GetUsers({ user_ids: userIds }, (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.users || []);
      }
    });
  });
};