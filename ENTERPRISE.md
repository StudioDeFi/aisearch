# AISEARCH ELITE — Enterprise Edition

This document describes enterprise-grade features, SLA commitments, and support options available to organizations running AISEARCH ELITE in production.

---

## Enterprise Features

| Feature | Community | Enterprise |
|---------|-----------|------------|
| Search modes (Standard / Semantic / Hybrid / Research) | ✅ | ✅ |
| BM25 + vector hybrid ranking | ✅ | ✅ |
| Docker Compose deployment | ✅ | ✅ |
| Multi-tenant namespace isolation | ❌ | ✅ |
| Role-based access control (RBAC) | ❌ | ✅ |
| SSO / SAML 2.0 / OIDC integration | ❌ | ✅ |
| Audit logging & compliance exports | ❌ | ✅ |
| Federated search across multiple indexes | ❌ | ✅ |
| Priority SLA & dedicated support | ❌ | ✅ |
| Custom LLM / embedding provider integration | ❌ | ✅ |
| On-premise / air-gapped deployment guides | ❌ | ✅ |

---

## Architecture for Production

### High-Availability Deployment

```
                        ┌───────────────────────────────┐
                        │   Load Balancer (e.g., ALB)    │
                        └───────────────┬───────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
            │  Gateway × N   │  │  Gateway × N   │  │  Gateway × N   │
            └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                    └───────────────────┼───────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
      ┌───────▼───────┐       ┌─────────▼───────┐       ┌────────▼────────┐
      │  Crawler Pool  │       │  Indexing Pool   │       │  Ranking Pool   │
      └───────────────┘       └─────────────────┘       └─────────────────┘
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        │
        ┌──────────────────────────────┬┴─────────────────────────────┐
        │   PostgreSQL (primary/rep)    │  Redis Cluster               │
        │   Qdrant cluster (3+ nodes)   │  OpenSearch cluster (3+ nodes)│
        └──────────────────────────────┴──────────────────────────────┘
```

### Recommended Kubernetes Manifests

Helm charts and Kubernetes manifests for production deployment are available to Enterprise customers. Contact us for access.

---

## Security Hardening

Enterprise deployments should follow these additional controls:

- **Network policies**: restrict inter-service traffic to only required ports
- **Secrets management**: use HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets (encrypted at rest)
- **mTLS**: enable mutual TLS between microservices with cert-manager + Istio/Linkerd
- **Image signing**: sign all container images with Cosign/Sigstore
- **Runtime security**: deploy Falco for runtime anomaly detection
- **Regular scans**: integrate Trivy (already in CI) with a scheduled scan and policy gate

---

## SLA Commitments (Enterprise Tier)

| Tier | Uptime SLA | Response Time |
|------|-----------|---------------|
| Standard Enterprise | 99.5% | Next business day |
| Premium Enterprise | 99.9% | 4 hours (24/7) |
| Mission-Critical | 99.99% | 1 hour (24/7) |

---

## Support

| Channel | Community | Enterprise |
|---------|-----------|------------|
| GitHub Issues | ✅ | ✅ |
| GitHub Discussions | ✅ | ✅ |
| Dedicated Slack channel | ❌ | ✅ |
| Private email support | ❌ | ✅ |
| On-site / video consulting | ❌ | ✅ (Premium+) |

**Contact**: [enterprise@studiodefi.com](mailto:enterprise@studiodefi.com)

---

## Licensing

The Community Edition is released under the [MIT License](LICENSE).  
Enterprise features are available under a commercial license — contact us for pricing and terms.

---

*© 2026 StudioDeFi. All rights reserved.*
