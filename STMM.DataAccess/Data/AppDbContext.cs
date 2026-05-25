using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<ContractFile> ContractFiles { get; set; }

    public virtual DbSet<FeeType> FeeTypes { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceDetail> InvoiceDetails { get; set; }

    public virtual DbSet<Market> Markets { get; set; }

    public virtual DbSet<Meter> Meters { get; set; }

    public virtual DbSet<MeterReading> MeterReadings { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Request> Requests { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<StaffTask> StaffTasks { get; set; }

    public virtual DbSet<Stall> Stalls { get; set; }

    public virtual DbSet<SystemConfig> SystemConfigs { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<Violation> Violations { get; set; }



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.HasKey(e => e.AreaId).HasName("areas_pkey");

            entity.ToTable("areas");

            entity.Property(e => e.AreaId).HasColumnName("area_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.MarketId).HasColumnName("market_id");
            entity.Property(e => e.MaxX).HasColumnName("max_x");
            entity.Property(e => e.MaxY).HasColumnName("max_y");
            entity.Property(e => e.MinX).HasColumnName("min_x");
            entity.Property(e => e.MinY).HasColumnName("min_y");
            entity.Property(e => e.Name).HasColumnName("name");

            entity.HasOne(d => d.Market).WithMany(p => p.Areas)
                .HasForeignKey(d => d.MarketId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("areas_market_id_fkey");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("audit_logs_pkey");

            entity.ToTable("audit_logs");

            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.Action).HasColumnName("action");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .HasColumnName("ip_address");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("audit_logs_user_id_fkey");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.ContractId).HasName("contracts_pkey");

            entity.ToTable("contracts");

            entity.HasIndex(e => new { e.StallId, e.VendorId, e.Status, e.IsDeleted }, "idx_contracts_lookup");

            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Deposit)
                .HasPrecision(18, 2)
                .HasColumnName("deposit");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.RentFee)
                .HasPrecision(18, 2)
                .HasColumnName("rent_fee");
            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.VendorId).HasColumnName("vendor_id");

            entity.HasOne(d => d.Stall).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("contracts_stall_id_fkey");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("contracts_vendor_id_fkey");
        });

        modelBuilder.Entity<ContractFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("contract_files_pkey");

            entity.ToTable("contract_files");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.FileUrl).HasColumnName("file_url");

            entity.HasOne(d => d.Contract).WithMany(p => p.ContractFiles)
                .HasForeignKey(d => d.ContractId)
                .HasConstraintName("contract_files_contract_id_fkey");
        });

        modelBuilder.Entity<FeeType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("fee_types_pkey");

            entity.ToTable("fee_types");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Unit).HasColumnName("unit");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.InvoiceId).HasName("invoices_pkey");

            entity.ToTable("invoices");

            entity.HasIndex(e => new { e.Month, e.Year, e.Status, e.IsDeleted }, "idx_invoices_report");

            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.AdjustedFromId).HasColumnName("adjusted_from_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Unpaid'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TotalAmount)
                .HasPrecision(18, 2)
                .HasColumnName("total_amount");
            entity.Property(e => e.Year).HasColumnName("year");

            entity.HasOne(d => d.AdjustedFrom).WithMany(p => p.InverseAdjustedFrom)
                .HasForeignKey(d => d.AdjustedFromId)
                .HasConstraintName("invoices_adjusted_from_id_fkey");

            entity.HasOne(d => d.Contract).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("invoices_contract_id_fkey");
        });

        modelBuilder.Entity<InvoiceDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("invoice_details_pkey");

            entity.ToTable("invoice_details");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(18, 2)
                .HasColumnName("amount");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.FeeTypeId).HasColumnName("fee_type_id");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2)
                .HasColumnName("unit_price");

            entity.HasOne(d => d.FeeType).WithMany(p => p.InvoiceDetails)
                .HasForeignKey(d => d.FeeTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("invoice_details_fee_type_id_fkey");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceDetails)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("invoice_details_invoice_id_fkey");
        });

        modelBuilder.Entity<Market>(entity =>
        {
            entity.HasKey(e => e.MarketId).HasName("markets_pkey");

            entity.ToTable("markets");

            entity.Property(e => e.MarketId).HasColumnName("market_id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.MarketName).HasColumnName("market_name");
        });

        modelBuilder.Entity<Meter>(entity =>
        {
            entity.HasKey(e => e.MeterId).HasName("meters_pkey");

            entity.ToTable("meters");

            entity.HasIndex(e => e.SerialNumber, "meters_serial_number_key").IsUnique();

            entity.Property(e => e.MeterId).HasColumnName("meter_id");
            entity.Property(e => e.InstalledAt).HasColumnName("installed_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .HasColumnName("serial_number");
            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");

            entity.HasOne(d => d.Stall).WithMany(p => p.Meters)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("meters_stall_id_fkey");
        });

        modelBuilder.Entity<MeterReading>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("meter_readings_pkey");

            entity.ToTable("meter_readings");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsSynced)
                .HasDefaultValue(true)
                .HasColumnName("is_synced");
            entity.Property(e => e.MeterId).HasColumnName("meter_id");
            entity.Property(e => e.NewValue).HasColumnName("new_value");
            entity.Property(e => e.OldValue).HasColumnName("old_value");
            entity.Property(e => e.RecordedAt).HasColumnName("recorded_at");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.MeterReadings)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("meter_readings_created_by_fkey");

            entity.HasOne(d => d.Meter).WithMany(p => p.MeterReadings)
                .HasForeignKey(d => d.MeterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("meter_readings_meter_id_fkey");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotiId).HasName("notifications_pkey");

            entity.ToTable("notifications");

            entity.Property(e => e.NotiId).HasColumnName("noti_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("is_read");
            entity.Property(e => e.NotiType)
                .HasMaxLength(50)
                .HasDefaultValueSql("'System'::character varying")
                .HasColumnName("noti_type");
            entity.Property(e => e.TargetRole)
                .HasMaxLength(50)
                .HasColumnName("target_role");
            entity.Property(e => e.TargetUserId).HasColumnName("target_user_id");
            entity.Property(e => e.Title).HasColumnName("title");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.NotificationCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("notifications_created_by_fkey");

            entity.HasOne(d => d.TargetUser).WithMany(p => p.NotificationTargetUsers)
                .HasForeignKey(d => d.TargetUserId)
                .HasConstraintName("notifications_target_user_id_fkey");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("payments_pkey");

            entity.ToTable("payments");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(18, 2)
                .HasColumnName("amount");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.Method)
                .HasMaxLength(50)
                .HasColumnName("method");
            entity.Property(e => e.PaidAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("paid_at");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(100)
                .HasColumnName("transaction_code");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("payments_invoice_id_fkey");
        });

        modelBuilder.Entity<Request>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("requests_pkey");

            entity.ToTable("requests");

            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.RequestType)
                .HasMaxLength(50)
                .HasColumnName("request_type");
            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.Title).HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.VendorId).HasColumnName("vendor_id");
            entity.Property(e => e.ViolationId).HasColumnName("violation_id");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Requests)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("requests_invoice_id_fkey");

            entity.HasOne(d => d.Stall).WithMany(p => p.Requests)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("requests_stall_id_fkey");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Requests)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("requests_vendor_id_fkey");

            entity.HasOne(d => d.Violation).WithMany(p => p.Requests)
                .HasForeignKey(d => d.ViolationId)
                .HasConstraintName("requests_violation_id_fkey");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("reviews_pkey");

            entity.ToTable("reviews");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Stall).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("reviews_stall_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("reviews_user_id_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("roles_pkey");

            entity.ToTable("roles");

            entity.HasIndex(e => e.Name, "roles_name_key").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<StaffTask>(entity =>
        {
            entity.HasKey(e => e.TaskId).HasName("staff_tasks_pkey");

            entity.ToTable("staff_tasks");

            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
            entity.Property(e => e.CompletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Deadline)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deadline");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TaskType)
                .HasMaxLength(50)
                .HasColumnName("task_type");
            entity.Property(e => e.Title).HasColumnName("title");

            entity.HasOne(d => d.AssignedToNavigation).WithMany(p => p.StaffTasks)
                .HasForeignKey(d => d.AssignedTo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("staff_tasks_assigned_to_fkey");

            entity.HasOne(d => d.Request).WithMany(p => p.StaffTasks)
                .HasForeignKey(d => d.RequestId)
                .HasConstraintName("staff_tasks_request_id_fkey");
        });

        modelBuilder.Entity<Stall>(entity =>
        {
            entity.HasKey(e => e.StallId).HasName("stalls_pkey");

            entity.ToTable("stalls");

            entity.HasIndex(e => new { e.MapX, e.MapY, e.Width, e.Height, e.Status, e.IsDeleted }, "idx_stalls_map");

            entity.HasIndex(e => e.Code, "stalls_code_key").IsUnique();

            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.AreaId).HasColumnName("area_id");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.FireInsuranceExpiry).HasColumnName("fire_insurance_expiry");
            entity.Property(e => e.Height).HasColumnName("height");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.MapX).HasColumnName("map_x");
            entity.Property(e => e.MapY).HasColumnName("map_y");
            entity.Property(e => e.QrCode).HasColumnName("qr_code");
            entity.Property(e => e.Rotation)
                .HasDefaultValueSql("0")
                .HasColumnName("rotation");
            entity.Property(e => e.Size).HasColumnName("size");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Available'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.SvgPath).HasColumnName("svg_path");
            entity.Property(e => e.Width).HasColumnName("width");

            entity.HasOne(d => d.Area).WithMany(p => p.Stalls)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stalls_area_id_fkey");
        });

        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.HasKey(e => e.ConfigId).HasName("system_configs_pkey");

            entity.ToTable("system_configs");

            entity.HasIndex(e => e.ConfigKey, "system_configs_config_key_key").IsUnique();

            entity.Property(e => e.ConfigId).HasColumnName("config_id");
            entity.Property(e => e.ConfigKey)
                .HasMaxLength(100)
                .HasColumnName("config_key");
            entity.Property(e => e.ConfigValue).HasColumnName("config_value");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.SystemConfigs)
                .HasForeignKey(d => d.UpdatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("system_configs_updated_by_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.Cccd, "idx_users_cccd");

            entity.HasIndex(e => new { e.Email, e.Phone, e.Status, e.IsDeleted }, "idx_users_login");

            entity.HasIndex(e => e.Cccd, "users_cccd_key").IsUnique();

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.HasIndex(e => e.Phone, "users_phone_key").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Cccd)
                .HasMaxLength(20)
                .HasColumnName("cccd");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.LastLogin)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_login");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.OtpCode)
                .HasMaxLength(10)
                .HasColumnName("otp_code");
            entity.Property(e => e.OtpExpiredAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("otp_expired_at");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("users_role_id_fkey");
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(e => e.VendorId).HasName("vendors_pkey");

            entity.ToTable("vendors");

            entity.HasIndex(e => e.TaxCode, "vendors_tax_code_key").IsUnique();

            entity.HasIndex(e => e.UserId, "vendors_user_id_key").IsUnique();

            entity.Property(e => e.VendorId).HasColumnName("vendor_id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.BusinessLicense).HasColumnName("business_license");
            entity.Property(e => e.BusinessName).HasColumnName("business_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.TaxCode)
                .HasMaxLength(50)
                .HasColumnName("tax_code");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Vendor)
                .HasForeignKey<Vendor>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vendors_user_id_fkey");
        });

        modelBuilder.Entity<Violation>(entity =>
        {
            entity.HasKey(e => e.ViolationId).HasName("violations_pkey");

            entity.ToTable("violations");

            entity.Property(e => e.ViolationId).HasColumnName("violation_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.FineAmount)
                .HasPrecision(18, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("fine_amount");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.NotifiedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("notified_at");
            entity.Property(e => e.StallId).HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.Title).HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Violations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("violations_created_by_fkey");

            entity.HasOne(d => d.Stall).WithMany(p => p.Violations)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("violations_stall_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
