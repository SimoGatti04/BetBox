import Foundation

struct SpinAutomation: Codable, Identifiable {
    let id = UUID()
    let site: String
    let time: Date
    var isEnabled: Bool
    var lastExecutionDate: Date?
    var status: AutomationStatus = .pending
}

enum AutomationStatus: String, Codable {
    case pending, executed, missed
}


