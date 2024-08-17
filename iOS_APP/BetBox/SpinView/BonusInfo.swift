import Foundation

struct BonusInfo: Codable, Identifiable {
    let id = UUID()
    let date: Date
    let result: BonusResult

    struct BonusResult: Codable {
        let tipo: String
        let valore: String
    }

    enum CodingKeys: String, CodingKey {
        case date, result
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let dateString = try container.decode(String.self, forKey: .date)
        date = ISO8601DateFormatter().date(from: dateString) ?? Date()
        result = try container.decode(BonusResult.self, forKey: .result)
    }
}
