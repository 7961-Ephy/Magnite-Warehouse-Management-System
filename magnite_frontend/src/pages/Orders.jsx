import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Package,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  BanIcon,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/orders/list/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (orderId) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/create-payment-intent/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            order_id: orderId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await response.json();

      sessionStorage.setItem(
        "pendingOrderPayment",
        JSON.stringify({
          orderId,
          clientSecret,
        })
      );

      navigate("/checkout");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/accounts/orders/${orderId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "Order Number",
        accessorKey: "order_number",
      },
      {
        header: "Date",
        accessorKey: "order_date",
        cell: ({ row }) => {
          const date = new Date(row.original.order_date);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
      {
        header: "Payment Status",
        accessorKey: "payment_status",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-sm ${
              row.original.payment_status === "paid"
                ? "bg-green-100 text-green-800"
                : row.original.payment_status === "failed"
                ? "bg-red-100 text-red-800"
                : row.original.payment_status === "cancelled"
                ? "bg-gray-100 text-gray-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.original.payment_status}
          </span>
        ),
      },
      {
        header: "Order Status",
        accessorKey: "order_status",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-sm ${
              row.original.order_status === "processed"
                ? "bg-green-100 text-green-800"
                : row.original.order_status === "cancelled"
                ? "bg-gray-100 text-gray-800"
                : row.original.order_status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {row.original.order_status}
          </span>
        ),
      },
      {
        header: "Total",
        accessorKey: "total_price",
        cell: ({ row }) => `Ksh${row.original.total_price.toLocaleString()}`,
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.order_status === "cancelled") {
            return (
              <div className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-md">
                <BanIcon className="w-4 h-4 mr-2" />
                Order Cancelled
              </div>
            );
          } else if (
            row.original.payment_status === "paid" &&
            row.original.order_status === "processed"
          ) {
            return (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md">
                <CheckCircle className="w-4 h-4 mr-2" />
                Order Complete
              </div>
            );
          } else if (
            row.original.payment_status === "pending" ||
            row.original.payment_status === "failed"
          ) {
            return (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRetryPayment(row.original.id)}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Payment
                </button>
                <button
                  onClick={() => handleCancelOrder(row.original.id)}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              </div>
            );
          }
          return null;
        },
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-red-600">Error: {error}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Orders Available
            </h3>
            <p className="mt-2 text-gray-500">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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

            {/* Pagination Controls */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Page{" "}
                  <span className="font-medium">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{" "}
                  of <span className="font-medium">{table.getPageCount()}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className={`p-2 rounded-md ${
                    !table.getCanPreviousPage()
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className={`p-2 rounded-md ${
                    !table.getCanNextPage()
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Orders;
