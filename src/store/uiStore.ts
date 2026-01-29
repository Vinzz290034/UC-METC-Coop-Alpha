import create from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modalContent: string;
  setModalContent: (content: string) => void;
  notificationMessage: string | null;
  showNotification: (message: string, duration?: number) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  showModal: false,
  setShowModal: (show) => set({ showModal: show }),

  modalContent: '',
  setModalContent: (content) => set({ modalContent: content }),

  notificationMessage: null,
  showNotification: (message, duration = 3000) => {
    set({ notificationMessage: message });
    setTimeout(() => {
      set({ notificationMessage: null });
    }, duration);
  },
  clearNotification: () => set({ notificationMessage: null }),
}));
