import { ObjectId } from "mongodb";
import type { Role, UserDTO } from "@/lib/types";
import { col, type UserDoc } from "./collections";

export function toUserDTO(doc: UserDoc): UserDTO {
  return { id: doc._id.toHexString(), email: doc.email, name: doc.name, role: doc.role };
}

export async function findUserByEmail(email: string): Promise<UserDTO | null> {
  const doc = await (await col("users")).findOne({ email });
  return doc ? toUserDTO(doc) : null;
}

export async function findUserById(id: string): Promise<UserDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("users")).findOne({ _id: new ObjectId(id) });
  return doc ? toUserDTO(doc) : null;
}

/** Nombre por defecto a partir del email: "ana.perez@x.com" → "Ana Perez". */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || email;
}

/**
 * Upsert por email. `role` solo se aplica si se indica (admin por ADMIN_EMAIL);
 * un usuario existente conserva su rol salvo promoción explícita.
 */
export async function upsertUser(input: { email: string; name?: string; role?: Role }): Promise<UserDTO> {
  const users = await col("users");
  const now = new Date();
  const promote = input.role === "admin";
  // `role` no puede estar a la vez en $set y $setOnInsert: Mongo lo rechaza como conflicto.
  const doc = await users.findOneAndUpdate(
    { email: input.email },
    {
      $setOnInsert: {
        name: input.name ?? nameFromEmail(input.email),
        createdAt: now,
        ...(promote ? {} : { role: input.role ?? ("student" as const) }),
      },
      $set: { lastLoginAt: now, ...(promote ? { role: "admin" as const } : {}) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("No se pudo crear el usuario");
  return toUserDTO(doc);
}

export async function listUsersByIds(ids: string[]): Promise<Map<string, UserDTO>> {
  const objectIds = ids.filter((i) => ObjectId.isValid(i)).map((i) => new ObjectId(i));
  const docs = await (await col("users")).find({ _id: { $in: objectIds } }).toArray();
  return new Map(docs.map((d) => [d._id.toHexString(), toUserDTO(d)]));
}
