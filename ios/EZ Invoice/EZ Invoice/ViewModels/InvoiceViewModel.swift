import Combine
import Foundation

@MainActor
final class InvoiceViewModel: ObservableObject {
    @Published private(set) var selectedInvoiceURL: URL?
    @Published private(set) var invoice: LCBOInvoice?
    @Published private(set) var isProcessing = false
    @Published private(set) var isPreparingPDF = false
    @Published var errorMessage: String?
    @Published var shareDocument: ShareDocument?

    private let apiClient = InvoiceAPIClient()

    var selectedFileName: String? {
        selectedInvoiceURL?.lastPathComponent
    }

    var canProcess: Bool {
        selectedInvoiceURL != nil && !isProcessing
    }

    func selectInvoice(_ url: URL) {
        selectedInvoiceURL = url
        invoice = nil
        shareDocument = nil
        errorMessage = nil
    }

    func processSelectedInvoice() async {
        guard let selectedInvoiceURL else {
            errorMessage = "Choose an LCBO invoice PDF first."
            return
        }

        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        do {
            invoice = try await apiClient.processInvoice(at: selectedInvoiceURL)
        } catch {
            show(error)
        }
    }

    func preparePDF() async {
        guard let invoice else { return }

        isPreparingPDF = true
        errorMessage = nil
        defer { isPreparingPDF = false }

        do {
            shareDocument = ShareDocument(url: try await apiClient.createPDF(for: invoice))
        } catch {
            show(error)
        }
    }

    func show(_ error: Error) {
        errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
    }
}
