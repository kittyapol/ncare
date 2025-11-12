import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { format } from 'date-fns';

export default function InventoryLots() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-lots'],
    queryFn: async () => {
      const response = await api.get('/inventory/lots/');
      return response.data;
    },
  });

  const { data: expiringData } = useQuery({
    queryKey: ['expiring-lots'],
    queryFn: async () => {
      const response = await api.get('/inventory/lots/expiring', {
        params: { days: 30 },
      });
      return response.data;
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Inventory Lots</h1>

      {/* Expiring Alert */}
      {expiringData && expiringData.items.length > 0 && (
        <div className="card bg-orange-50 border-orange-200 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-orange-900">Expiring Items Alert</h3>
              <p className="text-orange-700">
                {expiringData.items.length} lots are expiring within 30 days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lots Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Lot Number</th>
                  <th className="text-right py-3 px-4">Qty Available</th>
                  <th className="text-right py-3 px-4">Qty Reserved</th>
                  <th className="text-left py-3 px-4">Expiry Date</th>
                  <th className="text-center py-3 px-4">Quality Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((lot: {
                  id: string;
                  lot_number: string;
                  quantity_available: number;
                  quantity_reserved: number;
                  expiry_date: string;
                  quality_status: string;
                }) => (
                  <tr key={lot.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono">{lot.lot_number}</td>
                    <td className="py-3 px-4 text-right">{lot.quantity_available}</td>
                    <td className="py-3 px-4 text-right">{lot.quantity_reserved}</td>
                    <td className="py-3 px-4">
                      {format(new Date(lot.expiry_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          lot.quality_status === 'passed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {lot.quality_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
