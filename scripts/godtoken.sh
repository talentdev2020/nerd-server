#!/usr/bin/env sh

#node --nolazy -r ts-node/register/transpile-only -r tsconfig-paths/register scripts/gen-jwt -- -e god@mode.com -p P@ssw0rd

docker exec \
	-t wallet-server-wallet-server-1 \
	/usr/local/bin/node \
		--nolazy \
		-r ts-node/register/transpile-only \
		-r tsconfig-paths/register scripts/gen-jwt \
		-- \
		-e "god@mode.com" \
		-p "P@ssw0rd"
