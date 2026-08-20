import SwiftUI

struct UploadCard: View {
    let selectedFileName: String?
    let isProcessing: Bool
    let canProcess: Bool
    let chooseFile: () -> Void
    let processInvoice: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 7) {
                Text("ONE INVOICE. CLEAR NUMBERS.")
                    .font(.caption2.weight(.bold))
                    .tracking(1.5)
                    .foregroundStyle(AppColors.blue)
                Text("Upload once. Get the complete breakdown.")
                    .font(.largeTitle.weight(.bold))
                    .tracking(-1.2)
                Text("Choose an LCBO shipped-order invoice and receive a clear calculation breakdown and downloadable report.")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.muted)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Invoice type")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AppColors.muted)

                HStack(spacing: 10) {
                    SupplierChoice(title: "LCBO", subtitle: "Liquor", symbol: "L", isEnabled: true)
                    SupplierChoice(title: "Beer Store", subtitle: "Coming soon", symbol: "B", isEnabled: false)
                }
            }

            Button(action: chooseFile) {
                HStack(spacing: 12) {
                    Image(systemName: "doc.badge.plus")
                        .font(.title3)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(selectedFileName ?? "Choose invoice PDF")
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                        Text(selectedFileName == nil ? "PDF, up to 4 MB" : "Ready to process")
                            .font(.caption)
                            .foregroundStyle(AppColors.muted)
                    }
                    Spacer()
                    Text(selectedFileName == nil ? "Browse" : "Replace")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppColors.blue)
                }
                .padding(14)
                .background(AppColors.page, in: RoundedRectangle(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(AppColors.border, style: StrokeStyle(lineWidth: 1, dash: [5]))
                }
            }
            .buttonStyle(.plain)

            Button(action: processInvoice) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isProcessing ? "Reading invoice…" : "Process invoice")
                        .fontWeight(.semibold)
                    if !isProcessing {
                        Image(systemName: "arrow.right")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.roundedRectangle(radius: 13))
            .disabled(!canProcess)

            Label("Processed for this request only. Nothing is stored.", systemImage: "lock")
                .font(.caption)
                .foregroundStyle(AppColors.muted)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(18)
        .background(AppColors.card, in: RoundedRectangle(cornerRadius: 24))
        .overlay {
            RoundedRectangle(cornerRadius: 24)
                .stroke(AppColors.border)
        }
    }
}

private struct SupplierChoice: View {
    let title: String
    let subtitle: String
    let symbol: String
    let isEnabled: Bool

    var body: some View {
        HStack(spacing: 9) {
            Text(symbol)
                .font(.caption.weight(.bold))
                .foregroundStyle(isEnabled ? .white : AppColors.muted)
                .frame(width: 32, height: 32)
                .background(isEnabled ? AppColors.blue : Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 9))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption.weight(.semibold))
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(AppColors.muted)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(isEnabled ? AppColors.blue.opacity(0.08) : Color.clear, in: RoundedRectangle(cornerRadius: 13))
        .overlay {
            RoundedRectangle(cornerRadius: 13)
                .stroke(isEnabled ? AppColors.blue : AppColors.border)
        }
        .opacity(isEnabled ? 1 : 0.62)
    }
}

struct EmptyResultsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "tablecells")
                .font(.title)
                .foregroundStyle(AppColors.blue)
            Text("Your results will appear here")
                .font(.headline)
            Text("Upload an LCBO invoice to see its products, totals, difference, and downloadable PDF.")
                .font(.subheadline)
                .foregroundStyle(AppColors.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 42)
        .padding(.horizontal, 22)
        .background(AppColors.card, in: RoundedRectangle(cornerRadius: 24))
        .overlay {
            RoundedRectangle(cornerRadius: 24)
                .stroke(AppColors.border)
        }
    }
}

