import { Client, Databases, Storage } from 'node-appwrite';
import { env } from './env.js';

const client = new Client();

if (env.appwrite.endpoint) {
  client.setEndpoint(env.appwrite.endpoint);
}

if (env.appwrite.projectId) {
  client.setProject(env.appwrite.projectId);
}

if (env.appwrite.apiKey) {
  client.setKey(env.appwrite.apiKey);
}

export const appwriteClient = client;
export const appwriteDatabases = new Databases(client);
export const appwriteStorage = new Storage(client);

export const isAppwriteConfigured = (): boolean => {
  return Boolean(env.appwrite.projectId && env.appwrite.apiKey);
};
