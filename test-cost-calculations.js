// Test script to validate mining cost calculations
import { calculateMinerCosts } from './src/lib/costCalculations.js';

// Mock data for testing
const mockMiner = {
  id: 'test-miner-1',
  serial_number: 'S19J-001',
  ip_address: '192.168.1.100',
  hashrate: 100,
  temperature: 65,
  profit: 12.50, // €12.50 per day
  power: 3250,   // 3250W
  efficiency: 32.5,
  uptime: 99.5,
  status: 'online',
  last_updated: new Date().toISOString(),
  user_id: 'user-123',
  organization_id: 'org-456',
  created_at: new Date().toISOString(),
  electricity_cost_id: 'cost-789'
};

const mockMiningCost = {
  id: 'cost-789',
  organization_id: 'org-456',
  electricity_price: 0.12, // €0.12 per kWh
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Test calculation
const result = calculateMinerCosts(mockMiner, mockMiningCost);

console.log('=== Mining Cost Calculation Test ===');
console.log(`Miner: ${mockMiner.serial_number}`);
console.log(`Power: ${mockMiner.power}W`);
console.log(`Gross Daily Profit: €${mockMiner.profit}`);
console.log(`Electricity Price: €${mockMiningCost.electricity_price}/kWh`);
console.log('');
console.log('=== Results ===');
console.log(`Electricity Cost/Day: €${result.electricityCostPerDay.toFixed(2)}`);
console.log(`Total Cost/Day: €${result.totalCostPerDay.toFixed(2)}`);
console.log(`Net Profit/Day: €${result.profitAfterCosts.toFixed(2)}`);
console.log(`ROI: ${result.roi.toFixed(1)}%`);
console.log('');

// Expected calculations:
// Power in kW: 3250W / 1000 = 3.25 kW
// Electricity cost/day: 3.25 kW * 24h * €0.12/kWh = €9.36
// Total cost/day: €9.36 (only electricity cost)
// Net profit: €12.50 - €9.36 = €3.14
// ROI: (€3.14 / €9.36) * 100 = 33.5%

console.log('=== Expected Values (Simplified Mining Costs) ===');
console.log('Electricity Cost/Day: €9.36');
console.log('Total Cost/Day: €9.36');
console.log('Net Profit/Day: €3.14');
console.log('ROI: 33.5%');
