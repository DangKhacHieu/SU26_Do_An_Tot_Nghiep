using STMM.Business.DTOs.Quotation;
using STMM.Business.DTOs.Task;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    /// <summary>
    /// Manages the repair quotation lifecycle for a StaffTask:
    /// browsing the material catalog, adding/removing material lines,
    /// and submitting the final quotation for manager approval.
    /// </summary>
    public interface IQuotationService
    {
        // ── Catalog ──────────────────────────────────────────────────────────

        /// <summary>
        /// Returns all active entries from the repair price catalog.
        /// Used by Staff to pick materials when building a quotation.
        /// </summary>
        Task<List<RepairPriceDto>> GetRepairPricesAsync(CancellationToken ct = default);

        // ── Quotation CRUD ────────────────────────────────────────────────────

        /// <summary>
        /// Returns the current quotation summary (material lines + total) for a task.
        /// Only the assigned staff member may view the quotation.
        /// </summary>
        Task<QuotationSummaryDto> GetQuotationAsync(int taskId, int staffUserId, CancellationToken ct = default);

        /// <summary>
        /// Appends a new material line to the task's quotation.
        /// Task must be in Pending status. Returns the updated quotation summary.
        /// </summary>
        Task<QuotationSummaryDto> AddMaterialAsync(int taskId, int staffUserId, AddMaterialRequest request, CancellationToken ct = default);

        /// <summary>
        /// Removes a material line from the task's quotation.
        /// Task must still be in Pending status. Returns the updated quotation summary.
        /// </summary>
        Task<QuotationSummaryDto> RemoveMaterialAsync(int taskId, int materialId, int staffUserId, CancellationToken ct = default);

        // ── Submit ────────────────────────────────────────────────────────────

        /// <summary>
        /// Finalises the quotation: calculates ActualCost, transitions task to PendingApproval,
        /// sets PaidBy on the linked Request, and notifies the appropriate party.
        /// Requires at least one material line.
        /// </summary>
        /// <param name="paidBy">"Market" (BQL chịu phí) or "Vendor" (Tiểu thương chịu phí).</param>
        Task<TaskDto> SubmitQuotationAsync(int taskId, int staffUserId, string paidBy, CancellationToken ct = default);
    }
}
