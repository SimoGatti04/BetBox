import Foundation

struct BonusInfo: Codable, Identifiable {
    let id = UUID()
    let tipo: String
    let valore: String
    let date: Date
    
    enum CodingKeys: String, CodingKey {
        case tipo, valore
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        tipo = try container.decode(String.self, forKey: .tipo)
        valore = try container.decode(String.self, forKey: .valore)
        date = Date()
    }
}
