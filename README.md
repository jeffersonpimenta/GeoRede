# Mapa da Rede de Baixa Tensão — BDGD/ANEEL

Sistema web para visualização interactiva da rede elétrica BT/MT ingerida via BDGD (ANEEL).
Stack: React + MapLibre GL JS · FastAPI · Martin Tile Server · PostgreSQL 16 + PostGIS 3.4 · Docker Compose.

---

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|--------------|
| Docker | 24+ |
| Docker Compose | v2.x |
| RAM | 8 GB |
| Disco livre | 50 GB (200 GB+ para múltiplas distribuidoras) |
| SO | Linux (Ubuntu 22.04+) ou macOS |

---

## Arrancar do zero

```bash
# 1. Clonar e entrar na pasta
git clone <repo> rede-bt-map && cd rede-bt-map

# 2. Criar ficheiro de variáveis de ambiente
cp .env.example .env
# Editar .env e definir DB_USER, DB_PASSWORD, DB_NAME

# 3. Construir imagens e iniciar todos os serviços
docker compose up --build -d

# 4. Verificar estado (aguardar db ficar healthy)
docker compose ps
```

---

## Aceder aos serviços

| Serviço | URL |
|---------|-----|
| Interface web (Mapa + Ingestão) | http://localhost |
| API REST (Swagger UI) | http://localhost:8000/docs |
| Tile Server (catálogo de layers) | http://localhost:3000/catalog |
| PostgreSQL | localhost:5432 |

---

## Ingerir os primeiros dados

1. Aceder a http://localhost → aba **Ingestão**
2. Seleccionar a distribuidora e o ano de referência
3. Colar a URL do ficheiro `.gdb` (disponível em https://dadosabertos.aneel.gov.br/dataset/base-de-dados-geografica-da-distribuidora-bdgd)
4. Seleccionar as entidades a ingerir (RAMBT, RAMMT, TRAFO, etc.)
5. Clicar **Iniciar Ingestão** e aguardar o progresso

---

## Verificar a base de dados

```bash
# Listar tabelas do schema rede_bt
docker compose exec db psql -U $DB_USER -d $DB_NAME -c "\dt rede_bt.*"

# Contar registos numa tabela
docker compose exec db psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM rede_bt.seg_bt;"

# Verificar versão PostGIS
docker compose exec db psql -U $DB_USER -d $DB_NAME -c "SELECT PostGIS_version();"
```

---

## Parar e reiniciar

```bash
# Parar sem apagar dados
docker compose down

# Reiniciar
docker compose up -d

# Reset total — apaga todos os dados da BD
docker compose down -v && docker compose up --build -d
```

---

## Troubleshooting

### Porta já em uso

```
Error: bind: address already in use
```

Verificar qual processo usa a porta e terminá-lo, ou alterar a porta no `docker-compose.yml`:

```bash
sudo lsof -i :5432   # ou :8000, :3000, :80
```

### DB não fica healthy

```bash
docker compose logs db
```

Causas comuns: volume corrompido (`docker compose down -v`) ou credenciais erradas no `.env`.

### ogr2ogr não encontrado no worker

O worker usa a imagem `ghcr.io/osgeo/gdal:ubuntu-small-3.8.5` que inclui GDAL.
Se o build falhar, verificar conectividade à internet e espaço em disco.

### Tile server não retorna tiles

```bash
docker compose logs tileserver
curl http://localhost:3000/catalog
```

O tileserver requer que o schema `rede_bt` exista (F0-T02). Se a BD foi reiniciada sem volume, executar:

```bash
docker compose down -v && docker compose up -d
```

---

## Estrutura do projecto

```
├── docker-compose.yml
├── .env.example
├── db/init/           ← scripts SQL executados no primeiro arranque
├── api/               ← FastAPI (Python 3.12)
├── tileserver/        ← configuração Martin
├── worker/            ← script de ingestão ogr2ogr (Python + GDAL)
└── frontend/          ← React + MapLibre GL JS (servido por Nginx)
```

---

## Fontes de dados

| Fonte | Licença |
|-------|---------|
| BDGD — ANEEL (https://dadosabertos.aneel.gov.br) | ODbL |
| OpenFreeMap (estilos de mapa) | ODbL |
| MapLibre GL JS | BSD-2-Clause |

*Obrigatório citar a fonte ANEEL/BDGD nas interfaces que apresentem estes dados.*
