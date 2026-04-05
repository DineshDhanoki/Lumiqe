.PHONY: seal-secrets deploy-backend deploy-frontend

# ─── Secrets ──────────────────────────────────────────────────
# Generates encrypted SealedSecret values for k8s/sealed-secrets.yaml.
# Requires: kubectl (connected to cluster) + kubeseal (brew install kubeseal)
# Run once per environment; commit the output to git (safe — cluster-only decrypt).
seal-secrets:
	@echo "Creating plaintext secret (NOT committed)..."
	kubectl create secret generic lumiqe-secrets \
	  --from-literal=JWT_SECRET_KEY="$$JWT_SECRET_KEY" \
	  --from-literal=DATABASE_URL="$$DATABASE_URL" \
	  --from-literal=REDIS_URL="$$REDIS_URL" \
	  --from-literal=STRIPE_SECRET_KEY="$$STRIPE_SECRET_KEY" \
	  --from-literal=STRIPE_WEBHOOK_SECRET="$$STRIPE_WEBHOOK_SECRET" \
	  --from-literal=GOOGLE_CLIENT_ID="$$GOOGLE_CLIENT_ID" \
	  --from-literal=GOOGLE_CLIENT_SECRET="$$GOOGLE_CLIENT_SECRET" \
	  --from-literal=RESEND_API_KEY="$$RESEND_API_KEY" \
	  --from-literal=GROQ_API_KEY="$$GROQ_API_KEY" \
	  --dry-run=client -o yaml | \
	kubeseal --format=yaml > k8s/sealed-secrets.yaml
	@echo "Done. k8s/sealed-secrets.yaml is now safe to commit."
	@echo "Verify with: kubeseal --validate < k8s/sealed-secrets.yaml"

# ─── Deployments ──────────────────────────────────────────────
# Pins image tag to current git SHA before rolling out.
deploy-backend:
	$(eval SHA := $(shell git rev-parse --short HEAD))
	kubectl set image deployment/lumiqe-backend backend=lumiqe/backend:$(SHA)
	kubectl rollout status deployment/lumiqe-backend

deploy-frontend:
	$(eval SHA := $(shell git rev-parse --short HEAD))
	kubectl set image deployment/lumiqe-frontend frontend=lumiqe/frontend:$(SHA)
	kubectl rollout status deployment/lumiqe-frontend

deploy: deploy-backend deploy-frontend
