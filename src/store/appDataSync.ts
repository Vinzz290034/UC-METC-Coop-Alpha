import { apiClient } from '../services/api';
import { useAppStore } from './appStore';

export class AppDataSync {
  static async loadCartFromAPI(userId: string) {
    try {
      const cartItems: any[] = await apiClient.getCart(userId);
      const transformedItems = cartItems.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        image: '📦',
        selectedOptions: item.selected_options || {},
      }));
      useAppStore.setState({ cart: transformedItems });
      return transformedItems;
    } catch (error) {
      console.error('Failed to load cart from API:', error);
      return [];
    }
  }

  static async syncCartToAPI(userId: string) {
    try {
      const cart = useAppStore.getState().cart;
      // Clear existing cart on backend
      await apiClient.clearCart(userId);
      // Add all items
      for (const item of cart) {
        await apiClient.addToCart({
          productId: item.productId,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        }, userId);
      }
      return true;
    } catch (error) {
      console.error('Failed to sync cart to API:', error);
      return false;
    }
  }

  static async loadOrdersFromAPI(userId: string) {
    try {
      const orders: any[] = await apiClient.getOrders(userId);
      const transformedSales = orders.map(order => ({
        id: order.id,
        receiptNo: order.receipt_no,
        memberId: order.user_id,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id || item.productId,
          productName: item.product_name || item.productName || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.unit_price || item.unitPrice,
          subtotal: item.subtotal,
          selectedOptions: item.selected_options || item.selectedOptions || {},
        })),
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method as 'cash' | 'ewallet',
        status: order.status as 'completed' | 'pending' | 'cancelled',
        createdAt: order.created_at,
      }));
      useAppStore.setState({ sales: transformedSales });
      return transformedSales;
    } catch (error) {
      console.error('Failed to load orders from API:', error);
      return [];
    }
  }

  static async createOrderFromCart(userId: string) {
    try {
      const cart = useAppStore.getState().cart;
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const items = cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
        selectedOptions: item.selectedOptions || {},
      }));

      const orderData = {
        items,
        totalAmount: total,
        paymentMethod: 'cash',
        receiptNo: `RCP-${Date.now()}`,
      };

      const newOrder = await apiClient.createOrder(orderData, userId);
      
      // Add order to local store
      const sale = {
        id: newOrder.id,
        receiptNo: newOrder.receipt_no,
        memberId: newOrder.user_id,
        items: items.map((item: any) => ({
          id: `item-${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          selectedOptions: item.selectedOptions,
        })),
        totalAmount: newOrder.total_amount,
        paymentMethod: newOrder.payment_method as 'cash' | 'ewallet',
        status: newOrder.status as 'completed' | 'pending' | 'cancelled',
        createdAt: newOrder.created_at,
      };

      useAppStore.setState(state => ({
        sales: [...state.sales, sale],
        cart: [],
      }));

      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: 'completed' | 'pending' | 'cancelled', userId: string) {
    try {
      await apiClient.updateOrderStatus(orderId, status, userId);
      useAppStore.setState(state => ({
        sales: state.sales.map(s =>
          s.id === orderId ? { ...s, status } : s
        ),
      }));
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  }

  static async cancelOrderForUser(orderId: string, userId: string) {
    try {
      await apiClient.cancelOrder(orderId, userId);
      useAppStore.setState(state => ({
        sales: state.sales.map(s =>
          s.id === orderId ? { ...s, status: 'cancelled' } : s
        ),
      }));
      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  static async deleteOrder(orderId: string, userId: string) {
    try {
      await apiClient.deleteOrder(orderId, userId);
      useAppStore.setState(state => ({
        sales: state.sales.filter(s => s.id !== orderId),
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete order:', error);
      return false;
    }
  }

  static async loadMessagesFromAPI(userId: string, folder: 'inbox' | 'sent' = 'inbox') {
    try {
      const messages: any[] = await apiClient.getMessages(folder, userId);
      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderRole: msg.sender_role,
        recipientId: msg.recipient_id,
        recipientName: msg.recipient_name,
        recipientRole: msg.recipient_role,
        subject: msg.subject,
        content: msg.content,
        preview: msg.preview,
        timestamp: msg.created_at,
        isRead: msg.is_read,
        isFavorite: msg.is_favorite,
        folder: msg.folder,
        status: msg.status,
      }));
      useAppStore.setState({ messages: transformedMessages });
      return transformedMessages;
    } catch (error) {
      console.error('Failed to load messages from API:', error);
      return [];
    }
  }

  static async sendMessageViaAPI(messageData: any, userId: string) {
    try {
      const sentMessage = await apiClient.sendMessage(messageData, userId);
      
      // Add to local store
      useAppStore.setState(state => ({
        messages: [...state.messages, {
          id: sentMessage.id,
          senderId: sentMessage.sender_id,
          senderName: sentMessage.sender_name,
          senderRole: sentMessage.sender_role,
          recipientId: sentMessage.recipient_id,
          recipientName: sentMessage.recipient_name,
          recipientRole: sentMessage.recipient_role,
          subject: sentMessage.subject,
          content: sentMessage.content,
          preview: sentMessage.preview,
          timestamp: sentMessage.created_at,
          isRead: sentMessage.is_read,
          isFavorite: sentMessage.is_favorite,
          folder: sentMessage.folder,
          status: sentMessage.status,
        }],
      }));

      return sentMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  static async initializeAppData(userId: string) {
    try {
      // Load all data in parallel
      await Promise.all([
        AppDataSync.loadCartFromAPI(userId),
        AppDataSync.loadOrdersFromAPI(userId),
        AppDataSync.loadMessagesFromAPI(userId, 'inbox'),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      return false;
    }
  }
}
