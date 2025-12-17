import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export function useScans() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: () => client.get('/scans').then(res => res.data)
  });
}

export function useScan(id) {
  return useQuery({
    queryKey: ['scans', id],
    queryFn: () => client.get(`/scans/${id}`).then(res => res.data),
    enabled: !!id
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scanData) => client.post('/scans', scanData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scans']);
    }
  });
}

