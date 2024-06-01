compose:
	docker compose -f docker-compose.yml up -d

compose-pull:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

compose-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
