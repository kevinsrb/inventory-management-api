CREATE TABLE "categories" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "sku" VARCHAR(20) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "category_id" UUID NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "current_stock" INTEGER NOT NULL DEFAULT 0,
  "minimum_stock" INTEGER NOT NULL,
  "supplier" VARCHAR(120) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_stock_nonnegative" CHECK ("current_stock" >= 0),
  CONSTRAINT "products_minimum_positive" CHECK ("minimum_stock" > 0),
  CONSTRAINT "products_price_positive" CHECK ("price" > 0)
);
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "products_supplier_idx" ON "products"("supplier");
CREATE INDEX "products_current_stock_idx" ON "products"("current_stock");

CREATE TABLE "inventory_movements" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "type" VARCHAR(10) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" VARCHAR(250) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "movements_type_valid" CHECK ("type" IN ('ENTRADA', 'SALIDA')),
  CONSTRAINT "movements_quantity_positive" CHECK ("quantity" > 0)
);
CREATE INDEX "inventory_movements_product_id_created_at_idx" ON "inventory_movements"("product_id", "created_at");

CREATE TABLE "stock_alerts" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "status" VARCHAR(12) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "alerts_type_valid" CHECK ("type" = 'STOCK_BAJO'),
  CONSTRAINT "alerts_status_valid" CHECK ("status" IN ('ACTIVA', 'RESUELTA'))
);
CREATE UNIQUE INDEX "one_active_alert_per_product" ON "stock_alerts"("product_id") WHERE "status" = 'ACTIVA';
CREATE INDEX "stock_alerts_status_idx" ON "stock_alerts"("status");

CREATE TABLE "purchase_orders" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "alert_id" UUID,
  "supplier" VARCHAR(120) NOT NULL,
  "requested_amount" INTEGER NOT NULL,
  "status" VARCHAR(12) NOT NULL,
  "rejection_reason" VARCHAR(250),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "received_at" TIMESTAMP(3),
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_amount_positive" CHECK ("requested_amount" > 0),
  CONSTRAINT "orders_status_valid" CHECK ("status" IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'RECIBIDA'))
);
CREATE INDEX "purchase_orders_product_id_idx" ON "purchase_orders"("product_id");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "stock_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_inventory_movement_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'El historial de inventario es inmutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER inventory_movements_no_update BEFORE UPDATE ON "inventory_movements" FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
CREATE TRIGGER inventory_movements_no_delete BEFORE DELETE ON "inventory_movements" FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
