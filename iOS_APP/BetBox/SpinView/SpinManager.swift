import Foundation
import Combine
import UserNotifications
import BackgroundTasks

class SpinManager: NSObject, ObservableObject {
    @Published var bonusHistory: [String: [BonusInfo]] = [:]
    static let shared = SpinManager()
    private var lastExecutionTimes: [UUID: Date] = [:]
    private var cancellables = Set<AnyCancellable>()
    var backgroundCompletionHandler: (() -> Void)?
    private var backgroundTasks: [() -> Void] = []
    
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "simogatti.BetBox.backgroundsession")
        config.sessionSendsLaunchEvents = true
        config.isDiscretionary = false
        config.shouldUseExtendedBackgroundIdleMode = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    override private init() {
        super.init()
        loadSavedData()
    }
    
    func forceUpdate() {
        objectWillChange.send()
    }
    
    func loadSavedData() {
        loadSavedBonusHistory()
        cleanupOldBonuses()
    }

    func loadSavedBonusHistory() {
        if let data = try? Data(contentsOf: getBonusHistoryFileURL()),
           let savedHistory = try? JSONDecoder().decode([String: [BonusInfo]].self, from: data) {
            bonusHistory = savedHistory
        }
    }
    
    func saveBonusHistory() {
        if let data = try? JSONEncoder().encode(bonusHistory) {
            try? data.write(to: getBonusHistoryFileURL())
        }
    }
    
    private func getBonusHistoryFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("bonusHistory.json")
    }
    
    func performSpin(for site: String) {
        guard !isSpinPerformedToday(for: site) else { return }
        
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
        guard let url = URL(string: urlString) else {
            print("URL non valido per \(site)")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let task = backgroundSession.dataTask(with: request)
        task.resume()
    }
    
    func checkAllSpinStatus() {
        for site in ["goldbet", "lottomatica", "snai"] {
            objectWillChange.send()
        }
    }
    
    private func addBonusToHistory(site: String, bonusInfo: BonusInfo) {
        if var siteHistory = bonusHistory[site] {
            siteHistory.append(bonusInfo)
            bonusHistory[site] = siteHistory
        } else {
            bonusHistory[site] = [bonusInfo]
        }
    }
    
    private func cleanupOldBonuses() {
        let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        for (site, bonuses) in bonusHistory {
            bonusHistory[site] = bonuses.filter { $0.date > fiveDaysAgo }
        }
        saveBonusHistory()
    }
    
    func isSpinPerformedToday(for site: String) -> Bool {
        guard let siteHistory = bonusHistory[site] else { return false }
        let today = Calendar.current.startOfDay(for: Date())
        return siteHistory.contains { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }
    
    func clearBonusHistory(for site: String) {
        bonusHistory[site] = []
        saveBonusHistory()
    }
    
    func processBackgroundTasks(completion: @escaping () -> Void) {
        let tasks = backgroundTasks
        backgroundTasks.removeAll()
        
        let group = DispatchGroup()
        
        for task in tasks {
            group.enter()
            DispatchQueue.global().async {
                task()
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            completion()
            self.backgroundCompletionHandler?()
            self.backgroundCompletionHandler = nil
        }
    }

    func fetchBonusHistory() {
        let sites = ["goldbet", "lottomatica", "snai"]

        for site in sites {
            let urlString = "https://legally-modest-joey.ngrok-free.app/spin-history/\(site)"
            guard let url = URL(string: urlString) else { continue }

            URLSession.shared.dataTask(with: url) { data, response, error in
                if let data = data, let stringData = String(data: data, encoding: .utf8) {
                    print("Risposta integrale per \(site):")
                    print(stringData)
                    
                    do {
                        let bonusHistory = try JSONDecoder().decode([BonusInfo].self, from: data)
                        DispatchQueue.main.async {
                            self.bonusHistory[site] = bonusHistory
                            print("Bonus history decodificata per \(site): \(bonusHistory)")
                            self.objectWillChange.send()
                        }
                    } catch {
                        print("Errore nella decodifica per \(site): \(error)")
                    }
                }
            }.resume()
        }
    }

    func getLastBonus(for site: String) -> BonusInfo? {
        return bonusHistory[site]?.last { $0.result.tipo != nil && $0.result.valore != nil }
    }
}

extension SpinManager: URLSessionDelegate, URLSessionDataDelegate {
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        DispatchQueue.main.async {
            do {
                let bonusInfo = try JSONDecoder().decode(BonusInfo.self, from: data)
                self.addBonusToHistory(site: dataTask.originalRequest?.url?.lastPathComponent ?? "", bonusInfo: bonusInfo)
                self.saveBonusHistory()
            } catch {
                print("Errore nella decodifica: \(error)")
            }
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("Errore nella richiesta di spin: \(error)")
        } else {
            print("Richiesta di spin completata con successo")
        }
        DispatchQueue.main.async {
            self.objectWillChange.send()
        }
    }

    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.backgroundCompletionHandler?()
        }
    }
}
