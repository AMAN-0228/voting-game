# Production Socket.IO Deployment Guide

## 🏭 Industrial Socket.IO Configuration for Next.js 15

### **Production Socket Paths by Platform**

| Platform | Recommended Path | Environment Variable |
|----------|------------------|---------------------|
| **Nginx Reverse Proxy** | `/realtime` | `SOCKET_PATH=/realtime` |
| **Vercel** | `/api/socket` | `SOCKET_PATH=/api/socket` |
| **AWS ELB/ALB** | `/ws` | `SOCKET_PATH=/ws` |
| **Kubernetes** | `/ws` | `SOCKET_PATH=/ws` |
| **Docker** | `/socket` | `SOCKET_PATH=/socket` |
| **Cloudflare** | `/realtime` | `SOCKET_PATH=/realtime` |

### **Environment Variables for Production**

```bash
# Core Configuration
NODE_ENV=production
SOCKET_PATH=/realtime
NEXT_PUBLIC_SOCKET_PATH=/realtime

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### **Nginx Configuration Example**

```nginx
upstream nextjs_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Socket.IO proxy
    location /realtime/ {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Socket.IO specific
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # Next.js app
    location / {
        proxy_pass http://nextjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Docker Production Setup**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

EXPOSE 3000

# Production environment
ENV NODE_ENV=production
ENV SOCKET_PATH=/socket
ENV NEXT_PUBLIC_SOCKET_PATH=/socket

CMD ["npm", "start"]
```

### **Kubernetes Deployment**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-game
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vibe-game
  template:
    metadata:
      labels:
        app: vibe-game
    spec:
      containers:
      - name: vibe-game
        image: your-registry/vibe-game:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: SOCKET_PATH
          value: "/ws"
        - name: NEXT_PUBLIC_SOCKET_PATH
          value: "/ws"
        - name: ALLOWED_ORIGINS
          value: "https://yourdomain.com"
---
apiVersion: v1
kind: Service
metadata:
  name: vibe-game-service
spec:
  selector:
    app: vibe-game
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: LoadBalancer
```

### **Load Balancer Considerations**

For production with multiple instances, enable sticky sessions:

```bash
# AWS ALB Target Group
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/name \
  --attributes Key=stickiness.enabled,Value=true \
              Key=stickiness.type,Value=lb_cookie \
              Key=stickiness.lb_cookie.duration_seconds,Value=86400
```

### **Monitoring & Health Checks**

Add to your Next.js API routes:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    socket: process.env.SOCKET_PATH || '/api/socket'
  })
}
```

### **Security Best Practices**

1. **CORS**: Restrict origins to your domains only
2. **Rate Limiting**: Implement connection rate limiting
3. **Authentication**: Validate JWT tokens in socket middleware
4. **Firewall**: Only expose necessary ports
5. **SSL**: Always use HTTPS/WSS in production

### **Performance Optimizations**

1. **Connection Pooling**: Use Redis adapter for horizontal scaling
2. **Compression**: Enable WebSocket compression
3. **CDN**: Use CDN for static assets, direct connection for WebSocket
4. **Resource Limits**: Set appropriate memory/CPU limits
5. **Monitoring**: Use APM tools for real-time monitoring
