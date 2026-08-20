# EZ Invoice for iOS

The native SwiftUI client lives in `ios/EZ Invoice`. It selects an LCBO invoice PDF on-device, sends it to the existing Vercel calculation API, displays the returned breakdown, and requests the same downloadable PDF report used by the website.

## Development

1. Open `EZ Invoice/EZ Invoice.xcodeproj` in Xcode.
2. Select the `EZ Invoice` scheme and a simulator or connected iPhone.
3. Confirm the Personal Team under **Signing & Capabilities**.
4. Build with **Product → Build** or run with **Product → Run**.

The app targets iOS 17 and later. It does not require Supabase credentials or other secrets. The production service URL is defined in `Services/InvoiceAPIClient.swift`.

## Privacy

Uploaded files are processed by the existing request-only invoice API. The app does not save the selected invoice or extracted data to a database. A generated report is written to the temporary app directory only when the user chooses to share or save the PDF.
