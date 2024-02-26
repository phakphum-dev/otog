compose:
	docker compose -f docker-compose.yml up -d
compose-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
