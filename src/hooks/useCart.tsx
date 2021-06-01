import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number): Promise<void> => {
    try {
      const updatedCart = [...cart];
      //Verificando se o id fornecido está em localStorage
      //Se existir, irá ser recuperado o obj em questão
      const productExists = updatedCart.find(product => product.id === productId);

      //É pego o obj stock que corresponde ao id fornecido
      const stock = await api.get(`/stock/${productId}`);

      //É pego o quantidade de produtos em stock
      const stockAmount = stock.data.amount;

      //Quantidade Atual => 
      //Se o produto existir em localStorage, é pego a quantidade do mesmo
      //Caso não existir em localStorage o valor é 0 
      const currentAmount = productExists ? productExists.amount : 0;

      //Quantidade desejada
      const amount = currentAmount + 1;

      //Se o objeto existir e a quantidade desejada for maior que a quantidade em estoque.
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      //Caso o produto exista em localStorage
      if (productExists) {
        productExists.amount = amount;
      }
      //Caso o produto não exista em localStorage
      else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount
        };
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const indexProduct = updatedCart.findIndex(product => product.id === productId);

      if (indexProduct >= 0) {
        updatedCart.splice(indexProduct, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
