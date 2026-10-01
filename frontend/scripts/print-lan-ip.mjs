import os from "node:os";

/**
 * Categorizes active IPv4 network interfaces into Physical LAN vs Virtual/VPN/Tunnel.
 */
export function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const physical = [];
  const virtual = [];

  for (const [name, list] of Object.entries(interfaces)) {
    if (!list) continue;
    for (const net of list) {
      if (net.family !== "IPv4" || net.internal) continue;

      const lowerName = name.toLowerCase();
      const isVirtual =
        lowerName.includes("vgate") ||
        lowerName.includes("wintun") ||
        lowerName.includes("vethernet") ||
        lowerName.includes("virtual") ||
        lowerName.includes("vpn") ||
        lowerName.includes("wireguard") ||
        lowerName.includes("tailscale") ||
        lowerName.includes("docker") ||
        lowerName.includes("wsl") ||
        lowerName.includes("local area connection*") ||
        net.netmask === "255.255.255.255";

      const entry = {
        name,
        address: net.address,
        netmask: net.netmask,
        isVirtual,
      };

      if (isVirtual) {
        virtual.push(entry);
      } else {
        physical.push(entry);
      }
    }
  }

  // Prioritize primary physical adapters (Wi-Fi, Ethernet) first
  physical.sort((a, b) => {
    const score = (name) => {
      const n = name.toLowerCase();
      if (n === "wi-fi" || n === "ethernet") return 10;
      if (n.includes("wi-fi") || n.includes("ethernet")) return 5;
      return 0;
    };
    return score(b.name) - score(a.name);
  });

  return { physical, virtual };
}

/**
 * Prints a helpful guide indicating which URL other devices on the LAN should use.
 */
export function printNetworkSummary(port = 3000) {
  const { physical, virtual } = getNetworkInfo();

  console.log("\n============================================================");
  console.log("  🚀 Next.js Development Server — Network Access Guide");
  console.log("============================================================");
  console.log(`  - Localhost (This PC):    http://localhost:${port}`);

  if (physical.length > 0) {
    console.log("\n  ✅ Physical LAN Access URL (for other devices on Wi-Fi/LAN):");
    for (const item of physical) {
      console.log(`     👉 http://${item.address}:${port}   [Adapter: ${item.name}]`);
    }
  } else {
    console.log("\n  ⚠️  No physical LAN adapter detected.");
  }

  if (virtual.length > 0) {
    console.log("\n  ℹ️  Virtual / Tunnel / VPN Adapters (NOT reachable from LAN):");
    for (const item of virtual) {
      console.log(`     - http://${item.address}:${port}   [${item.name} — VPN/Virtual]`);
    }
  }

  console.log("============================================================\n");
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/print-lan-ip.mjs")) {
  const port = process.env.PORT || 3000;
  printNetworkSummary(port);
}
