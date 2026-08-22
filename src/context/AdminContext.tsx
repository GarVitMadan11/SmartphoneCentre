import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, Brand, Model, MODELS as STATIC_MODELS, BRANDS as STATIC_BRANDS } from '../data/mockDatabase';
import { fetchBookings, fetchModels, fetchAuditLogs, AuditLogItem, fetchCurrentUser, ApiUser } from '../utils/api';

export type AdminTab = 'ledger' | 'catalog' | 'support' | 'audit';

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  currentUser: ApiUser | null;
  bookings: Booking[];
  models: Model[];
  brands: Brand[];
  auditLogs: AuditLogItem[];
  loadingModels: boolean;
  loadingBookings: boolean;
  loadingAuditLogs: boolean;
  isApiOffline: boolean;
  refreshBookings: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  refreshAuditLogs: (search?: string) => Promise<void>;
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  setIsApiOffline: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export interface AdminContextProviderProps {
  children: React.ReactNode;
  initialBookings?: Booking[];
  brands?: Brand[];
  onRefreshCatalog?: () => Promise<void> | void;
  onRefreshBookings?: () => Promise<void> | void;
}

export const AdminContextProvider: React.FC<AdminContextProviderProps> = ({
  children,
  initialBookings = [],
  brands: propBrands = [],
  onRefreshCatalog: propRefreshCatalog,
  onRefreshBookings: propRefreshBookings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('ledger');
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>(propBrands.length > 0 ? propBrands : STATIC_BRANDS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    if (propBrands.length > 0) setBrands(propBrands);
  }, [propBrands]);

  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [isApiOffline, setIsApiOffline] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser()
      .then(res => setCurrentUser(res.user))
      .catch(() => setCurrentUser(null));
  }, []);

  const refreshCatalog = useCallback(async () => {
    setLoadingModels(true);
    try {
      const data = await fetchModels();
      if (data && data.length > 0) {
        setModels(data as Model[]);
        setIsApiOffline(false);
      } else {
        setModels(prev => (prev.length > 0 ? prev : STATIC_MODELS));
        setIsApiOffline(true);
      }
    } catch {
      setModels(prev => (prev.length > 0 ? prev : STATIC_MODELS));
      setIsApiOffline(true);
    } finally {
      setLoadingModels(false);
    }
    if (propRefreshCatalog) {
      try { await propRefreshCatalog(); } catch { /* ignore */ }
    }
  }, [propRefreshCatalog]);

  const refreshBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await fetchBookings();
      if (data && Array.isArray(data)) {
        setBookings(data as unknown as Booking[]);
        setIsApiOffline(false);
      }
    } catch (err) {
      console.error('[AdminContext] Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
    if (propRefreshBookings) {
      try { await propRefreshBookings(); } catch { /* ignore */ }
    }
  }, [propRefreshBookings]);

  const refreshAuditLogs = useCallback(async (search?: string) => {
    setLoadingAuditLogs(true);
    try {
      const logs = await fetchAuditLogs(search);
      setAuditLogs(logs);
    } catch (err) {
      console.error('[AdminContext] Failed to fetch audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    if (activeTab === 'catalog') {
      refreshCatalog();
    } else if (activeTab === 'audit') {
      refreshAuditLogs();
    }
  }, [activeTab, refreshCatalog, refreshAuditLogs]);

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        bookings,
        models,
        brands,
        auditLogs,
        loadingModels,
        loadingBookings,
        loadingAuditLogs,
        isApiOffline,
        refreshBookings,
        refreshCatalog,
        refreshAuditLogs,
        setModels,
        setBookings,
        setIsApiOffline,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminContextProvider');
  }
  return ctx;
};
