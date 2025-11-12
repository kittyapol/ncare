import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

type ReportTab = 'vat-purchases' | 'vat-sales' | 'cogs' | 'profit-loss';

// Type definitions for report data
interface ProfitLossData {
  start_date: string;
  end_date: string;
  income_statement: {
    revenue: {
      total_sales: number;
      output_vat: number;
    };
    cost_of_goods_sold: {
      total_cogs: number;
      input_vat_estimate: number;
    };
    gross_profit: {
      amount: number;
      margin_percent: number;
    };
    net_vat: {
      output_vat: number;
      input_vat_estimate: number;
      net_vat_payable: number;
    };
  };
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
  };
}

interface VATSalesDetail {
  order_number: string;
  order_date: string;
  customer_id: string | null;
  product_id: string;
  quantity: number;
  unit_price: number;
  price_before_vat: number;
  vat_amount: number;
  price_including_vat: number;
}

interface VATSalesData {
  start_date: string;
  end_date: string;
  summary: {
    total_before_vat: number;
    total_vat_amount: number;
    total_including_vat: number;
    vat_breakdown: {
      vat_7_percent: number;
      vat_0_percent: number;
      vat_exempt: number;
    };
  };
  details: VATSalesDetail[];
}

interface VATPurchasesDetail {
  po_number: string;
  date: string;
  supplier_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  price_before_vat: number;
  vat_amount: number;
  line_before_vat: number;
  line_vat: number;
  line_total: number;
}

interface VATPurchasesData {
  start_date: string;
  end_date: string;
  summary: {
    total_before_vat: number;
    total_vat_amount: number;
    total_including_vat: number;
    vat_breakdown: {
      vat_7_percent: number;
      vat_0_percent: number;
      vat_exempt: number;
    };
  };
  details: VATPurchasesDetail[];
}

interface COGSDetail {
  order_number: string;
  order_date: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  revenue: number;
  profit: number;
  profit_margin_percent: number;
}

interface COGSData {
  start_date: string;
  end_date: string;
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    total_quantity_sold: number;
    average_cost_per_unit: number;
  };
  details: COGSDetail[];
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('profit-loss');

  // Default date range: last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fetch report based on active tab
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', activeTab, startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/reports/${activeTab}`, {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData?.details) return;

    // Convert to CSV
    const details = reportData.details;
    if (details.length === 0) return;

    const headers = Object.keys(details[0]);
    const csvContent = [
      headers.join(','),
      ...details.map((row: Record<string, unknown>) =>
        headers.map(header => row[header]).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'profit-loss', label: 'กำไร-ขาดทุน', icon: '📊' },
    { id: 'vat-sales', label: 'ภาษีขาย', icon: '💰' },
    { id: 'vat-purchases', label: 'ภาษีซื้อ', icon: '🛒' },
    { id: 'cogs', label: 'ต้นทุนขาย', icon: '📦' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายงานและการเงิน</h1>
        <p className="text-gray-600 mt-1">รายงานภาษี, ต้นทุน, และกำไร-ขาดทุน</p>
      </div>

      {/* Date Range Picker */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="btn btn-primary"
          >
            🔍 ดูรายงาน
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
          >
            🖨️ พิมพ์
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            disabled={!reportData?.details || reportData.details.length === 0}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">กำลังโหลดรายงาน...</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && reportData && (
        <>
          {activeTab === 'profit-loss' && <ProfitLossReport data={reportData} />}
          {activeTab === 'vat-sales' && <VATSalesReport data={reportData} />}
          {activeTab === 'vat-purchases' && <VATPurchasesReport data={reportData} />}
          {activeTab === 'cogs' && <COGSReport data={reportData} />}
        </>
      )}
    </div>
  );
}

