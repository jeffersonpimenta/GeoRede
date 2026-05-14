# GeoRede — comandos de desenvolvimento
# Uso: make <alvo>
#
# Requer: docker compose, bash
# Carrega variáveis do .env automaticamente (se existir)
-include .env
export

# ─── Stack ────────────────────────────────────────────────────────────────────

up:        ## Sobe todos os serviços
	docker compose up -d

down:      ## Para todos os serviços (mantém volumes)
	docker compose down

restart:   ## Reinicia todos os serviços
	docker compose restart

logs:      ## Segue logs de todos os serviços
	docker compose logs -f

# ─── DB ───────────────────────────────────────────────────────────────────────

db-reset:  ## Apaga volume pgdata e reinicia DB (DESTRUTIVO — apaga tudo)
	docker compose down -v
	docker compose up -d db

db-shell:  ## Abre psql no container db
	docker compose exec db psql -U $(DB_USER) -d $(DB_NAME)

db-clean:  ## Trunca tabelas de dados (mantém schema)
	docker compose exec -T db psql -U $(DB_USER) -d $(DB_NAME) -c "\
		TRUNCATE TABLE \
			rede_bt.seg_bt, \
			rede_bt.seg_mt, \
			rede_bt.trafo, \
			rede_bt.subestacao, \
			rede_bt.consumidor_pj, \
			rede_bt.ingestao_log \
		RESTART IDENTITY;"

db-status: ## Mostra contagem de registos por tabela
	docker compose exec -T db psql -U $(DB_USER) -d $(DB_NAME) -c "\
		SELECT 'seg_bt'        AS tabela, COUNT(*) FROM rede_bt.seg_bt        UNION ALL \
		SELECT 'seg_mt'                 , COUNT(*) FROM rede_bt.seg_mt        UNION ALL \
		SELECT 'trafo'                  , COUNT(*) FROM rede_bt.trafo         UNION ALL \
		SELECT 'subestacao'             , COUNT(*) FROM rede_bt.subestacao    UNION ALL \
		SELECT 'consumidor_pj'          , COUNT(*) FROM rede_bt.consumidor_pj UNION ALL \
		SELECT 'ingestao_log'           , COUNT(*) FROM rede_bt.ingestao_log;"

db-migrate: ## Aplica 02_fk_migration.sql em DB existente
	docker compose exec -T db psql -U $(DB_USER) -d $(DB_NAME) \
		-f /docker-entrypoint-initdb.d/02_fk_migration.sql

# ─── Ingestão ─────────────────────────────────────────────────────────────────
# Uso: make reingest FILE=dados/Enel_CE_2017.gdb.zip DIST=ENEL_CE ANO=2017
reingest:  ## Re-ingere ficheiro local após limpar dados existentes
ifndef FILE
	$(error Especifica FILE=<caminho> DIST=<distribuidora> ANO=<ano>)
endif
ifndef DIST
	$(error Especifica DIST=<distribuidora> ex: DIST=ENEL_CE)
endif
ifndef ANO
	$(error Especifica ANO=<ano> ex: ANO=2017)
endif
	bash scripts/reingest.sh "$(FILE)" -d "$(DIST)" -a "$(ANO)" --no-confirm

reingest-confirm:  ## Re-ingere com confirmação interactiva
ifndef FILE
	$(error Especifica FILE=<caminho> DIST=<distribuidora> ANO=<ano>)
endif
	bash scripts/reingest.sh "$(FILE)" -d "$(DIST)" -a "$(ANO)"

# ─── Worker ───────────────────────────────────────────────────────────────────

worker-logs: ## Segue logs do worker
	docker compose logs -f worker

worker-shell: ## Shell no container worker (tem GDAL/ogr2ogr)
	docker compose exec worker bash

# ─── Ajuda ────────────────────────────────────────────────────────────────────

help:      ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
.PHONY: up down restart logs db-reset db-shell db-clean db-status db-migrate \
        reingest reingest-confirm worker-logs worker-shell help
