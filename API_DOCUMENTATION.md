# SEPOMEX Crawler API Documentation

## Overview

RESTful API microservice for querying Mexican postal codes (SEPOMEX data). The service automatically crawls and updates postal code data, providing real-time access through a fast, in-memory cache.

**Base URL:** `http://localhost:9000`

**Version:** 2.0.0

---

## Features

- Fast in-memory data access (O(1) lookup by postal code)
- Full-text search by state, city, municipality, and colony
- Automatic data updates via cron scheduler
- Health checks for Kubernetes integration
- Prometheus metrics for monitoring
- 157,284+ records covering 31,929+ postal codes
- Professional logging without emojis
- Lightweight: ~20MB RAM usage

---

## Endpoints

### Health & Monitoring

#### GET /health
Complete health check with system information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T17:35:58.039Z",
  "uptime": 113.530492093,
  "checks": {
    "dataFiles": {
      "status": "healthy",
      "version": "20251117",
      "fileSize": 8799965,
      "lastModified": "2025-11-17T15:58:36.838Z"
    },
    "memory": {
      "status": "healthy",
      "heapUsed": "25 MB",
      "heapTotal": "27 MB",
      "rss": "82 MB",
      "systemMemory": {
        "total": "7837 MB",
        "free": "7239 MB",
        "usedPercent": "8%"
      }
    },
    "disk": {
      "status": "healthy",
      "dataDir": { "exists": true, "path": "./data" },
      "downloadsDir": { "exists": true, "path": "./downloads" }
    },
    "process": {
      "status": "healthy",
      "pid": 1,
      "nodeVersion": "v20.19.5",
      "platform": "linux",
      "arch": "arm64",
      "uptime": "114s"
    }
  }
}
```

#### GET /healthz
Kubernetes liveness probe - simple health check.

**Response:**
```json
{ "status": "ok" }
```

#### GET /ready
Kubernetes readiness probe - checks if service is ready to receive traffic.

**Response:**
```json
{ "ready": true }
```

#### GET /metrics
Prometheus metrics endpoint.

**Response:** Plain text Prometheus format
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/postal-codes/:code",status_code="200"} 5

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 86409216
...
```

---

### Postal Code Queries

#### GET /api/postal-codes/:code
Get details for a specific postal code.

**Parameters:**
- `code` (path) - 5-digit postal code (leading zeros optional)

**Example Request:**
```bash
curl http://localhost:9000/api/postal-codes/06600
```

**Response:**
```json
{
  "cp": "06600",
  "estado": "Ciudad de México",
  "municipio": "Cuauhtémoc",
  "ciudad": "Ciudad de México",
  "colonias": ["Juárez"]
}
```

**Error Response (404):**
```json
{
  "error": "Código postal no encontrado",
  "code": "06999"
}
```

---

#### GET /api/postal-codes/search
Search postal codes by criteria. Uses partial, case-insensitive matching.

**Query Parameters:**
- `state` (optional) - Filter by state name
- `city` (optional) - Filter by city name
- `municipality` (optional) - Filter by municipality name
- `colony` (optional) - Filter by colony name

**Note:** Results are limited to 100 records maximum.

**Example Request:**
```bash
curl "http://localhost:9000/api/postal-codes/search?state=Jalisco&city=Guadalajara&limit=3"
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "cp": "44100",
      "estado": "Jalisco",
      "municipio": "Guadalajara",
      "ciudad": "Guadalajara",
      "colonias": ["Guadalajara Centro"]
    },
    {
      "cp": "44110",
      "estado": "Jalisco",
      "municipio": "Guadalajara",
      "ciudad": "Guadalajara",
      "colonias": ["Vallarta Poniente"]
    },
    {
      "cp": "44130",
      "estado": "Jalisco",
      "municipio": "Guadalajara",
      "ciudad": "Guadalajara",
      "colonias": ["Arcos Vallarta", "Arcos"]
    }
  ]
}
```

**Example: Search by colony**
```bash
curl "http://localhost:9000/api/postal-codes/search?colony=Centro"
```

**Example: Multiple criteria**
```bash
curl "http://localhost:9000/api/postal-codes/search?state=Jalisco&municipality=Zapopan"
```

---

#### GET /api/postal-codes
Get all postal codes with pagination.

**Query Parameters:**
- `limit` (optional, default: 100) - Number of results per page (max: 1000)
- `offset` (optional, default: 0) - Starting offset for pagination

**Example Request:**
```bash
curl "http://localhost:9000/api/postal-codes?limit=5&offset=0"
```

**Response:**
```json
{
  "total": 31929,
  "limit": 5,
  "offset": 0,
  "count": 5,
  "data": [
    {
      "cp": "10000",
      "estado": "Ciudad de México",
      "municipio": "La Magdalena Contreras",
      "ciudad": "Ciudad de México",
      "colonias": ["Lomas Quebradas"]
    },
    {
      "cp": "10010",
      "estado": "Ciudad de México",
      "municipio": "La Magdalena Contreras",
      "ciudad": "Ciudad de México",
      "colonias": ["La Malinche", "San Bartolo Ameyalco"]
    }
    // ... more results
  ]
}
```

