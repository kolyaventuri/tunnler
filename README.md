# Tunnler

A Node.js library and CLI tool for creating Cloudflare tunnels with DNS management. Tunnler simplifies the process of exposing local services through Cloudflare's tunnel infrastructure.

## Features

- 🔧 Easy initialization with Cloudflare credentials
- 🌐 Automatic DNS record management
- 🚀 Simple tunnel creation and management
- 📦 Available as both CLI tool and Node.js module
- 🔒 Credential storage

## Prerequisites

- Node.js 18+ 
- Cloudflare account with API access
- `cloudflared` CLI tool installed and authenticated

### Installing cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Download from https://github.com/cloudflare/cloudflared/releases
```

## Installation

```bash
npm intall tunnler
```

## Quick Start

### 1. Initialize Tunnler

First, you need to initialize tunnler with your Cloudflare credentials:

```bash
# Interactive mode (will prompt for credentials)
npx tunnler init

# Or provide credentials directly
npx tunnler init --apiKey YOUR_API_KEY --accountId YOUR_ACCOUNT_ID --zone yourdomain.com
```

This will store your credentials in `~/.tunnler/credentials.json`.

### 2. Create a Tunnel

```bash
# Basic tunnel to localhost:3000
npx tunnler --port 3000

# With custom subdomain
npx tunnler --port 3000 --subdomain myapp

# With specific zone
npx tunnler --port 3000 --subdomain myapp --zone mydomain.com
```

## CLI Usage

### Commands

#### `init` - Initialize Configuration

Initialize tunnler with your Cloudflare credentials:

```bash
tunnler init [options]
```

**Options:**
- `-a, --apiKey <key>` - Cloudflare API key
- `-i, --accountId <id>` - Cloudflare account ID  
- `-z, --zone <zone>` - Default zone to use
- `-h, --help` - Show help

**Examples:**
```bash
# Interactive mode
tunnler init

# With all options
tunnler init --apiKey abc123 --accountId def456 --zone example.com
```

#### `tunnel` - Create Tunnel (default command)

Create a tunnel to expose a local service:

```bash
tunnler [tunnel] [options]
```

**Options:**
- `-p, --port <port>` - Port to tunnel to (required)
- `-s, --subdomain <subdomain>` - Subdomain name (default: random)
- `-z, --zone <zone>` - Zone to use (default: from init)
- `-e, --service <service>` - Service URL (default: http://localhost)
- `-a, --apiKey <key>` - Override API key
- `-i, --accountId <id>` - Override account ID
- `-h, --help` - Show help

**Examples:**
```bash
# Basic tunnel
tunnler --port 3000

# With custom subdomain
tunnler --port 3000 --subdomain myapp

# With specific zone
tunnler --port 3000 --subdomain myapp --zone mydomain.com

# Tunnel to different service
tunnler --port 8080 --service http://192.168.1.100
```

## Module Usage

### Basic Setup

_Note:_ Init options are only required if you have _not_ set up your `~/.tunnler/credentials.json` file. Other options for loading are diretly from `process.env`, as well as a `.env` file

```javascript
import * as Tunnel from 'tunnler';

// Initialize with credentials
Tunnel.init({
  apiKey: 'your-api-key',
  accountId: 'your-account-id',
  defaultZone: 'yourdomain.com'
});

// Create and connect tunnel
const tunnel = await Tunnel.createTunnel({
  port: 3000,
  subdomain: 'myapp'
});

await tunnel.connect();
```

### Advanced Usage

```javascript
import * as Tunnel from 'tunnler';

// Initialize
Tunnel.init({
  apiKey: 'your-api-key',
  accountId: 'your-account-id',
  defaultZone: 'yourdomain.com'
});

// Create tunnel with all options
const tunnel = await Tunnel.createTunnel({
  port: 3000,
  subdomain: 'myapp',
  zone: 'customdomain.com',
  service: 'http://localhost'
});

// Connect to tunnel
await tunnel.connect();

// Later, close the tunnel
await tunnel.close();
```

### TypeScript Support

```typescript
import * as Tunnel from 'tunnler';

interface TunnelOptions {
  port: number;
  subdomain?: string;
  zone?: string;
  service?: string;
}

const tunnel = await Tunnel.createTunnel({
  port: 3000,
  subdomain: 'myapp'
} as TunnelOptions);
```

## Configuration

### Credential Storage

Tunnler stores credentials in `~/.tunnler/credentials.json`:

```json
{
  "CLOUDLFARE_API_KEY": "your-api-key",
  "CLOUDLFARE_ACCOUNT_ID": "your-account-id", 
  "DEFAULT_ZONE": "yourdomain.com"
}
```

### Environment Variables

You can also use environment variables:

```bash
export CLOUDLFARE_API_KEY="your-api-key"
export CLOUDLFARE_ACCOUNT_ID="your-account-id"
export DEFAULT_ZONE="yourdomain.com"
```

## API Reference

### `Tunnel.init(options)`

Initialize tunnler with credentials.

**Parameters:**
- `options.apiKey` (string) - Cloudflare API key
- `options.accountId` (string) - Cloudflare account ID
- `options.defaultZone` (string, optional) - Default zone to use
- `options.envPath` (string, optional) - Path to .env file

### `Tunnel.createTunnel(options)`

Create a new tunnel instance.

**Parameters:**
- `options.port` (number) - Port to tunnel to
- `options.subdomain` (string, optional) - Subdomain name (default: random UUID)
- `options.zone` (string, optional) - Zone to use (default: from init)
- `options.service` (string, optional) - Service URL (default: http://localhost)

**Returns:** Promise<Tunnel>

### Tunnel Instance

A tunnel instance has the following methods:

- `connect()` - Connect to the tunnel
- `close()` - Close the tunnel and cleanup resources

## Examples

### Development Server

```bash
# Start your development server
npm run dev

# In another terminal, create tunnel
tunnler --port 3000 --subdomain dev
```

### Docker Container

```bash
# Run container
docker run -p 8080:80 nginx

# Create tunnel to container
tunnler --port 8080 --subdomain nginx
```

### Multiple Services

```javascript
import * as Tunnel from 'tunnler';

Tunnel.init({
  apiKey: 'your-key',
  accountId: 'your-id',
  defaultZone: 'yourdomain.com'
});

// Frontend tunnel
const frontend = await Tunnel.createTunnel({
  port: 3000,
  subdomain: 'frontend'
});

// Backend tunnel  
const backend = await Tunnel.createTunnel({
  port: 8000,
  subdomain: 'api'
});

await Promise.all([
  frontend.connect(),
  backend.connect()
]);
```

## Troubleshooting

### Common Issues

1. **"Failed to initialize tunnler"**
   - Ensure your Cloudflare API key and account ID are correct
   - Check that you have the necessary permissions

2. **"Port is required"**
   - Always specify the `--port` option when creating tunnels

3. **"cloudflared not found"**
   - Install cloudflared CLI tool
   - Ensure it's in your PATH

4. **DNS errors**
   - Verify your zone exists in Cloudflare
   - Check that your API key has DNS management permissions

### Debug Mode

For debugging, you can check the stored credentials:

```bash
cat ~/.tunnler/credentials.json
```

## License

ISC
