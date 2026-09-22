const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "mongo"]);

/** Hosts de una URI mongodb:// (todos los del seed list). Una URI `mongodb+srv://` devuelve el host del cluster. */
export function mongoHosts(uri: string): string[] {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const authority = withoutScheme.split(/[/?]/)[0] ?? "";
  const hostList = authority.includes("@") ? authority.slice(authority.lastIndexOf("@") + 1) : authority;
  return hostList
    .split(",")
    .map((h) => (h.startsWith("[") ? h.slice(0, h.indexOf("]") + 1) : (h.split(":")[0] ?? h)).toLowerCase())
    .filter(Boolean);
}

/** `true` solo si la URI apunta exclusivamente a localhost / 127.0.0.1 / mongo (contenedor de CI). */
export function isLocalMongoUri(uri: string): boolean {
  if (uri.startsWith("mongodb+srv://")) return false;
  const hosts = mongoHosts(uri);
  return hosts.length > 0 && hosts.every((h) => LOCAL_HOSTS.has(h));
}

/** Guarda de la regla 8: los borrados masivos jamás corren contra una BD remota. */
export function assertSafeToReset(uri: string): void {
  if (!isLocalMongoUri(uri)) {
    throw new Error(
      "seed --reset rechazado: MONGODB_URI no apunta a localhost, 127.0.0.1 ni mongo. " +
        "Los borrados masivos solo se permiten contra una base de datos local.",
    );
  }
}