---

### Version Information

#### GET /api/versions/latest
Get information about the latest downloaded version.

**Example Request:**
```bash
curl http://localhost:9000/api/versions/latest
```

**Response:**
```json
{
  "version": "20251117",
  "downloadDate": "2025-11-17T15:58:36.840Z",
  "fileDate": null,
  "fileSize": 2126672,
  "recordCount": 157284,
  "postalCodeCount": 31929,
  "fileName": "20251117.txt"
}
```

#### GET /api/versions
Get all version history.

**Response:**
```json
{
  "versions": [
    {
      "version": "20251117",
      "downloadDate": "2025-11-17T15:58:36.840Z",
      "fileSize": 2126672,
      "recordCount": 157284,
      "postalCodeCount": 31929
    }
    // ... more versions
  ],
  "lastUpdated": "2025-11-17T15:58:37.123Z"
}
```

#### GET /api/versions/:version
Get information about a specific version.

**Parameters:**
- `version` (path) - Version identifier (e.g., "20251117")

**Response:** Same as `/api/versions/latest`

---

### API Information

#### GET /api
Get API metadata and available endpoints.

**Response:**
```json
{
  "name": "SEPOMEX Crawler API",
  "version": "1.0.0",
  "description": "API para consultar códigos postales de SEPOMEX",
  "endpoints": {
    "health": "/health",
    "metrics": "/metrics",
    "postalCodes": {
      "byCode": "/api/postal-codes/:code",
      "search": "/api/postal-codes/search",
      "all": "/api/postal-codes"
    },
    "versions": {
      "latest": "/api/versions/latest",
      "all": "/api/versions",
      "specific": "/api/versions/:version"
    }
  }
}
```

---

## Error Handling

All errors return appropriate HTTP status codes and a JSON error object:

**404 Not Found:**
```json
{
  "error": "Código postal no encontrado",
  "code": "99999"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message here"
}
```

---

## Rate Limiting

Currently, there are no rate limits implemented. The service can handle concurrent requests efficiently due to in-memory caching.

---

## Data Updates

The service automatically checks for new SEPOMEX data:
- **Schedule:** Every Monday at 3:00 AM (Mexico City time)
- **Automatic reload:** API data cache refreshes when new versions are downloaded
- **Manual trigger:** Use `make download` to force an immediate download

---

## Deployment

### Docker

```bash
# Build and start
make rebuild

# Check logs
make logs

# Check health
curl http://localhost:9000/health
```

### Kubernetes

See [k8s/README.md](k8s/README.md) for Kubernetes deployment instructions.

The API includes:
- Liveness probe: `/healthz`
- Readiness probe: `/ready`
- Metrics: `/metrics` (Prometheus compatible)

---

## Performance

- **Memory usage:** ~20MB RAM (lightweight)
- **Lookup performance:** O(1) for postal code queries
- **Search performance:** O(n) for search queries (limited to 100 results)
- **Data size:** ~8.8MB JSON in memory
- **Total records:** 157,284+
- **Unique postal codes:** 31,929+

---

## Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get postal code details
const response = await axios.get('http://localhost:9000/api/postal-codes/06600');
console.log(response.data);

// Search by state
const search = await axios.get('http://localhost:9000/api/postal-codes/search', {
  params: { state: 'Jalisco', city: 'Guadalajara' }
});
console.log(search.data);
```

### Python
```python
import requests

# Get postal code details
response = requests.get('http://localhost:9000/api/postal-codes/06600')
print(response.json())

# Search by state
search = requests.get('http://localhost:9000/api/postal-codes/search',
                     params={'state': 'Jalisco', 'city': 'Guadalajara'})
print(search.json())
```

### cURL
```bash
# Get specific postal code
curl http://localhost:9000/api/postal-codes/06600

# Search with filters
curl "http://localhost:9000/api/postal-codes/search?state=Jalisco&limit=10"

# Get paginated list
curl "http://localhost:9000/api/postal-codes?limit=20&offset=100"

# Check health
curl http://localhost:9000/health

# Get Prometheus metrics
curl http://localhost:9000/metrics
```

---

## Monitoring with Prometheus

Add this to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'sepomex-api'
    static_configs:
      - targets: ['localhost:9000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

Available metrics:
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - HTTP request duration histogram
- `postal_code_searches_total` - Postal code search operations
- `crawler_runs_total` - Crawler execution count
- `process_*` - Node.js process metrics (memory, CPU, etc.)
- `nodejs_*` - Node.js runtime metrics

---

## Support

For issues or questions:
- GitHub: https://github.com/forozco/sepomex-crawler
- Report issues: https://github.com/forozco/sepomex-crawler/issues

---

## License

MIT
