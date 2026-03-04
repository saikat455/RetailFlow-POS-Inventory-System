import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

const fmt  = (n) => `৳${Number(n || 0).toFixed(2)}`
const fmtN = (n) => Number(n || 0).toFixed(2)

export default function Invoice() {
  const { invoiceNo } = useParams()
  const [sale, setSale]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.get(`/sales/invoice/${invoiceNo}`)
      .then(r => setSale(r.data))
      .catch(() => setError('Invoice not found.'))
      .finally(() => setLoading(false))
  }, [invoiceNo])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-gray-400 text-sm flex items-center gap-2">
        <i className="bi bi-arrow-repeat animate-spin" /> Loading invoice...
      </div>
    </div>
  )

  if (error || !sale) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
        <i className="bi bi-receipt text-4xl text-gray-300 block mb-3" />
        <p className="text-gray-500 font-semibold mb-1">Invoice not found</p>
        <p className="text-xs text-gray-400">{invoiceNo}</p>
      </div>
    </div>
  )

  const subtotal = sale.items.reduce((s, i) => s + i.subtotal, 0)

  return (
    <>
      {/* Print action bar — hidden on print */}
      <div className="print:hidden bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer font-[inherit]">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">{sale.invoiceNo}</span>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-0 font-[inherit] transition-colors">
          <i className="bi bi-printer-fill" /> Print Invoice
        </button>
      </div>

      {/* Invoice paper */}
      <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white">
        <div id="invoice-paper"
          className="bg-white mx-auto shadow-lg print:shadow-none"
          style={{ width: '210mm', minHeight: '297mm', padding: '14mm 16mm' }}>

          {/* ── Header ── */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-gray-900">
            {/* Company info */}
            <div>
              <div className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                {sale.companyName}
              </div>
              {sale.companyAddress && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <i className="bi bi-geo-alt print:hidden" />{sale.companyAddress}
                </div>
              )}
              {sale.companyPhone && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <i className="bi bi-telephone print:hidden" />{sale.companyPhone}
                </div>
              )}
            </div>

            {/* INVOICE label + number */}
            <div className="text-right">
              <div className="text-3xl font-black text-gray-200 tracking-widest uppercase mb-1">
                INVOICE
              </div>
              <div className="text-base font-bold text-blue-600 font-mono">{sale.invoiceNo}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {new Date(sale.saleDate).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(sale.saleDate).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* ── Branch + Customer info ── */}
          <div className="grid grid-cols-2 gap-8 py-5 border-b border-gray-100">
            {/* Branch (From) */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Branch</div>
              <div className="font-semibold text-gray-800 text-sm">{sale.branchName}</div>
              {sale.branchAddress && <div className="text-xs text-gray-500 mt-0.5">{sale.branchAddress}</div>}
              {sale.branchPhone   && <div className="text-xs text-gray-500 mt-0.5">{sale.branchPhone}</div>}
              <div className="text-xs text-gray-500 mt-0.5">
                Cashier: <span className="font-medium text-gray-700">{sale.cashierName}</span>
              </div>
            </div>

            {/* Customer (Bill To) */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</div>
              {sale.customerName ? (
                <>
                  <div className="font-semibold text-gray-800 text-sm">{sale.customerName}</div>
                  {sale.customerPhone && <div className="text-xs text-gray-500 mt-0.5">{sale.customerPhone}</div>}
                </>
              ) : (
                <div className="text-sm text-gray-400 italic">Walk-in Customer</div>
              )}
            </div>
          </div>

          {/* ── Items table ── */}
          <div className="mt-5">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide rounded-tl-lg">#</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Item</th>
                  <th className="text-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Qty</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-600">{fmtN(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gray-800">{fmtN(item.subtotal)}</td>
                  </tr>
                ))}
                {/* Empty rows for short invoices */}
                {sale.items.length < 5 && Array.from({ length: 5 - sale.items.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-xs text-transparent">-</td>
                    <td className="px-4 py-3" colSpan={4} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div className="flex justify-end mt-4">
            <div className="w-64">
              <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono text-gray-700">{fmtN(subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-mono text-red-500">- {fmtN(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2.5 border-t-2 border-gray-900 mt-1">
                <span className="font-bold text-gray-900 text-base">Total</span>
                <span className="font-black text-gray-900 text-lg font-mono">{fmtN(sale.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="mt-12 pt-5 border-t border-gray-100">
            <div className="flex items-start justify-between">
              {/* Thank you note */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-1">Thank you for your purchase!</div>
                <div className="text-xs text-gray-400">
                  Please keep this invoice for your records.
                </div>
              </div>
              {/* Signature */}
              <div className="text-right">
                <div className="w-32 border-b border-gray-400 mb-1 ml-auto" />
                <div className="text-xs text-gray-500">Authorized Signature</div>
              </div>
            </div>

            {/* Bottom strip */}
            <div className="mt-8 bg-gray-900 rounded-lg px-5 py-3 flex items-center justify-between">
              <div className="text-white/60 text-[11px] font-mono">{sale.invoiceNo}</div>
              <div className="text-white font-bold text-sm">{sale.companyName}</div>
              <div className="text-white/60 text-[11px]">
                {new Date(sale.saleDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          #invoice-paper { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
    </>
  )
}
