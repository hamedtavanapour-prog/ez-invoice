import Foundation

struct LCBOInvoice: Codable, Sendable {
    let orderNumber: String?
    let orderDate: String
    let expectedDeliveryDate: String?
    let items: [LCBOItem]
    let totals: LCBOTotals
}

struct LCBOItem: Codable, Sendable {
    let name: String
    let lcboNumber: String
    let quantityOrdered: Int
    let quantityFulfilled: Int
    let unitPrice: Double
    let bottleDeposit: Double
    let sizeMl: Int
    let expectedDeliveryDate: String?
    let netUnitPrice: Double
    let calculatedTotal: Double
}

struct LCBOTotals: Codable, Sendable {
    let deliveryFee: Double?
    let total: Double
    let hstIncluded: Double
    let containerDepositIncluded: Double
    let calculatedProductTotal: Double
    let calculatedInvoiceTotal: Double
    let difference: Double
}

struct ShareDocument: Identifiable {
    let id = UUID()
    let url: URL
}
