import type { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { Role } from "@/lib/types";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface CourseDoc {
  _id: ObjectId;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionDoc {
  _id: ObjectId;
  courseId: ObjectId;
  title: string;
  order: number;
}

export interface ResourceDoc {
  _id: ObjectId;
  sectionId: ObjectId;
  courseId: ObjectId;
  title: string;
  order: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackDoc {
  _id: ObjectId;
  resourceId: ObjectId;
  userId: ObjectId;
  text: string;
  createdAt: Date;
}

export interface MagicTokenDoc {
  _id: ObjectId;
  tokenHash: string;
  email: string;
  next?: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
}

export interface RateLimitDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

interface CollectionMap {
  users: UserDoc;
  courses: CourseDoc;
  sections: SectionDoc;
  resources: ResourceDoc;
  feedback: FeedbackDoc;
  magic_tokens: MagicTokenDoc;
  rate_limits: RateLimitDoc;
}

export async function col<K extends keyof CollectionMap>(name: K): Promise<Collection<CollectionMap[K]>> {
  const db = await getDb();
  return db.collection<CollectionMap[K]>(name);
}