// ============================================
// Profit & Loss Report Component
// ============================================
function ProfitLossReport({ data }: { data: ProfitLossData }) {
  const { income_statement, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="text-sm text-green-600 font-medium">รายได้รวม</div>
          <div className="text-3xl font-bold text-green-700 mt-2">
            ฿{summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="text-sm text-red-600 font-medium">ต้นทุนขาย</div>
          <div className="text-3xl font-bold text-red-700 mt-2">
            ฿{summary.total_cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600 font-medium">กำไรขั้นต้น</div>
          <div className="text-3xl font-bold text-blue-700 mt-2">
            ฿{summary.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Margin: {summary.gross_margin_percent}%
          </div>
        </div>
      </div>

      {/* Income Statement */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">งบกำไร-ขาดทุน</h2>
        <div className="space-y-4">
          {/* Revenue */}
          <div>
            <div className="flex justify-between items-center py-2 border-b font-semibold">
              <span>รายได้</span>
              <span></span>
            </div>
            <div className="flex justify-between items-center py-2 pl-4">
              <span>ยอดขาย</span>
              <span>฿{income_statement.revenue.total_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 pl-4 text-sm text-gray-600">
              <span>ภาษีขาย (Output VAT)</span>
              <span>฿{income_statement.revenue.output_vat.toLocaleString()}</span>
            </div>
          </div>

          {/* COGS */}
          <div>
            <div className="flex justify-between items-center py-2 border-b font-semibold">
              <span>ต้นทุนขาย</span>
              <span></span>
            </div>
            <div className="flex justify-between items-center py-2 pl-4">
              <span>ต้นทุนสินค้า</span>
              <span>฿{income_statement.cost_of_goods_sold.total_cogs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 pl-4 text-sm text-gray-600">
              <span>ภาษีซื้อ (Input VAT - ประมาณการ)</span>
              <span>฿{income_statement.cost_of_goods_sold.input_vat_estimate.toLocaleString()}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center py-2 font-bold text-lg">
              <span>กำไรขั้นต้น</span>
              <span className="text-green-600">
                ฿{income_statement.gross_profit.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm text-gray-600">
              <span>Gross Margin</span>
              <span>{income_statement.gross_profit.margin_percent}%</span>
            </div>
          </div>

          {/* Net VAT */}
          <div className="border-t pt-4 bg-gray-50 -m-6 p-6 mt-4">
            <div className="text-sm font-semibold mb-2">ภาษีมูลค่าเพิ่มสุทธิ</div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span>ภาษีขาย (Output VAT)</span>
              <span>฿{income_statement.net_vat.output_vat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span>ภาษีซื้อ (Input VAT - ประมาณการ)</span>
              <span>-฿{income_statement.net_vat.input_vat_estimate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold border-t mt-2 pt-2">
              <span>VAT ต้องชำระ</span>
              <span className="text-orange-600">
                ฿{income_statement.net_vat.net_vat_payable.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VAT Sales Report Component
// ============================================
function VATSalesReport({ data }: { data: VATSalesData }) {
  const { summary, details } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">มูลค่าก่อน VAT</div>
          <div className="text-2xl font-bold mt-2">
            ฿{summary.total_before_vat.toLocaleString()}
          </div>
        </div>
        <div className="card bg-primary-50">
          <div className="text-sm text-primary-600 font-medium">VAT 7%</div>
          <div className="text-2xl font-bold text-primary-700 mt-2">
            ฿{summary.total_vat_amount.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">มูลค่ารวม VAT</div>
          <div className="text-2xl font-bold mt-2">
            ฿{summary.total_including_vat.toLocaleString()}
          </div>
        </div>
        <div className="card bg-blue-50">
          <div className="text-sm text-blue-600">รายการทั้งหมด</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {details.length}
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">รายละเอียดภาษีขาย</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เลขที่ออเดอร์
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                วันที่
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จำนวน
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                มูลค่าก่อน VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                มูลค่ารวม VAT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.map((item: VATSalesDetail, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{item.order_number}</td>
                <td className="px-4 py-3 text-sm">{item.order_date}</td>
                <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  ฿{item.price_before_vat.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-primary-600">
                  ฿{item.vat_amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ฿{item.price_including_vat.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// VAT Purchases Report Component
// ============================================
function VATPurchasesReport({ data }: { data: VATPurchasesData }) {
  const { summary, details } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">มูลค่าก่อน VAT</div>
          <div className="text-2xl font-bold mt-2">
            ฿{summary.total_before_vat.toLocaleString()}
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="text-sm text-green-600 font-medium">VAT ที่ซื้อ</div>
          <div className="text-2xl font-bold text-green-700 mt-2">
            ฿{summary.total_vat_amount.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">มูลค่ารวม VAT</div>
          <div className="text-2xl font-bold mt-2">
            ฿{summary.total_including_vat.toLocaleString()}
          </div>
        </div>
        <div className="card bg-blue-50">
          <div className="text-sm text-blue-600">รายการทั้งหมด</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {details.length}
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">รายละเอียดภาษีซื้อ</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เลขที่ PO
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                วันที่
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จำนวน
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                มูลค่าก่อน VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                มูลค่ารวม VAT
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.map((item: VATPurchasesDetail, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{item.po_number}</td>
                <td className="px-4 py-3 text-sm">{item.date}</td>
                <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  ฿{item.line_before_vat.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600">
                  ฿{item.line_vat.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ฿{item.line_total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// COGS Report Component
// ============================================
function COGSReport({ data }: { data: COGSData }) {
  const { summary, details } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="text-sm text-blue-600">รายได้รวม</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            ฿{summary.total_revenue.toLocaleString()}
          </div>
        </div>
        <div className="card bg-red-50">
          <div className="text-sm text-red-600">ต้นทุนขาย</div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            ฿{summary.total_cogs.toLocaleString()}
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="text-sm text-green-600">กำไรขั้นต้น</div>
          <div className="text-2xl font-bold text-green-700 mt-2">
            ฿{summary.gross_profit.toLocaleString()}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {summary.gross_margin_percent}%
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">จำนวนที่ขายได้</div>
          <div className="text-2xl font-bold mt-2">
            {summary.total_quantity_sold} ชิ้น
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">รายละเอียดต้นทุนขาย</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เลขที่ออเดอร์
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                สินค้า
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จำนวน
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                ต้นทุน/หน่วย
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                ต้นทุนรวม
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                รายได้
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                กำไร
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Margin %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.map((item: COGSDetail, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{item.order_number}</td>
                <td className="px-4 py-3 text-sm">
                  <div>{item.product_name}</div>
                  <div className="text-xs text-gray-500">{item.sku}</div>
                </td>
                <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  ฿{item.unit_cost.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-600">
                  ฿{item.total_cost.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  ฿{item.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                  ฿{item.profit.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {item.profit_margin_percent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
