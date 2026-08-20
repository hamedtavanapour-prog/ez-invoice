import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @StateObject private var viewModel = InvoiceViewModel()
    @State private var isShowingFileImporter = false

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 20) {
                    AppHeader()
                    UploadCard(
                        selectedFileName: viewModel.selectedFileName,
                        isProcessing: viewModel.isProcessing,
                        canProcess: viewModel.canProcess,
                        chooseFile: { isShowingFileImporter = true },
                        processInvoice: {
                            Task { await viewModel.processSelectedInvoice() }
                        }
                    )

                    if let invoice = viewModel.invoice {
                        InvoiceResultsView(
                            invoice: invoice,
                            isPreparingPDF: viewModel.isPreparingPDF,
                            downloadPDF: {
                                Task { await viewModel.preparePDF() }
                            }
                        )
                    } else {
                        EmptyResultsView()
                    }

                    PrivacyFooter()
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
            }
            .background(AppColors.page.ignoresSafeArea())
            .navigationBarHidden(true)
        }
        .tint(AppColors.blue)
        .fileImporter(
            isPresented: $isShowingFileImporter,
            allowedContentTypes: [.pdf],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                viewModel.selectInvoice(url)
            case .failure(let error):
                viewModel.show(error)
            }
        }
        .sheet(item: $viewModel.shareDocument) { document in
            ShareSheet(items: [document.url])
        }
        .alert(
            "EZ Invoice",
            isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "Something went wrong.")
        }
    }
}

#Preview {
    ContentView()
}
