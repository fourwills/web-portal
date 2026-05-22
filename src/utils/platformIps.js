/**
 * Platform IPs configured by the provider — not fetched from the API.
 * Format: "1.1.1.1" or "1.1.1.1:5060,2.2.2.2:5060"
 */
export function getConfiguredPlatformIps() {
  const raw = import.meta.env.VITE_PLATFORM_IPS?.trim();
  if (!raw) return [];

  return raw.split(',').map((part, index) => {
    const segment = part.trim();
    if (!segment) return null;
    const [ip, portPart] = segment.includes(':') ? segment.split(':') : [segment, '5060'];
    return {
      id: `platform-${index}`,
      ip: ip.trim(),
      port: parseInt(portPart, 10) || 5060,
    };
  }).filter(Boolean);
}
