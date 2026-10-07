# Product Demo Seeding

The local seed command creates deterministic catalog data for API, pagination, query-plan, and database exercises. It does not create stock balances or inventory movements.

From the repository root, apply migrations and seed the default 200 products:

```sh
npm --prefix apps/api run migration:run
npm --prefix apps/api run seed:products
```

Use a different size with `npm --prefix apps/api run seed:products -- --count=500`. Supported values are 1 through 10,000. Rows are inserted in batches of 100. Existing demo SKUs are skipped, so rerunning the command is safe and does not overwrite edits.

Demo rows use the reserved `DEMO-` SKU prefix. To remove only this generated data locally:

```sql
DELETE FROM products WHERE sku LIKE 'DEMO-%';
```
