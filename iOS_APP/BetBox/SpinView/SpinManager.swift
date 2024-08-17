import Foundation
import Combine
import UserNotifications
import BackgroundTasks

class SpinManager: NSObject, ObservableObject {
    @Published var bonusHistory: [String: [BonusInfo]] = [:]
    @Published var automations: [SpinAutomation] = []
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
        setupAutomationTimer()
        registerBackgroundTasks()
    }

    func forceUpdate() {
        objectWillChange.send()
    }

    func loadSavedData() {
        loadSavedBonusHistory()
        loadSavedAutomations()
        cleanupOldBonuses()
        checkMissedAutomations()
    }

    func appDidBecomeActive() {
        checkMissedAutomations()
    }

    func checkMissedAutomations() {
        let now = Date()
        let calendar = Calendar.current

        for (index, automation) in automations.enumerated() where automation.isEnabled {
            let lastMidnight = calendar.startOfDay(for: now)
            if automation.time < now && automation.time > lastMidnight {
                // Invece di eseguire lo spin, aggiorniamo lo stato dell'automazione
                automations[index].lastExecutionDate = automation.time
                automations[index].status = .missed
            }
        }

        // Salviamo le modifiche
        saveAutomations()
    }


    func loadSavedAutomations() {
        if let data = try? Data(contentsOf: getAutomationsFileURL()),
           let savedAutomations = try? JSONDecoder().decode([SpinAutomation].self, from: data) {
            automations = savedAutomations
        }
    }

    func saveAutomations() {
        do {
            let data = try JSONEncoder().encode(automations)
            try data.write(to: getAutomationsFileURL(), options: .atomicWrite)
        } catch {
            print("Errore nel salvataggio delle automazioni: \(error)")
        }
    }

    private func getAutomationsFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("spinAutomations.json")
    }

    func addAutomation(_ automation: SpinAutomation) {
        automations.append(automation)
        saveAutomations()
        scheduleNotification(for: automation)
    }

    func removeAutomation(_ automation: SpinAutomation) {
        automations.removeAll { $0.id == automation.id }
        saveAutomations()
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [automation.id.uuidString])
    }

    func toggleAutomation(_ automation: SpinAutomation) {
        if let index = automations.firstIndex(where: { $0.id == automation.id }) {
            automations[index].isEnabled.toggle()
            saveAutomations()
            if automations[index].isEnabled {
                scheduleNotification(for: automations[index])
            } else {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [automation.id.uuidString])
            }
        }
    }

    private func setupAutomationTimer() {
        Timer.publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.checkAndPerformAutomations()
            }
            .store(in: &cancellables)
    }

    func checkAndPerformAutomations() {
        let now = Date()
        for automation in automations where automation.isEnabled {
            let calendar = Calendar.current
            if calendar.compare(now, to: automation.time, toGranularity: .minute) == .orderedSame {
                let automationId = automation.id
                if let lastExecution = lastExecutionTimes[automationId],
                   calendar.isDate(lastExecution, inSameDayAs: now) {
                    continue // Skip if already executed today
                }
                performSpinInBackground(for: automation.site)
                lastExecutionTimes[automationId] = now
                markAutomationAsCompleted(automation)
            }
        }
        DispatchQueue.main.async {
            self.objectWillChange.send()
        }
    }

    private func markAutomationAsCompleted(_ automation: SpinAutomation) {
        if let index = automations.firstIndex(where: { $0.id == automation.id }) {
            automations[index].lastExecutionDate = Date()
            saveAutomations()
        }
    }



    private func scheduleNotification(for automation: SpinAutomation) {
        let content = UNMutableNotificationContent()
        content.title = "Spin Automatico"
        content.body = "È ora di eseguire lo spin per \(automation.site)"
        content.sound = UNNotificationSound.default

        let components = Calendar.current.dateComponents([.hour, .minute], from: automation.time)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        let request = UNNotificationRequest(identifier: automation.id.uuidString, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Errore nella programmazione della notifica: \(error)")
            }
        }
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

    func getLastBonus(for site: String) -> BonusInfo? {
        return bonusHistory[site]?.last
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

    func updateAutomation(_ updatedAutomation: SpinAutomation) {
        print("Entro in updateAutomation")
        if let index = automations.firstIndex(where: { $0.id == updatedAutomation.id }) {
            print("Automazione trovata")
            automations[index] = updatedAutomation
            saveAutomations()
            objectWillChange.send()
            if updatedAutomation.isEnabled {
                scheduleNotification(for: updatedAutomation)
                scheduleBackgroundTask(for: updatedAutomation)
            } else {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [updatedAutomation.id.uuidString])
                cancelBackgroundTask(for: updatedAutomation)
            }
            objectWillChange.send()
        }
    }

    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinautomation", using: nil) { task in
            self.handleBackgroundTask(task: task as! BGAppRefreshTask)
        }
    }

    private func scheduleBackgroundTask(for automation: SpinAutomation) {
        let request = BGAppRefreshTaskRequest(identifier: "simogatti.BetBox.spinautomation")
        request.earliestBeginDate = automation.time

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Errore nella programmazione del task in background: \(error)")
        }
    }

    private func cancelBackgroundTask(for automation: SpinAutomation) {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: "simogatti.BetBox.spinautomation")
    }

    func handleBackgroundTask(task: BGAppRefreshTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        checkAndPerformAutomations()

        task.setTaskCompleted(success: true)
    }

    func performSpinInBackground(for site: String) {
        guard !isSpinPerformedToday(for: site) else { return }

        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
        guard let url = URL(string: urlString) else {
            print("URL non valido per il sito: \(site)")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let task = backgroundSession.dataTask(with: request)
        task.resume()

        // Aggiorna immediatamente lo stato locale
        if let index = automations.firstIndex(where: { $0.site == site }) {
            automations[index].lastExecutionDate = Date()
            saveAutomations()
        }
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
