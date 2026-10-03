import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type CartProduct = Pick<
  Doc<"products">,
  "_id" | "name" | "slug" | "price" | "images" | "comparePrice"
>;

export interface CustomProductAttribute {
  name: string;
  value: string;
}

export interface GuestCartItem {
  localId: string;
  productId: CartProduct["_id"];
  quantity: number;
  size: string;
  color: string;
  customAttributes?: CustomProductAttribute[];
  product: CartProduct;
}

interface GuestCartContextValue {
  items: GuestCartItem[];
  addItem: (
    product: CartProduct,
    quantity: number,
    size: string,
    color: string,
    customAttributes?: CustomProductAttribute[],
  ) => void;
  updateQuantity: (localId: string, quantity: number) => void;
  removeItem: (localId: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "pd-stores-guest-cart";
const GuestCartContext = createContext<GuestCartContextValue | null>(null);

function readCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (item): item is GuestCartItem =>
        typeof item?.localId === "string" &&
        typeof item?.productId === "string" &&
        Number.isInteger(item?.quantity) &&
        item.quantity > 0 &&
        typeof item?.size === "string" &&
        typeof item?.color === "string" &&
        (item?.customAttributes === undefined ||
          (Array.isArray(item.customAttributes) &&
            item.customAttributes.every(
              (attribute: unknown) =>
                typeof attribute === "object" &&
                attribute !== null &&
                typeof (attribute as CustomProductAttribute).name === "string" &&
                typeof (attribute as CustomProductAttribute).value === "string",
            ))) &&
        typeof item?.product?.name === "string" &&
        typeof item?.product?.price === "number" &&
        Array.isArray(item?.product?.images),
    );
  } catch {
    return [];
  }
}

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const syncCart = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readCart());
    };
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const value: GuestCartContextValue = {
    items,
    addItem: (product, quantity, size, color, customAttributes = []) => {
      setItems((current) => {
        const existing = current.find(
          (item) =>
            item.productId === product._id &&
            item.size === size &&
            item.color === color &&
            JSON.stringify(item.customAttributes ?? []) === JSON.stringify(customAttributes),
        );
        if (existing) {
          return current.map((item) =>
            item.localId === existing.localId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [
          ...current,
          {
            localId: crypto.randomUUID(),
            productId: product._id,
            quantity,
            size,
            color,
            ...(customAttributes.length > 0 ? { customAttributes } : {}),
            product,
          },
        ];
      });
    },
    updateQuantity: (localId, quantity) => {
      setItems((current) =>
        quantity <= 0
          ? current.filter((item) => item.localId !== localId)
          : current.map((item) =>
              item.localId === localId ? { ...item, quantity } : item,
            ),
      );
    },
    removeItem: (localId) =>
      setItems((current) => current.filter((item) => item.localId !== localId)),
    clearCart: () => setItems([]),
  };

  return (
    <GuestCartContext.Provider value={value}>
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (!context) throw new Error("useGuestCart must be used within GuestCartProvider");
  return context;
}