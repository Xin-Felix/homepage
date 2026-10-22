# Offline IP region data

This directory contains the IPv4 and IPv6 XDB snapshots used only by the backend to resolve a region at visit-log creation time. The backend never sends visitor IP addresses to an external geolocation API.

- Source: [lionsoul2014/ip2region](https://github.com/lionsoul2014/ip2region)
- Data tag: `v3.18.0` (published 2026-09-08)
- Query client: `org.lionsoul:ip2region:3.3.7`
- License: `Apache-2.0 OR MIT`

| File | SHA-256 |
|---|---|
| `ip2region_v4.xdb` | `8e31bbdccb5bf21028af10592d4312ec975da0bffa108c0c5d862a12190f9ad3` |
| `ip2region_v6.xdb` | `939f6b46bd2b8bec3cf7c5ceb8ba782266ae9b1f35b5ba7916700dec0b7506ed` |

To refresh the database, download both files from the same upstream tag, verify checksums, update this file, rebuild the backend image, and deploy it with the normal backup procedure.
