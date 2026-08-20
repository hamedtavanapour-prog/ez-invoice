import SwiftUI

enum AppColors {
    static let blue = Color(red: 0.14, green: 0.44, blue: 0.71)
    static let lightBlue = Color(red: 0.40, green: 0.71, blue: 1.00)
    static let navy = Color(red: 0.04, green: 0.12, blue: 0.23)
    static let page = Color(uiColor: .systemGroupedBackground)
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let border = Color(uiColor: .separator).opacity(0.35)
    static let muted = Color(uiColor: .secondaryLabel)
}

struct InvoiceMark: View {
    var color = AppColors.blue

    var body: some View {
        Canvas { context, size in
            let scaleX = size.width / 64
            let scaleY = size.height / 64
            let points: [[CGPoint]] = [
                [CGPoint(x: 7, y: 13), CGPoint(x: 25, y: 13), CGPoint(x: 31.8, y: 16.2), CGPoint(x: 39.8, y: 25.2)],
                [CGPoint(x: 7, y: 29), CGPoint(x: 22.5, y: 29), CGPoint(x: 29.3, y: 32.2), CGPoint(x: 35.7, y: 39.2)],
                [CGPoint(x: 7, y: 45), CGPoint(x: 20, y: 45), CGPoint(x: 26.7, y: 48.2), CGPoint(x: 30.8, y: 52.7), CGPoint(x: 57, y: 16)]
            ]

            for line in points {
                var path = Path()
                if let first = line.first {
                    path.move(to: CGPoint(x: first.x * scaleX, y: first.y * scaleY))
                    for point in line.dropFirst() {
                        path.addLine(to: CGPoint(x: point.x * scaleX, y: point.y * scaleY))
                    }
                }
                context.stroke(
                    path,
                    with: .color(color),
                    style: StrokeStyle(
                        lineWidth: min(size.width, size.height) * 0.097,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }
}

struct AppHeader: View {
    var body: some View {
        HStack(spacing: 12) {
            InvoiceMark()
                .frame(width: 42, height: 42)

            VStack(alignment: .leading, spacing: 2) {
                Text("EZ Invoice")
                    .font(.title3.weight(.bold))
                Text("Clear invoice calculations")
                    .font(.caption)
                    .foregroundStyle(AppColors.muted)
            }

            Spacer()

            Image(systemName: "lock.shield")
                .foregroundStyle(AppColors.blue)
                .accessibilityLabel("Private processing")
        }
    }
}
