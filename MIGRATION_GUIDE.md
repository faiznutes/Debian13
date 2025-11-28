# 🔄 Migration Guide - Advanced Features Database Models

**Tanggal:** 20 November 2024  
**Status:** Ready for Migration

---

## 📋 Overview

Guide ini menjelaskan langkah-langkah untuk menjalankan migration database untuk model-model baru yang telah ditambahkan:
- Advanced Reporting (ReportTemplate, ScheduledReport, DashboardSettings)
- Financial Management (CashFlow, Expense, TaxCalculation, FinancialForecast, BankReconciliation)
- Customer Engagement (CustomerFeedback, CustomerReview)

---

## 🚀 Migration Steps

### 1. Backup Database (PENTING!)

Sebelum menjalankan migration, **WAJIB** backup database terlebih dahulu:

```bash
# PostgreSQL backup
pg_dump -U postgres -d warungin > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau jika menggunakan Docker
docker exec -t warungin-db pg_dump -U postgres warungin > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Generate Prisma Client

```bash
# Generate Prisma Client dengan model baru
npx prisma generate
```

### 3. Create Migration

```bash
# Create migration file
npx prisma migrate dev --name add_advanced_features_models

# Atau jika ingin membuat migration tanpa apply langsung
npx prisma migrate dev --create-only --name add_advanced_features_models
```

### 4. Review Migration File

Periksa file migration yang dibuat di `prisma/migrations/` untuk memastikan:
- Semua model baru ada
- Indexes sudah benar
- Foreign keys sudah benar
- Constraints sudah benar

### 5. Apply Migration

```bash
# Apply migration ke database
npx prisma migrate deploy

# Atau jika development
npx prisma migrate dev
```

### 6. Verify Migration

```bash
# Check database schema
npx prisma db pull

# Verify dengan Prisma Studio
npx prisma studio
```

---

## 📊 New Database Models

### Advanced Reporting

1. **ReportTemplate**
   - Stores custom report templates
   - Fields: name, description, type, config (JSON)
   - Indexes: tenantId, type, isActive

2. **ScheduledReport**
   - Stores scheduled report configurations
   - Fields: schedule, scheduleConfig (JSON), format, recipients
   - Indexes: tenantId, isActive, nextRunAt

3. **DashboardSettings**
   - Stores dashboard customization per user
   - Fields: layout (JSON), widgets (JSON)
   - Unique: tenantId + userId

### Financial Management

1. **CashFlow**
   - Stores income/expense entries
   - Fields: type, category, amount, date, paymentMethod
   - Indexes: tenantId, type, date, category

2. **Expense**
   - Stores expense records
   - Fields: category, amount, date, vendor, isTaxDeductible
   - Indexes: tenantId, category, date, isTaxDeductible

3. **TaxCalculation**
   - Stores tax calculations per period
   - Fields: period, totalRevenue, totalExpenses, taxRate, taxAmount
   - Unique: tenantId + period

4. **FinancialForecast**
   - Stores financial forecasts
   - Fields: month, projectedRevenue, projectedExpenses, confidence
   - Unique: tenantId + month

5. **BankReconciliation**
   - Stores bank reconciliation records
   - Fields: bankAccount, statementDate, statementBalance, bookBalance
   - Indexes: tenantId, bankAccount, reconciled

### Customer Engagement

1. **CustomerFeedback**
   - Stores customer feedback
   - Fields: rating, comment, category, status
   - Indexes: tenantId, customerId, status, rating

2. **CustomerReview**
   - Stores product/service reviews
   - Fields: rating, title, comment, isVerified, helpfulCount
   - Indexes: tenantId, customerId, productId, status, rating

3. **Customer.birthday**
   - New field added to Customer model
   - Type: DateTime (nullable)

---

## ⚠️ Important Notes

### Data Migration

Jika ada data existing yang perlu dimigrate:
1. **Advanced Reporting**: Tidak ada data existing, semua baru
2. **Financial Management**: Jika ada data cash flow/expense di tempat lain, perlu di-migrate manual
3. **Customer Engagement**: Jika ada feedback/review existing, perlu di-migrate manual

### Backward Compatibility

- Semua model baru menggunakan `onDelete: Cascade` untuk menjaga data integrity
- Field `birthday` di Customer model adalah nullable, jadi tidak akan mempengaruhi data existing
- Semua services sudah di-update untuk menggunakan database models

### Performance Considerations

- Indexes sudah ditambahkan untuk performa query yang optimal
- Unique constraints untuk mencegah duplikasi data
- JSON fields untuk fleksibilitas (config, layout, widgets)

---

## 🔍 Verification Checklist

Setelah migration selesai, verifikasi:

- [ ] Semua tables baru sudah dibuat
- [ ] Indexes sudah terbuat
- [ ] Foreign keys sudah terbuat
- [ ] Unique constraints sudah terbuat
- [ ] Prisma Client sudah di-generate ulang
- [ ] Services bisa create/read data dengan baik
- [ ] API endpoints bisa diakses dan berfungsi
- [ ] Frontend UI bisa load data dari database

---

## 🐛 Troubleshooting

### Error: "Table already exists"
**Solution:** Hapus migration yang gagal dan buat ulang:
```bash
# Hapus migration folder yang gagal
rm -rf prisma/migrations/[migration_name]

# Buat migration baru
npx prisma migrate dev --name add_advanced_features_models
```

### Error: "Foreign key constraint failed"
**Solution:** Pastikan semua parent records (Tenant, Customer, Product) sudah ada sebelum insert child records.

### Error: "Unique constraint violation"
**Solution:** Pastikan tidak ada duplikasi data untuk fields yang unique (tenantId + period, tenantId + userId, dll).

### Error: "Column does not exist"
**Solution:** Pastikan Prisma Client sudah di-generate ulang setelah migration:
```bash
npx prisma generate
```

---

## 📝 Post-Migration Steps

1. **Test Services**
   - Test create report template
   - Test create scheduled report
   - Test record cash flow
   - Test submit feedback/review

2. **Test API Endpoints**
   - Test semua endpoints di `/api/advanced-reporting`
   - Test semua endpoints di `/api/financial-management`
   - Test semua endpoints di `/api/customer-engagement-enhancement`

3. **Test Frontend UI**
   - Test Advanced Reporting UI
   - Test Financial Management UI
   - Test Customer Engagement UI

4. **Monitor Performance**
   - Monitor query performance
   - Check database size
   - Monitor index usage

---

## ✅ Success Criteria

Migration dianggap berhasil jika:
- ✅ Semua tables baru terbuat tanpa error
- ✅ Semua services bisa create/read data
- ✅ Semua API endpoints berfungsi
- ✅ Frontend UI bisa load dan save data
- ✅ Tidak ada data loss
- ✅ Performance masih optimal

---

**Last Updated:** 20 November 2024  
**Version:** 1.0.0

