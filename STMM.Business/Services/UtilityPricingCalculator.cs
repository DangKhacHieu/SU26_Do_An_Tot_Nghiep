using System;
using System.Collections.Generic;
using System.Linq;
using STMM.Business.DTOs.Dashboard;

namespace STMM.Business.Services
{
    public static class UtilityPricingCalculator
    {
        /// <summary>
        /// Calculates the total cost for a given consumption based on tiered pricing.
        /// </summary>
        /// <param name="consumption">The total consumed amount.</param>
        /// <param name="tiers">The configured tiers.</param>
        /// <returns>The total price calculated.</returns>
        public static decimal CalculatePrice(double consumption, List<UtilityTierStep> tiers)
        {
            if (consumption <= 0) return 0;
            if (tiers == null || !tiers.Any()) return 0;

            var orderedTiers = tiers.OrderBy(t => t.From).ToList();
            decimal totalAmount = 0;
            double remainingConsumption = consumption;

            foreach (var tier in orderedTiers)
            {
                if (remainingConsumption <= 0) break;

                // For integer-inclusive boundaries (e.g., 51 to 100), the tier size is (100 - 51) + 1 = 50.
                // If From is 0 (e.g., 0 to 50), the size is 50 - 0 = 50.
                double tierSize = tier.To.HasValue 
                    ? (tier.From > 0 ? (tier.To.Value - tier.From + 1) : (tier.To.Value - tier.From)) 
                    : double.MaxValue;
                if (tierSize <= 0) continue; // safety check
                
                double consumptionInTier = Math.Min(remainingConsumption, tierSize);
                
                totalAmount += (decimal)consumptionInTier * tier.Price;
                remainingConsumption -= consumptionInTier;
            }

            return totalAmount;
        }
    }
}
