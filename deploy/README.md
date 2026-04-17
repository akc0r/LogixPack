# LogixPack Deployment Bundle

Ce bundle contient tout le necessaire pour lancer la stack complete via Docker Compose:

- frontend Next.js
- backend FastAPI
- MinIO

## Contenu

- `docker-compose.yml`
- `.env`

## Prerequis

- Docker Engine 24+
- Docker Compose v2+

## Demarrage

```bash
docker compose --env-file .env -f docker-compose.yml up -d
```

Services exposes:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

## Arret

```bash
docker compose --env-file .env -f docker-compose.yml down
```

## Personnalisation

- `NEXT_PUBLIC_API_URL`: URL publique du backend appelee par le navigateur.
- `MINIO_ROOT_USER` et `MINIO_ROOT_PASSWORD`: credentials MinIO.
- `MINIO_BUCKET`: bucket de stockage des instances et resultats.