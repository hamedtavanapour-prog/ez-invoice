import Foundation

struct InvoiceAPIClient {
    private let baseURL = URL(string: "https://ez-invoice-seven.vercel.app")!
    private let maximumInvoiceSize = 4 * 1024 * 1024

    func processInvoice(at fileURL: URL) async throws -> LCBOInvoice {
        let fileData = try readInvoice(at: fileURL)
        let boundary = "EZInvoice-\(UUID().uuidString)"
        var request = URLRequest(url: baseURL.appending(path: "api/invoices/lcbo"))
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = multipartFileBody(
            boundary: boundary,
            fieldName: "invoice",
            filename: fileURL.lastPathComponent,
            mimeType: "application/pdf",
            data: fileData
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        do {
            return try JSONDecoder().decode(LCBOInvoice.self, from: data)
        } catch {
            throw InvoiceAPIError.invalidResponse
        }
    }

    func createPDF(for invoice: LCBOInvoice) async throws -> URL {
        let encodedInvoice = try JSONEncoder().encode(invoice)
        guard let invoiceJSON = String(data: encodedInvoice, encoding: .utf8) else {
            throw InvoiceAPIError.invalidResponse
        }

        let boundary = "EZInvoice-\(UUID().uuidString)"
        var request = URLRequest(url: baseURL.appending(path: "api/invoices/lcbo/pdf"))
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue("application/pdf", forHTTPHeaderField: "Accept")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = multipartTextBody(
            boundary: boundary,
            fieldName: "invoice",
            value: invoiceJSON
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        let safeOrderNumber = (invoice.orderNumber ?? "")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" }
        let filename = "lcbo-order-\(safeOrderNumber.isEmpty ? "invoice" : safeOrderNumber).pdf"
        let destination = FileManager.default.temporaryDirectory.appending(path: filename)
        try data.write(to: destination, options: .atomic)
        return destination
    }

    private func readInvoice(at fileURL: URL) throws -> Data {
        let receivedAccess = fileURL.startAccessingSecurityScopedResource()
        defer {
            if receivedAccess {
                fileURL.stopAccessingSecurityScopedResource()
            }
        }

        let values = try fileURL.resourceValues(forKeys: [.fileSizeKey])
        if let fileSize = values.fileSize, fileSize > maximumInvoiceSize {
            throw InvoiceAPIError.fileTooLarge
        }

        let data = try Data(contentsOf: fileURL)
        guard data.count <= maximumInvoiceSize else {
            throw InvoiceAPIError.fileTooLarge
        }
        return data
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw InvoiceAPIError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            let payload = try? JSONDecoder().decode(APIErrorPayload.self, from: data)
            throw InvoiceAPIError.server(payload?.error ?? "The invoice service returned an error (\(httpResponse.statusCode)).")
        }
        guard !data.isEmpty else {
            throw InvoiceAPIError.invalidResponse
        }
    }

    private func multipartFileBody(
        boundary: String,
        fieldName: String,
        filename: String,
        mimeType: String,
        data: Data
    ) -> Data {
        var body = Data()
        body.appendUTF8("--\(boundary)\r\n")
        body.appendUTF8("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(filename)\"\r\n")
        body.appendUTF8("Content-Type: \(mimeType)\r\n\r\n")
        body.append(data)
        body.appendUTF8("\r\n--\(boundary)--\r\n")
        return body
    }

    private func multipartTextBody(boundary: String, fieldName: String, value: String) -> Data {
        var body = Data()
        body.appendUTF8("--\(boundary)\r\n")
        body.appendUTF8("Content-Disposition: form-data; name=\"\(fieldName)\"\r\n\r\n")
        body.appendUTF8(value)
        body.appendUTF8("\r\n--\(boundary)--\r\n")
        return body
    }
}

private struct APIErrorPayload: Decodable {
    let error: String
}

enum InvoiceAPIError: LocalizedError {
    case fileTooLarge
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .fileTooLarge:
            "The invoice PDF must be 4 MB or smaller."
        case .invalidResponse:
            "The invoice service returned an invalid response. Please try again."
        case .server(let message):
            message
        }
    }
}

private extension Data {
    mutating func appendUTF8(_ value: String) {
        append(contentsOf: value.utf8)
    }
}
