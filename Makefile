.PHONY: up down docker_clean_all


# General worflow
## Start all Docker containers
up:
	docker compose up -d --build

## Stop and remove all Docker containers and volumes defined in docker compose
down:
	docker compose down -v

## Full Docker cleanup
docker_clean_all:
	docker stop $$(docker ps -aq) 2>/dev/null || true && \
	docker rm -f $$(docker ps -aq) 2>/dev/null || true && \
	docker rmi -f $$(docker images -q) 2>/dev/null || true && \
	docker volume rm $$(docker volume ls -q) 2>/dev/null || true && \
	docker network rm $$(docker network ls -q | grep -v "bridge\|host\|none") 2>/dev/null || true && \
	docker system prune -a --volumes -f


# Services
## node-load-balancer
### Start the service
nlb_start:
	docker compose up -d --build node-load-balancer_service

### Down the service
nlb_down:
	docker compose stop node-load-balancer_service

### Restart the service
nlb_restart:
	docker compose up -d --build node-load-balancer_service

### Show service's logs
nlb_logs:
	docker compose logs node-load-balancer_service

### Open an interactive bash shell
nlb_bash:
	docker exec -it node-load-balancer_container sh


## server
### Start the service
serv_start:
	docker compose up -d --build server_service

### Down the service
serv_down:
	docker compose stop server_service

### Restart the service
serv_restart:
	docker compose up -d --build server_service

### Show service's logs
serv_logs:
	docker compose logs server_service

### Open an interactive bash shell
serv_bash:
	docker exec -it server_container sh


## bitcoin-node
### Start the service
bn_start:
	docker compose up -d --build bitcoin-node_service

### Down the service
bn_down:
	docker compose stop bitcoin-node_service

### Restart the service
bn_restart:
	docker compose up -d --build bitcoin-node_service

### Show service's logs
bn_logs:
	docker compose logs bitcoin-node_service

### Open an interactive bash shell
bn_bash:
	docker exec -it bitcoin-node_container bash


## Ethereum Jwt token setup
gen_jwt:
	openssl rand -hex 32 > ./nodes/ethereum-node/jwt/jwt.hex

## ethereum-geth-node
### Start the service
eth-geth_start:
	docker compose up -d --build ethereum-geth-node_service

### Down the service
eth-geth_down:
	docker compose stop ethereum-geth-node_service

### Restart the service
eth-geth_restart:
	docker compose up -d --build ethereum-geth-node_service

### Show service's logs
eth-geth_logs:
	docker compose logs ethereum-geth-node_service

### Open an interactive bash shell
eth-geth_bash:
	docker exec -it ethereum-geth-node_container sh


## ethereum-prysm-node
### Start the service
eth-prysm_start:
	docker compose up -d --build ethereum-prysm-node_service

### Down the service
eth-prysm_down:
	docker compose stop ethereum-prysm-node_service

### Restart the service
eth-prysm_restart:
	docker compose up -d --build ethereum-prysm-node_service

### Show service's logs
eth-prysm_logs:
	docker compose logs ethereum-prysm-node_service

### Open an interactive bash shell
eth-prysm_bash:
	docker exec -it ethereum-prysm-node_container sh










