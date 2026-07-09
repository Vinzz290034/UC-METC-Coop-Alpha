import { apiClient } from '../services/api';
import { useAppStore } from './appStore';
import { getProductImageByName } from '../utils/productImageResolver';

export class AppDataSync {
  static async loadCartFromAPI(userId: string) {
    try {
      const cartItems: any[] = await apiClient.getCart(userId);
      const products = useAppStore.getState().products;
      const transformedItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.product_id);
        // Find custom image in variants if available
        let itemImage = product?.image || '';
        const selectedOptions = item.selected_options || {};
        if (product && product.variants && Object.keys(product.variants).length > 0) {
          const variantKey = Object.entries(selectedOptions)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
          const variant = product.variants[variantKey];
          if (variant && (variant as any).image) {
            itemImage = (variant as any).image;
          } else {
            // Try to find first matching option variant
            const matchingVariant = Object.entries(product.variants).find(([key, val]) => {
              const parts = key.split('|').reduce((acc, part) => {
                const [optId, optVal] = part.split(':');
                if (optId && optVal) acc[optId] = optVal;
                return acc;
              }, {} as Record<string, string>);
              return Object.entries(selectedOptions).every(([selId, selVal]) => parts[selId] === selVal) && (val as any).image;
            });
            if (matchingVariant) {
              itemImage = (matchingVariant[1] as any).image;
            }
          }
        }
        
        // Fallback to client-side image resolver if database image is empty or placeholder
        if (!itemImage || itemImage === '📦' || itemImage.trim() === '') {
          itemImage = getProductImageByName(item.product_name, selectedOptions) || '';
        }

        return {
          id: item.id,          // DB row id — used for per-item updates/deletes
          productId: item.product_id,
          name: item.product_name,
          price: Number(item.price),
          quantity: item.quantity,
          image: itemImage,
          selectedOptions,
          paymentType: item.payment_type || undefined,
          orderType: item.order_type || 'regular',
          fullPrice: item.full_price ? Number(item.full_price) : undefined,
        };
      });
      useAppStore.setState({ cart: transformedItems });
      return transformedItems;
    } catch (error) {
      console.error('Failed to load cart from API:', error);
      return [];
    }
  }

  /**
   * Add a single item to the backend cart.
   * Uses ON CONFLICT upsert — safe to call on "Add to Cart".
   */
  static async addCartItemToAPI(item: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    selectedOptions?: Record<string, string>;
    paymentType?: string;
    orderType?: string;
    fullPrice?: number;
  }, userId: string) {
    try {
      const result = await apiClient.addToCart({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        paymentType: item.paymentType,
        orderType: item.orderType,
        fullPrice: item.fullPrice,
      }, userId);
      // Reload cart to get the server-authoritative state (includes DB row id)
      await AppDataSync.loadCartFromAPI(userId);
      return result;
    } catch (error) {
      console.error('Failed to add cart item to API:', error);
    }
  }

  /**
   * Remove a single cart item from the backend by its DB row id.
   */
  static async removeCartItemFromAPI(dbRowId: string, userId: string) {
    try {
      await apiClient.removeFromCart(dbRowId, userId);
    } catch (error) {
      console.error('Failed to remove cart item from API:', error);
    }
  }

  /**
   * Update the quantity of a single cart item on the backend.
   */
  static async updateCartItemInAPI(dbRowId: string, quantity: number, userId: string) {
    try {
      await apiClient.updateCartItem(dbRowId, quantity, userId);
    } catch (error) {
      console.error('Failed to update cart item in API:', error);
    }
  }

  /** @deprecated Use addCartItemToAPI / removeCartItemFromAPI / updateCartItemInAPI instead */
  static async syncCartToAPI(userId: string) {
    // Legacy: kept for safety but should not be called for normal cart mutations.
    // Only used after order checkout to ensure the cart is truly cleared.
    try {
      await apiClient.clearCart(userId);
      return true;
    } catch (error) {
      console.error('Failed to clear cart on API:', error);
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
          paymentType: item.payment_type || item.paymentType,
          orderType: item.order_type || item.orderType,
          fullPrice: item.full_price || item.fullPrice,
        })),
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method as 'cash' | 'ewallet',
        status: order.status as 'completed' | 'pending' | 'cancelled' | 'released',
        createdAt: order.created_at,
        completedAt: order.completed_at,
        order_type: order.order_type, // Add order_type field
        reference_number: order.reference_number,
        referenceNumber: order.reference_number,
      }));
      useAppStore.setState({ sales: transformedSales });
      return transformedSales;
    } catch (error) {
      console.error('Failed to load orders from API:', error);
      return [];
    }
  }

  static async createOrderFromCart(
    userId: string, 
    paymentMethod: 'cash' | 'ewallet' = 'cash',
    referenceNumber: string | null = null
  ) {
    try {
      const cart = useAppStore.getState().cart;
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const items = cart.map(item => {
        const orderItem: any = {
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          selectedOptions: item.selectedOptions || {},
        };
        
        // Only include optional fields if they exist
        if (item.paymentType) orderItem.paymentType = item.paymentType;
        if (item.orderType) orderItem.orderType = item.orderType;
        if (item.fullPrice) orderItem.fullPrice = item.fullPrice;
        
        return orderItem;
      });

      // Validate payment method
      if (!['cash', 'ewallet'].includes(paymentMethod)) {
        throw new Error('Invalid payment method. Must be "cash" or "ewallet".');
      }

      const orderData = {
        items,
        totalAmount: total,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber,
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
        referenceNumber: newOrder.reference_number,
        status: newOrder.status as 'completed' | 'pending' | 'cancelled' | 'released',
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

  static async createOrderFromBalancePayment(orderData: any, userId: string) {
    try {
      const newOrder = await apiClient.createOrder(orderData, userId);
      
      // Add order to local store
      const sale = {
        id: newOrder.id,
        receiptNo: newOrder.receipt_no,
        memberId: newOrder.user_id,
        items: orderData.items.map((item: any) => ({
          id: `item-${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          selectedOptions: item.selectedOptions,
          paymentType: item.paymentType,
          orderType: item.orderType,
          fullPrice: item.fullPrice,
        })),
        totalAmount: newOrder.total_amount,
        paymentMethod: newOrder.payment_method as 'cash' | 'ewallet',
        referenceNumber: newOrder.reference_number,
        status: newOrder.status as 'completed' | 'pending' | 'cancelled' | 'released',
        createdAt: newOrder.created_at,
      };

      useAppStore.setState(state => ({
        sales: [...state.sales, sale],
      }));

      return newOrder;
    } catch (error) {
      console.error('Failed to create balance payment order:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: 'completed' | 'pending' | 'cancelled' | 'released', userId: string) {
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
      throw error;
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
      throw error;
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
      
      // Merge with existing messages - remove old messages from this folder and add new ones
      useAppStore.setState(state => ({
        messages: [
          ...state.messages.filter(m => m.folder !== folder),
          ...transformedMessages
        ]
      }));
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
      // Load products first so they are available in the store
      await AppDataSync.loadProductsFromAPI();
      
      // Load the rest of the user data in parallel
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

  static async loadProductsFromAPI() {
    try {
      const products: any[] = await apiClient.getProducts();
      const transformedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        sku: p.sku,
        image: p.image,
        note: p.note,
        options: p.options,
        variants: p.variants,
        allowPreorder: p.allow_preorder !== false,
        madeToOrder: p.made_to_order === true,
        available: p.available !== false,
        createdAt: p.created_at,
      }));
      useAppStore.setState({ products: transformedProducts });
      return transformedProducts;
    } catch (error) {
      console.error('Failed to load products from API:', error);
      // Return default products if API fails
      return useAppStore.getState().products;
    }
  }

  static async syncProductToAPI(product: any) {
    try {
      // Check if product exists in database
      const existingProducts = await apiClient.getProducts();
      const exists = existingProducts.some((p: any) => p.id === product.id);

      if (exists) {
        await apiClient.updateProduct(product.id, product);
      } else {
        await apiClient.createProduct(product);
      }
      return true;
    } catch (error) {
      console.error('Failed to sync product to API:', error);
      throw error;
    }
  }

  static async deleteProductFromAPI(productId: string) {
    try {
      await apiClient.deleteProduct(productId);
      return true;
    } catch (error) {
      console.error('Failed to delete product from API:', error);
      return false;
    }
  }
}
