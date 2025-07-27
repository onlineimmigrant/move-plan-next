import { MinerData, MiningCostData, CostCalculation } from '@/components/MinersComponent/types';

export function calculateMinerCosts(
  miner: MinerData,
  miningCost: MiningCostData | null,
  totalMinersInOrg: number = 1
): CostCalculation {
  if (!miningCost || !miner.power || !miner.profit) {
    return {
      electricityCostPerDay: 0,
      facilityCostPerDay: 0,
      totalCostPerDay: 0,
      profitAfterCosts: 0,
      roi: 0,
      currency: miningCost?.currency || 'EUR',
      breakdown: {
        insurance: 0,
        rent: 0,
        cooling: 0,
        maintenance: 0,
        other: 0,
        facilityElectricity: 0,
      }
    };
  }

  // Convert power from W to kW and calculate daily electricity cost for this miner
  const powerInKw = miner.power / 1000;
  const hoursPerDay = 24;
  const minerElectricityCostPerDay = powerInKw * hoursPerDay * miningCost.electricity_rate_per_kwh;

  // Calculate facility electricity cost per day (proportionally divided among all miners)
  const facilityElectricityCostPerDay = (miningCost.total_facility_consumption_kwh * miningCost.electricity_rate_per_kwh) / Math.max(totalMinersInOrg, 1);

  // Calculate monthly costs per day (proportionally divided among all miners)
  const daysInMonth = 30;
  const insurancePerDay = miningCost.insurance_monthly / daysInMonth / Math.max(totalMinersInOrg, 1);
  const rentPerDay = miningCost.rent_monthly / daysInMonth / Math.max(totalMinersInOrg, 1);
  const coolingPerDay = miningCost.cooling_monthly / daysInMonth / Math.max(totalMinersInOrg, 1);
  const maintenancePerDay = miningCost.maintenance_monthly / daysInMonth / Math.max(totalMinersInOrg, 1);
  const otherPerDay = miningCost.other_monthly / daysInMonth / Math.max(totalMinersInOrg, 1);

  // Total electricity cost per day (miner + facility share)
  const electricityCostPerDay = minerElectricityCostPerDay + facilityElectricityCostPerDay;

  // Total facility cost per day (all non-electricity costs)
  const facilityCostPerDay = insurancePerDay + rentPerDay + coolingPerDay + maintenancePerDay + otherPerDay;

  // Total cost per day
  const totalCostPerDay = electricityCostPerDay + facilityCostPerDay;

  // Profit after costs
  const profitAfterCosts = miner.profit - totalCostPerDay;

  // Calculate ROI percentage
  const roi = totalCostPerDay > 0 ? (profitAfterCosts / totalCostPerDay) * 100 : 0;

  return {
    electricityCostPerDay,
    facilityCostPerDay,
    totalCostPerDay,
    profitAfterCosts,
    roi,
    currency: miningCost.currency,
    breakdown: {
      insurance: insurancePerDay,
      rent: rentPerDay,
      cooling: coolingPerDay,
      maintenance: maintenancePerDay,
      other: otherPerDay,
      facilityElectricity: facilityElectricityCostPerDay,
    }
  };
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatROI(roi: number): string {
  return `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
}

export function getROIColorClass(roi: number): string {
  if (roi > 50) return 'text-emerald-600';
  if (roi > 20) return 'text-green-600';
  if (roi > 0) return 'text-yellow-600';
  return 'text-red-600';
}

export function getProfitabilityStatus(profitAfterCosts: number): {
  status: 'profitable' | 'break-even' | 'loss';
  label: string;
  colorClass: string;
} {
  if (profitAfterCosts > 1) {
    return {
      status: 'profitable',
      label: 'Profitable',
      colorClass: 'text-emerald-600 bg-emerald-50'
    };
  } else if (profitAfterCosts >= -0.5) {
    return {
      status: 'break-even',
      label: 'Break-even',
      colorClass: 'text-yellow-600 bg-yellow-50'
    };
  } else {
    return {
      status: 'loss',
      label: 'Loss',
      colorClass: 'text-red-600 bg-red-50'
    };
  }
}
