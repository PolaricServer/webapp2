# Apache Proxy Configuration

## Overview

The Polaric Webapp2 uses Apache as a reverse proxy to forward requests from the frontend web server to the backend Polaric Server (aprsd) instance. The configuration is located in `debian/misc/aprs_ssl.conf`.

## Proxy Endpoints

### REST API Proxy (`/srv/`)

The `/srv/` path is proxied to the backend server for REST API calls:

```apache
ProxyPass /srv/ http://localhost:8081/ nocanon
ProxyPassReverse /srv/ http://localhost:8081/
```

- **ProxyPass**: Forwards all requests matching `/srv/*` to `http://localhost:8081/`
- **ProxyPassReverse**: Ensures proper URL rewriting in HTTP response headers
- **nocanon**: Prevents path normalization before proxying (preserves encoded characters)

Example: A request to `https://server/srv/api/objects` is forwarded to `http://localhost:8081/api/objects`

### WebSocket Proxy (`/ws/`)

The `/ws/` path is proxied for WebSocket connections:

```apache
<Location "/ws/">
   ProxyPass ws://localhost:8081/
   ProxyPassReverse ws://localhost:8081/
</Location>
```

WebSocket connections use the `ws://` protocol scheme for proxying real-time bidirectional communication between the client and backend.

## Important Configuration Notes

### Trailing Slashes

Both the source path and target URL use trailing slashes (`/srv/` and `http://localhost:8081/`). This ensures:
- Proper path mapping without duplication
- Consistent URL rewriting in responses
- Predictable behavior for all sub-paths

### SSL/TLS

The configuration enables SSL for the proxy:

```apache
SSLProxyEngine On
```

This allows the proxy to handle HTTPS connections to backend servers if needed. In the default configuration, the backend uses HTTP (`http://localhost:8081`), so SSL proxy engine is not strictly required but enabled for flexibility.

### Connection Settings

```apache
SetEnv proxy-nokeepalive 1
ProxyTimeout 180
```

- **proxy-nokeepalive**: Disables HTTP keep-alive for proxy connections
- **ProxyTimeout**: Sets a 180-second timeout for proxy requests

## Testing the Configuration

After deploying changes to the Apache configuration:

1. Restart Apache: `sudo systemctl restart apache2`
2. Test REST API access: `curl -k https://localhost/srv/api/endpoint`
3. Check WebSocket connectivity through the `/ws/` endpoint
4. Verify that redirect responses contain correct URLs

## Troubleshooting

If proxying fails:
- Check Apache error logs: `/var/log/apache2/error.log`
- Verify backend is running on port 8081
- Ensure required Apache modules are enabled:
  - `sudo a2enmod proxy`
  - `sudo a2enmod proxy_http`
  - `sudo a2enmod proxy_wstunnel` (for WebSocket support)
  - `sudo a2enmod ssl`
