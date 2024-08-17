import Foundation

struct SpinAutomation: Codable, Identifiable {
    let id = UUID()
    let site: String
    let time: Date
    var isEnabled: Bool
}
