import { Db } from 'mongodb';
import { connectMongo, getMongoDb } from '../../../src/database/mongo.connection.ts';
import { logger } from '../../../src/utils/logger.ts';

export interface MongoMigration {
  name: string;
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

export const getExecutedMigrations = async (): Promise<string[]> => {
  const db = getMongoDb();
  const collection = db.collection('migrations');
  const migrations = await collection.find({}).sort({ name: 1 }).toArray();
  return migrations.map((m) => m.name);
};

export const markMigrationAsExecuted = async (name: string): Promise<void> => {
  const db = getMongoDb();
  const collection = db.collection('migrations');
  await collection.insertOne({ name, executed_at: new Date() });
};

export const unmarkMigrationAsExecuted = async (name: string): Promise<void> => {
  const db = getMongoDb();
  const collection = db.collection('migrations');
  await collection.deleteOne({ name });
};
