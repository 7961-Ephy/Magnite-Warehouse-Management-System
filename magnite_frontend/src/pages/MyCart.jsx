import { useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingCart } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useCart } from "../context/CartContext";
import CheckoutButton from "../components/CheckoutButton";

const MyCart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("product", {
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <img
            src={row.original.image}
            alt={row.original.name}
            className="w-16 h-16 object-cover rounded"
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    }),
    columnHelper.accessor("quantity", {
      header: "Quantity",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateQuantity(row.original.product_id, row.original.quantity - 1)
            }
            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Minus size={16} className="text-gray-600" />
          </button>

          <input
            type="number"
            min="1"
            value={row.original.quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 1) {
                updateQuantity(row.original.product_id, value);
              }
            }}
            className="w-16 text-center border rounded-lg py-1"
          />

          <button
            onClick={() =>
              updateQuantity(row.original.product_id, row.original.quantity + 1)
            }
            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>
      ),
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium">
          Ksh
          {(
            row.original.price_per_unit * row.original.quantity
          ).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("actions", {
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => removeFromCart(row.original.product_id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 size={18} />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: cartItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-8 min-h-[400px]">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
              <ShoppingCart size={64} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 text-center mb-8 max-w-md">
              Looks like you haven&apos;t added any items to your cart yet.
              Start shopping to find amazing products!
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowLeft size={20} className="mr-2" />
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft size={16} className="mr-2" />
                Continue Shopping
              </button>

              <div className="text-xl font-bold">
                Total: Ksh{getCartTotal().toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <CheckoutButton />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyCart;
