/** Base URL สำหรับ fetch จากเบราว์เซอร์ไปยัง Nest API */
export function getClientApiBaseUrl(): string {
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (pub) {
    if (typeof window !== "undefined" && window.location?.hostname) {
      const host = window.location.hostname;
      const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
      if (!isLocalhost && (pub.includes("localhost") || pub.includes("127.0.0.1"))) {
        return pub
          .replace("://localhost", `://${host}`)
          .replace("://127.0.0.1", `://${host}`)
          .replace(/\/$/, "");
      }
    }
    return pub.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4100/api`;
  }
  return "http://localhost:4100/api";
}

