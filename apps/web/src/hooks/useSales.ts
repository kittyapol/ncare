import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface CartItem {
  product_id: string;
  product: any;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export function useSalesOrders(params?: { skip?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: async () => {
      const response = await api.get('/sales/orders/', { params });
      return response.data;
    },
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      customer_id?: string;
      items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
      }>;
      payment_method?: string;
      tax_rate?: number;
    }) => {
      const response = await api.post('/sales/orders/', orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCompleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentMethod,
      paidAmount,
    }: {
      orderId: string;
      paymentMethod: string;
      paidAmount: number;
    }) => {
      const response = await api.post(`/sales/orders/${orderId}/complete`, {
        payment_method: paymentMethod,
        paid_amount: paidAmount,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