struct InvoiceResultsView: View {
    let invoice: LCBOInvoice
    let isPreparingPDF: Bool
    let downloadPDF: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Order \(invoice.orderNumber)")
                        .font(.title2.weight(.bold))
                    Spacer()
                    Text("\(invoice.items.count) items")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppColors.lightBlue)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(.white.opacity(0.08), in: Capsule())
                }

                Text(orderDetails)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.70))

                Button(action: downloadPDF) {
                    HStack {
                        if isPreparingPDF {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "square.and.arrow.up")
                        }
                        Text(isPreparingPDF ? "Preparing PDF…" : "Download or share PDF")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                }
                .buttonStyle(.borderedProminent)
                .buttonBorderShape(.roundedRectangle(radius: 13))
                .disabled(isPreparingPDF)
            }
            .padding(18)
            .background(AppColors.navy, in: RoundedRectangle(cornerRadius: 22))
            .foregroundStyle(.white)

            VStack(spacing: 0) {
                SummaryRow(label: "Calculated product total", value: money(invoice.totals.calculatedProductTotal), isEmphasized: true)
                SummaryRow(label: "Delivery fee", value: invoice.totals.deliveryFee.map(money) ?? "Not provided")
                SummaryRow(label: "HST included", value: money(invoice.totals.hstIncluded))
                SummaryRow(label: "Container deposit", value: money(invoice.totals.containerDepositIncluded))
                SummaryRow(label: "Calculated invoice total", value: money(invoice.totals.calculatedInvoiceTotal))
                SummaryRow(label: "LCBO invoice total", value: money(invoice.totals.total), isEmphasized: true)
                SummaryRow(label: "Difference", value: signedMoney(invoice.totals.difference), isLast: true)
            }
            .background(AppColors.card, in: RoundedRectangle(cornerRadius: 22))
            .overlay {
                RoundedRectangle(cornerRadius: 22)
                    .stroke(AppColors.border)
            }

            LazyVStack(spacing: 12) {
                ForEach(Array(invoice.items.enumerated()), id: \.offset) { _, item in
                    ProductCard(item: item)
                }
            }
        }
    }

    private var orderDetails: String {
        if let deliveryDate = invoice.expectedDeliveryDate {
            return "Order date \(invoice.orderDate) · Expected \(deliveryDate)"
        }
        return "Order date \(invoice.orderDate)"
    }
}

private struct SummaryRow: View {
    let label: String
    let value: String
    var isEmphasized = false
    var isLast = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 16) {
            Text(label)
                .font(isEmphasized ? .subheadline.weight(.semibold) : .subheadline)
                .foregroundStyle(isEmphasized ? Color.primary : AppColors.muted)
            Spacer()
            Text(value)
                .font(.subheadline.weight(isEmphasized ? .bold : .semibold))
                .monospacedDigit()
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .overlay(alignment: .bottom) {
            if !isLast {
                Divider().padding(.leading, 16)
            }
        }
    }
}

private struct ProductCard: View {
    let item: LCBOItem

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.headline)
                Text("LCBO #\(item.lcboNumber) · \(item.sizeMl) mL")
                    .font(.caption)
                    .foregroundStyle(AppColors.muted)
            }

            VStack(spacing: 9) {
                DetailRow(label: "Quantity ordered", value: "\(item.quantityOrdered)")
                DetailRow(label: "Unit price", value: money(item.unitPrice))
                DetailRow(label: "Deposit", value: "− \(money(item.bottleDeposit))")
                Divider().padding(.vertical, 2)
                DetailRow(label: "Fulfilled", value: "\(item.quantityFulfilled)")
                DetailRow(label: "Net unit", value: netMoney(item.netUnitPrice))
                DetailRow(label: "Product total", value: money(item.calculatedTotal), isEmphasized: true)
            }
        }
        .padding(17)
        .background(AppColors.card, in: RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(AppColors.border)
        }
    }
}

private struct DetailRow: View {
    let label: String
    let value: String
    var isEmphasized = false

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(0.8)
                .foregroundStyle(AppColors.muted)
            Spacer()
            Text(value)
                .font(.subheadline.weight(isEmphasized ? .bold : .medium))
                .foregroundStyle(isEmphasized ? AppColors.blue : Color.primary)
                .monospacedDigit()
        }
    }
}

struct PrivacyFooter: View {
    var body: some View {
        VStack(spacing: 10) {
            InvoiceMark(color: AppColors.lightBlue)
                .frame(width: 32, height: 32)
            Text("Your invoice remains yours.")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Files are processed only for the current calculation. EZ Invoice does not save uploaded invoices or extracted invoice data to a database.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.72))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 22)
        .padding(.vertical, 28)
        .background(AppColors.navy, in: RoundedRectangle(cornerRadius: 24))
    }
}

private func money(_ value: Double) -> String {
    value.formatted(.currency(code: "CAD").precision(.fractionLength(2)))
}

private func netMoney(_ value: Double) -> String {
    value.formatted(.currency(code: "CAD").precision(.fractionLength(4)))
}

private func signedMoney(_ value: Double) -> String {
    let formatted = money(abs(value))
    if value > 0 { return "+\(formatted)" }
    if value < 0 { return "−\(formatted)" }
    return formatted
}
